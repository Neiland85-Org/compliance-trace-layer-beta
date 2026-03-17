import { exec } from "child_process"

export function stopContainer(name){
  return new Promise((resolve,reject)=>{
    exec(`docker rm -f ${name}`,(err)=>{
      if(err) return reject(err)
      resolve()
    })
  })
}
