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

  /*
   * Un módulo del ecosistema por fila: [prefijo del Portal, variable con la
   * dirección real]. El prefijo tiene que coincidir con el de src/servicies/api.js.
   * Si la dirección no está cargada, ese módulo no tiene proxy (se usa el mock).
   */
  const modulos = [
    [env.VITE_USUARIOS_URL ?? '/usuarios-api', env.USUARIOS_PROXY_TARGET],
    [env.VITE_CATALOGO_URL ?? '/catalogo-api', env.CATALOGO_PROXY_TARGET],
    [env.VITE_PEDIDOS_URL ?? '/pedidos-api', env.PEDIDOS_PROXY_TARGET],
    [env.VITE_PAGOS_URL ?? '/pagos-api', env.PAGOS_PROXY_TARGET],
    [env.VITE_REPARTIDORES_LOGISTICA_URL ?? '/repartidores-logistica-api', env.REPARTIDORES_LOGISTICA_PROXY_TARGET],
    [env.VITE_NOTIF_URL ?? '/notif-api', env.NOTIF_PROXY_TARGET],
    [env.VITE_OPINIONES_ANALITICA_URL ?? '/opiniones-analitica-api', env.OPINIONES_ANALITICA_PROXY_TARGET],
  ]

  const proxy = {}

  for (const [prefijo, target] of modulos) {
    if (target) {
      proxy[prefijo] = proxyHacia(target, prefijo)
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: { proxy },
  }
})
