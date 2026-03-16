import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
<<<<<<< HEAD
    host: true,
=======
    host: 'localhost', // Configurable via VITE_HOST en .env si es necesario
>>>>>>> d678bff (WIP: guardar cambios locales)
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path  // No reescribir, mantener /api
      }
    }
  }
});
