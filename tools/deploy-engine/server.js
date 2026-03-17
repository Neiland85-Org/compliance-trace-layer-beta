import express from "express"
import fs from "fs"
import path from "path"
import rateLimit from "express-rate-limit"

import { deployContainer } from "./deploy.js"
import { stopContainer } from "./control.js"
import { deployManifest } from "./manifest-runner.js"

const app = express()

const REGISTRY = path.resolve("tools/deploy-engine/registry/services.json")

/*
SECURITY
*/

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

const ALLOWED_IMAGES = [
  "nginx",
  "node:20",
  "postgres:16"
]

app.use(express.json())
app.use(limiter)

/*
DEPLOY SINGLE CONTAINER
*/

app.post("/deploy", async (req,res)=>{

  try{

    const { name,image } = req.body

    if(!name || !image){
      return res.status(400).json({error:"missing parameters"})
    }

    if(!/^[a-zA-Z0-9_-]+$/.test(name)){
      return res.status(400).json({error:"invalid container name"})
    }

    if(!ALLOWED_IMAGES.includes(image)){
      return res.status(400).json({error:"image not allowed"})
    }

    const result = await deployContainer(name,image)

    res.json({
      status:"running",
      container:result.name,
      service:result.url
    })

  }catch(err){

    console.error(err)

    res.status(500).json({status:"deploy-failed"})
  }

})

/*
DEPLOY STACK MANIFEST
*/

app.post("/deploy-manifest", async (req,res)=>{

  try{

    const { path:manifestPath } = req.body

    if(!manifestPath){
      return res.status(400).json({error:"manifest path required"})
    }

    const result = await deployManifest(manifestPath)

    res.json({
      status:"stack-started",
      services:result
    })

  }catch(err){

    console.error(err)

    res.status(500).json({status:"manifest-error"})
  }

})

/*
REMOVE SERVICE
*/

app.delete("/service/:name", async (req,res)=>{

  try{

    const name = req.params.name

    if(!/^[a-zA-Z0-9_-]+$/.test(name)){
      return res.status(400).json({error:"invalid container name"})
    }

    await stopContainer(name)

    res.json({status:"removed"})

  }catch(err){

    console.error(err)

    res.status(500).json({status:"error"})
  }

})

/*
LIST SERVICES
*/

app.get("/services",(req,res)=>{

  try{

    const data = JSON.parse(fs.readFileSync(REGISTRY))

    res.json(data)

  }catch{

    res.json([])

  }

})

/*
METRICS
*/

app.get("/metrics",(req,res)=>{

  res.json({
    uptime:process.uptime(),
    memory:process.memoryUsage()
  })

})

/*
ACTIVITY
*/

app.get("/activity",(req,res)=>{

  res.json({
    time:new Date().toISOString()
  })

})

app.listen(4000,()=>{
  console.log("trace deploy engine running on 4000")
})
