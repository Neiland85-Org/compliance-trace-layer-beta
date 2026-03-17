import fs from "fs"
import path from "path"

import { runService } from "./compose-runner.js"

const ARCH_ROOT = path.resolve("apps/console/src/architectures")

export async function deployManifest(manifestPath){

  const resolved = path.resolve(manifestPath)

  if(!resolved.startsWith(ARCH_ROOT)){
    throw new Error("invalid manifest path")
  }

  const manifest = JSON.parse(
    fs.readFileSync(resolved)
  )

  const services=[]

  for(const svc of manifest.services){

    const result = await runService(manifest.name,svc)

    services.push(result)

  }

  return services

}
