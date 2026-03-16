import { useActivityStore } from "../stores/activityStore"

export async function deployArchitecture(arch){

  const add = useActivityStore.getState().addEvent

  add({message:`Deploying ${arch.name}`})

  const res = await fetch("http://localhost:4000/deploy",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      name:arch.id,
      image:"nginx"
    })
  })

  const data = await res.json()

  add({
    message:`Service running: ${data.service}`
  })

}
