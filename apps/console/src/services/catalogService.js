import { scanArchitectures } from "./architectureScanner"

export async function fetchCatalog(){

  const architectures = await scanArchitectures()

  return architectures

}
