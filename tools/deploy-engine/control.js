import { spawn } from "child_process"

export function stopContainer(name){

  return new Promise((resolve,reject)=>{

    if(!/^[a-zA-Z0-9_-]+$/.test(name)){
      return reject(new Error("invalid container name"))
    }

    const proc = spawn("docker",["rm","-f",name])

    proc.on("close",(code)=>{
      if(code === 0) resolve()
      else reject(new Error("docker rm failed"))
    })

  })
}
