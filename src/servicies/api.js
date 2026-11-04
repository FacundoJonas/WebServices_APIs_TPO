export const BASE_URL = import.meta.env.VITE_API_URL
       ?? 'http://localhost:8089';

export const NOTIF_URL = import.meta.env.VITE_NOTIF_URL ?? '/notif-api';

export const PEDIDOS_URL = import.meta.env.VITE_PEDIDOS_URL ?? '/pedidos-api';
// Los prefijos se reenvían a cada módulo con el proxy de vite.config.js.
// Las direcciones reales van en .env (PEDIDOS_PROXY_TARGET, NOTIF_PROXY_TARGET).
