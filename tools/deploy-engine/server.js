import express from "express"
import fs from "fs"
import path from "path"
import rateLimit from "express-rate-limit"
import { exec } from "child_process"

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

app.use(express.json())
app.use(limiter)

/*
DEPLOY MANIFEST
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

    console.error("MANIFEST ERROR:",err.message)

    res.status(500).json({
      status:"manifest-error",
      error:err.message
    })

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
HEALTH
*/

app.get("/health/:name",(req,res)=>{

  const name = req.params.name

  exec(`docker inspect -f '{{.State.Running}}' ${name}`,(err,stdout)=>{

    if(err){
      return res.status(404).json({status:"not-found"})
    }

    res.json({
      service:name,
      running:stdout.trim() === "true"
    })

  })

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
