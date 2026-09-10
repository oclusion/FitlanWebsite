import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client (usado por chatSocketService para la mensajería en tiempo
  // real) es un paquete CommonJS viejo que asume `global` de Node — no existe
  // en el browser. Sin este define, la app se rompe entera con
  // "ReferenceError: global is not defined" apenas se importa el módulo.
  define: {
    global: 'globalThis',
  },
})
