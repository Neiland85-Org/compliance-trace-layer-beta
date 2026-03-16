import express from "express"
import fs from "fs"
import { deployContainer } from "./deploy.js"

const app = express()

app.use(express.json())

const REGISTRY = "tools/deploy-engine/registry/services.json"

app.post("/deploy", async (req,res)=>{

  const { name,image } = req.body

  try{

    const result = await deployContainer(name,image)

    res.json({
      status:"running",
      container:result.name,
      service:result.url
    })

  }
  catch{

    res.status(500).json({
      status:"deploy-failed"
    })

  }

})

app.get("/services",(req,res)=>{

  const data = JSON.parse(fs.readFileSync(REGISTRY))
  res.json(data)

})

app.listen(4000,()=>{

  console.log("trace deploy engine running on 4000")

})
