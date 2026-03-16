export async function scanArchitectures(){

  const modules = import.meta.glob(
    "../architectures/**/manifest.json",
    { eager:true }
  )

  const architectures = Object.values(modules).map(m => m.default)

  return architectures

}
