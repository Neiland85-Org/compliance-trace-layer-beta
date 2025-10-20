/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
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