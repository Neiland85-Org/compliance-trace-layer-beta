import { exec } from "child_process"
import { promisify } from "util"
import getPort from "get-port"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

const REGISTRY = path.resolve("tools/deploy-engine/registry/services.json")

function loadRegistry(){
  try{
    return JSON.parse(fs.readFileSync(REGISTRY))
  }catch{
    return []
  }
}

function saveRegistry(data){
  fs.writeFileSync(REGISTRY,JSON.stringify(data,null,2))
}

export async function deployContainer(name,image){

  const assignedPort = await getPort({ port: getPort.makeRange(8081,9000) })

  const containerName = `${name}-${assignedPort}`

  const cmd = `docker run -d --name ${containerName} -p ${assignedPort}:80 ${image}`

  console.log("deploying:",cmd)

  await execAsync(cmd)

  const service = {
    name:containerName,
    port:assignedPort,
    url:`http://localhost:${assignedPort}`,
    image,
    created:new Date().toISOString()
  }

  const registry = loadRegistry()
  registry.push(service)
  saveRegistry(registry)

  return service

}
