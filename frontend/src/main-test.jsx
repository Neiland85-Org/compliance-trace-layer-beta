import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function SimpleApp() {
  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🚀 TEST APP FUNCIONANDO</h1>
      <p>Si puedes ver esto, React está funcionando correctamente.</p>
      <div style={{ background: '#333', padding: '10px', marginTop: '20px' }}>
        <p>Backend URL: http://localhost:4000</p>
        <p>Frontend URL: http://localhost:5173</p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SimpleApp />
  </StrictMode>,
)