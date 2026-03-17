import { spawn } from "child_process"

export function runService(service){

  const args = [
    "run",
    "-d",
    "--name",
    service.name,
    "-p",
    `${service.port}:${service.port}`,
    service.image
  ]

  const proc = spawn("docker",args)

  proc.stdout.on("data",d=>console.log(d.toString()))
  proc.stderr.on("data",d=>console.error(d.toString()))

}
