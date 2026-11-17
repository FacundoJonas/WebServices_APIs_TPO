/*
 * Prefijo de cada módulo del ecosistema DeliveryGo.
 *
 * Cada módulo corre en su propio servidor (IP:puerto). El navegador llama
 * siempre a localhost con el prefijo y el proxy de vite.config.js lo reenvía
 * al módulo real (variables *_PROXY_TARGET del .env). Así no hace falta CORS.
 *
 * Las rutas que se agregan después del prefijo son las del contrato
 * consolidado del ecosistema: doc/swagger-ecosistema.yaml (v1.4.0).
 */

export const USUARIOS_URL = import.meta.env.VITE_USUARIOS_URL ?? '/usuarios-api';

export const CATALOGO_URL = import.meta.env.VITE_CATALOGO_URL ?? '/catalogo-api';

export const PEDIDOS_URL = import.meta.env.VITE_PEDIDOS_URL ?? '/pedidos-api';

export const PAGOS_URL = import.meta.env.VITE_PAGOS_URL ?? '/pagos-api';

export const LOGISTICA_URL = import.meta.env.VITE_REPARTIDORES_LOGISTICA_URL ?? '/repartidores-logistica-api';

export const NOTIF_URL = import.meta.env.VITE_NOTIF_URL ?? '/notif-api';

export const ANALITICA_URL = import.meta.env.VITE_OPINIONES_ANALITICA_URL ?? '/opiniones-analitica-api';
