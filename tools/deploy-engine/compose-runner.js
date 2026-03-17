import { spawn } from "child_process"
import getPort from "get-port"

export async function runService(stack,svc){

  const port = await getPort({port:getPort.makeRange(8081,9000)})

  const name = `${stack}-${svc.name}-${port}`

  return new Promise((resolve,reject)=>{

    const proc = spawn("docker",[
      "run",
      "-d",
      "--name",name,
      "-p",`${port}:${svc.port}`,
      svc.image
    ])

    proc.on("close",(code)=>{

      if(code === 0){

        resolve({
          name,
          port,
          image:svc.image,
          url:`http://localhost:${port}`
        })

      }else{

        reject(new Error("docker run failed"))

      }

    })

  })

}
