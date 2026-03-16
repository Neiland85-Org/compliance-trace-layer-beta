export async function loadArchitectureDocs(id){

  const readmes = import.meta.glob(
    "../architectures/*/README.md",
    { query: "?raw", import: "default", eager: true }
  )

  const diagrams = import.meta.glob(
    "../architectures/*/diagram.json",
    { eager: true }
  )

  const readmeEntry = Object.entries(readmes)
    .find(([path]) => path.includes(id))

  const diagramEntry = Object.entries(diagrams)
    .find(([path]) => path.includes(id))

  return {
    readme: readmeEntry ? readmeEntry[1] : "",
    diagram: diagramEntry ? diagramEntry[1].default : null
  }

}
