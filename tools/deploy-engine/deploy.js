import { spawn } from "child_process"
import fs from "fs"
import path from "path"

const REGISTRY = path.resolve("tools/deploy-engine/registry/services.json")

let port = 8081

function loadRegistry(){
  try { return JSON.parse(fs.readFileSync(REGISTRY)) }
  catch { return [] }
}

function saveRegistry(data){
  fs.writeFileSync(REGISTRY, JSON.stringify(data,null,2))
}

export function deployContainer(name,image){
  return new Promise((resolve,reject)=>{

    const assignedPort = port++
    const containerName = `${name}-${assignedPort}`

    const args = [
      "run","-d",
      "--name",containerName,
      "-p",`${assignedPort}:80`,
      image
    ]

    const proc = spawn("docker",args)

    let err=""

    proc.stderr.on("data",d=> err+=d.toString())

    proc.on("close",code=>{

      if(code!==0){
        return reject(err)
      }

      const service = {
        name:containerName,
        port:assignedPort,
        url:`http://localhost:${assignedPort}`,
        image,
        created:new Date().toISOString()
      }

      const registry = loadRegistry().filter(s=>s.name!==containerName)
      registry.push(service)

      saveRegistry(registry)

      resolve(service)

    })
  })
}
