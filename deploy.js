import { exec } from "child_process"

let port = 8081

export function deployContainer(name,image){

  const assignedPort = port++

  const cmd = `docker run -d --name ${name}-${assignedPort} -p ${assignedPort}:80 ${image}`

  console.log("deploying:",cmd)

  exec(cmd,(err,stdout,stderr)=>{

    if(err){
      console.error(stderr)
      return
    }

    console.log("container running on port",assignedPort)

  })

}