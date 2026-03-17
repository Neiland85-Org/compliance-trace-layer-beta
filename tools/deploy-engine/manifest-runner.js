import fs from "fs"
import path from "path"
import { runService } from "./compose-runner.js"

export async function deployManifest(manifestPath){

  const fullPath = path.resolve(manifestPath)

  if(!fs.existsSync(fullPath)){
    throw new Error("manifest not found: " + fullPath)
  }

  const manifest = JSON.parse(fs.readFileSync(fullPath))

  if(!manifest.services || !Array.isArray(manifest.services)){
    throw new Error("invalid manifest format")
  }

  const services = []

  for(const svc of manifest.services){

    if(!svc.name || !svc.image){
      throw new Error("invalid service definition")
    }

    const result = await runService(
      `${manifest.name}-${svc.name}`,
      svc.image,
      svc.port || 80
    )

    services.push(result)

  }

  return services
}
