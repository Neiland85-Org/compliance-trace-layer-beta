import fs from "fs"
import { runService } from "./compose-runner.js"

export function deployManifest(path){

  const manifest = JSON.parse(fs.readFileSync(path))

  for(const service of manifest.services){
    runService(service)
  }

}
