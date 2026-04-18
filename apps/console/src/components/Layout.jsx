export default function Layout({ children }) {
  return (
    <div style={{background:"#050505", minHeight:"100vh", color:"white"}}>
      <header style={{padding:"20px", borderBottom:"1px solid #00FFB2"}}>
        TRACE MARKETPLACE
      </header>

      <main style={{padding:"40px"}}>
        {children}
      </main>
    </div>
  )
}
