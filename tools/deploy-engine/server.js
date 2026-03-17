import express from "express"
import fs from "fs"
import path from "path"

import { deployContainer } from "./deploy.js"
import { stopContainer } from "./control.js"
import { deployManifest } from "./manifest-runner.js"

const app = express()

const REGISTRY = path.resolve("tools/deploy-engine/registry/services.json")

process.on("uncaughtException",(e)=>{
  console.error("UNCAUGHT:",e)
})

process.on("unhandledRejection",(e)=>{
  console.error("REJECTION:",e)
})

process.on("SIGTERM",()=>{
  console.log("SIGTERM received but ignored")
})

process.on("SIGINT",()=>{
  console.log("SIGINT received but ignored")
})

app.use(express.json())

/*
DEPLOY SINGLE CONTAINER
*/
app.post("/deploy",async (req,res)=>{

  try{

    const { name,image } = req.body

    const result = await deployContainer(name,image)

    res.json({
      status:"running",
      container:result.name,
      service:result.url
    })

  }
  catch(err){

    console.error("deploy error:",err)

    res.status(500).json({
      status:"deploy-failed"
    })

  }

})

/*
DEPLOY ARCHITECTURE MANIFEST
*/
app.post("/deploy-manifest",(req,res)=>{

  const { path:manifestPath } = req.body

  try{

    deployManifest(manifestPath)

    res.json({
      status:"stack-started"
    })

  }
  catch(err){

    console.error("manifest error:",err)

    res.status(500).json({
      status:"manifest-error"
    })

  }

})

/*
REMOVE SERVICE
*/
app.delete("/service/:name",async(req,res)=>{

  try{

    await stopContainer(req.params.name)

    res.json({
      status:"removed"
    })

  }
  catch(err){

    console.error("remove error:",err)

    res.status(500).json({
      status:"error"
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

  }
  catch{

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
