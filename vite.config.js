import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/*
 * Arma una entrada de proxy: el navegador llama a localhost con el prefijo
 * (ej. /pedidos-api/pedidos) y Vite lo reenvía al módulo sin el prefijo
 * (ej. http://<ip>:<puerto>/pedidos). Así no hace falta CORS en desarrollo.
 */
function proxyHacia(target, prefijo) {
  return {
    target,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^${prefijo}`), ''),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  /*
   * Las direcciones reales de los módulos se leen de .env (compartido, lo usa
   * la PC del equipo 008). En una PC puntual se pueden pisar con .env.local.
   * El tercer parámetro '' carga también las variables sin prefijo VITE_,
   * que no se exponen al navegador.
   */
  const env = loadEnv(mode, process.cwd(), '')

  const proxy = {}

  if (env.PEDIDOS_PROXY_TARGET) {
    proxy['/pedidos-api'] = proxyHacia(env.PEDIDOS_PROXY_TARGET, '/pedidos-api')
  }

  if (env.NOTIF_PROXY_TARGET) {
    proxy['/notif-api'] = proxyHacia(env.NOTIF_PROXY_TARGET, '/notif-api')
  }

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: { proxy },
  }
})
