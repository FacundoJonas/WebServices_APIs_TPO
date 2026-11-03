export const BASE_URL = import.meta.env.VITE_API_URL
       ?? 'http://localhost:8089';

export const NOTIF_URL = import.meta.env.VITE_NOTIF_URL ?? '/notif-api';

export const PEDIDOS_URL = import.meta.env.VITE_PEDIDOS_URL ?? '/pedidos-api';
//Para que fucione en el entorno de desarrollo, se debe agregar la variable VITE_PEDIDOS_URL en el archivo .env y en vite_config.en
