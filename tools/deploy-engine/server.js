import express from "express"
import fs from "fs"
import path from "path"
import { deployContainer } from "./deploy.js"

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

app.get("/services",(req,res)=>{

  try{
    const data = JSON.parse(fs.readFileSync(REGISTRY))
    res.json(data)
  }
  catch{
    res.json([])
  }

})

app.listen(4000,()=>{
  console.log("trace deploy engine running on 4000")
})
