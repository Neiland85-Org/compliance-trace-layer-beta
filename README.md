# Compliance Trace Layer Beta

**Compliance Trace Layer Beta** es un middleware de prueba de concepto (proof-of-concept) diseñado para validar y rastrear transacciones de créditos de carbono, desde la compra inicial hasta el retiro final en la blockchain. Este proyecto combina una arquitectura full-stack con una interfaz inmersiva en 3D, ofreciendo una experiencia visual única para monitorear el cumplimiento ambiental.

## Características Principales

### Backend (Node.js)

- **API REST**: Proporciona endpoints para verificaciones de cumplimiento, trazabilidad de transacciones y gestión de datos de carbono.
- **Rutas de Trazas**: Implementa lógica para rastrear el ciclo de vida de los créditos de carbono, asegurando integridad y transparencia.
- **Arquitectura Modular**: Estructurado con Express.js para facilitar la escalabilidad y mantenimiento.

### Frontend (React + Vite)

- **Interfaz 3D Interactiva**: Utiliza React Three Fiber y Three.js para renderizar una escena cósmica con planetas texturizados (Tierra, Marte y Júpiter), simbolizando la sostenibilidad planetaria y el impacto ambiental.
- **Controles Orbitales**: Permite navegación intuitiva alrededor de los planetas con zoom, rotación y selección interactiva.
- **Dashboard de Verificación**: Incluye componentes como consola UI, modales informativos y animaciones fluidas con Framer Motion.
- **Estilos Modernos**: Implementado con TailwindCSS para un diseño responsivo y minimalista, enfocado en la inmersión.
- **Estado Global**: Gestionado con Zustand para manejar selecciones de planetas y modales dinámicos.

## Tecnologías Utilizadas

- **Frontend**: React 18.3.1, Vite 7.1.10, React Three Fiber 8.18.0, Three.js 0.161.0, TailwindCSS 4.1.14, Framer Motion 11.0.0, Zustand 5.0.8.
- **Backend**: Node.js, Express.js, Axios para integraciones.
- **Herramientas de Desarrollo**: ESLint, PostCSS, Autoprefixer.
- **Control de Versiones**: Git, con ramas main y development para gestión colaborativa.

## Instalación y Uso

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/Neiland85-Org/compliance-trace-layer-beta.git
   cd compliance-trace-layer-beta
   ```

2. **Instala dependencias**:

   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

3. **Ejecuta el proyecto**:

   - Backend: `cd backend && npm start`
   - Frontend: `cd frontend && npm run dev` (accede en `http://localhost:5174`)

4. **Explora la escena 3D**: Interactúa con los planetas para ver detalles sobre cumplimiento y trazabilidad.

## Arquitectura del Proyecto

- **Raíz**: Documentación y configuración general.
- **Backend/**: Servidor Node.js con rutas y lógica de negocio.
- **Frontend/**: Aplicación React con componentes 3D y UI.
- **Public/**: Recursos estáticos como texturas de planetas.

## Contribución

Este proyecto está en fase beta. Para contribuir:

- Crea una rama desde `development`.
- Implementa cambios y realiza commits descriptivos.
- Envía un pull request con descripción bilingüe (español/inglés).

## Licencia

Ver `LICENSE` para detalles.
