#!/usr/bin/env node

import fs from "fs"
import path from "path"

const cmd = process.argv[2]
const arg = process.argv[3]

function inferStack(files){
  const stack = []
  if(files.includes("package.json")) stack.push("Node")
  if(files.includes("requirements.txt")) stack.push("Python")
  if(files.includes("go.mod")) stack.push("Go")
  if(files.includes("Dockerfile")) stack.push("Docker")
  return stack
}

async function importRepo(url){

  const repo = url.split("/").slice(-1)[0].replace(".git","")
  const api = url.replace("github.com","api.github.com/repos")

  const meta = await fetch(api).then(r=>r.json())
  const contents = await fetch(api+"/contents").then(r=>r.json())

  const files = contents.map(c=>c.name)

  const stack = inferStack(files)

  const base = path.resolve("apps/console/src/architectures")
  const dir = path.join(base,repo)

  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir,{recursive:true})
  }

  const manifest = {
    id:repo,
    name:meta.name,
    description:meta.description || "Imported architecture",
    category:"Imported",
    stack,
    repo:url,
    deploy:{type:"service"}
  }

  fs.writeFileSync(
    path.join(dir,"manifest.json"),
    JSON.stringify(manifest,null,2)
  )

  fs.writeFileSync(
    path.join(dir,"README.md"),
`# ${meta.name}

Imported from ${url}

${meta.description || ""}
`
  )

  console.log("architecture imported:",repo)
}

async function main(){

  if(cmd==="add"){

    const name = arg

    const base = path.resolve("apps/console/src/architectures")
    const dir = path.join(base,name)

    if(fs.existsSync(dir)){
      console.log("architecture already exists")
      process.exit(1)
    }

    fs.mkdirSync(dir,{recursive:true})

    const manifest={
      id:name,
      name:name,
      description:"New architecture",
      category:"Infrastructure",
      stack:[],
      deploy:{type:"service"}
    }

    fs.writeFileSync(
      path.join(dir,"manifest.json"),
      JSON.stringify(manifest,null,2)
    )

    fs.writeFileSync(
      path.join(dir,"README.md"),
`# ${name}

Architecture description.
`
    )

    console.log("architecture created:",name)

  }

  else if(cmd==="import"){

    if(!arg){
      console.log("usage: trace import <repo-url>")
      process.exit(1)
    }

    await importRepo(arg)

  }

  else{

    console.log("commands:")
    console.log(" trace add <name>")
    console.log(" trace import <repo-url>")

  }

}

main()
