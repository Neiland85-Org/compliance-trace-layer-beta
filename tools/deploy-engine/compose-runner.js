import getPort from "get-port"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"

const REGISTRY = path.resolve("tools/deploy-engine/registry/services.json")

export async function runService(name,image,internalPort=80){

  const port = await getPort()

  const containerName = `${name}-${port}`

  const proc = spawn("docker",[
    "run",
    "-d",
    "-p",
    `${port}:${internalPort}`,
    "--name",
    containerName,
    image
  ])

  let stderr = ""

  proc.stderr.on("data",(d)=>{
    stderr += d.toString()
  })

  return new Promise((resolve,reject)=>{

    proc.on("close",(code)=>{

      if(code !== 0){
        console.error("DOCKER ERROR:",stderr)
        return reject(new Error(stderr))
      }

      let registry = []

      try{
        registry = JSON.parse(fs.readFileSync(REGISTRY))
      }catch{}

      const service = {
        name:containerName,
        port,
        url:`http://localhost:${port}`,
        image,
        created:new Date().toISOString()
      }

      registry.push(service)

      fs.writeFileSync(REGISTRY,JSON.stringify(registry,null,2))

      resolve(service)

    })

  })

}
