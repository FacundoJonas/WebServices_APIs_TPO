/*
 * Cliente HTTP del Módulo Notificaciones (Equipo 006).
 *
 * ESTE ARCHIVO SIRVE DE MODELO PARA LOS DEMÁS SERVICIOS. Tiene 6 partes:
 *   1. Imports y dirección base.
 *   2. Interruptor USE_MOCK.
 *   3. Ayudantes internos (headers, errores, páginas).
 *   4. Traducción backend -> pantalla (mapear...).
 *   5. Funciones exportadas: una por endpoint que usa el Portal.
 *   6. (En otro archivo) el mock, con la forma del DTO del backend.
 *
 * Qué le toca al Portal (Guía Funcional, backlog del Equipo 6):
 *   - CU-04 Consultar estado de una notificación  -> obtenerNotificacion
 *   - CU-06 Historial de notificaciones del usuario -> listarNotificacionesDeUsuario
 *   - CU-08 Canales EMAIL, PUSH o IN_APP           -> listarCanales
 *   - CU-10 Marcar notificación como leída         -> marcarNotificacionLeida
 * Crear notificaciones, reintentarlas y administrar plantillas lo hacen
 * los otros módulos o la administración del 006, no el Portal.
 */

// ─── 1. Imports y dirección base ────────────────────────────────────────────

/*
 * NOTIF_URL vale "/notif-api" (ver .env). El proxy de vite.config.js
 * reenvía /notif-api/... a NOTIF_PROXY_TARGET (el servidor del 006),
 * sacándole el prefijo. Por eso las rutas de abajo son las del Swagger.
 */
import { NOTIF_URL } from './api';
import { obtenerToken } from './authServicie';
import {
    listarNotificacionesDeUsuarioMock,
    obtenerNotificacionMock,
    marcarNotificacionLeidaMock,
    listarPlantillasMock,
    listarCanalesMock,
} from './mocks/notificacionesMock';

/*
 * Las rutas del 006 no comparten un único prefijo
 * (/notifications, /users/{id}/notifications, /templates, /channels),
 * así que la base llega hasta /api/v1 y cada función completa su ruta.
 */
const API = `${NOTIF_URL}/api/v1`;

// ─── 2. Interruptor mock / real ─────────────────────────────────────────────

/*
 * false: llama al Módulo Notificaciones real (a través del proxy).
 * true:  usa los datos de mocks/notificacionesMock.js.
 * Si el 006 no está levantado, ponelo en true para seguir trabajando.
 */
const USE_MOCK = true;

// ─── 3. Ayudantes internos (no se exportan) ─────────────────────────────────

/*
 * El módulo valida el JWT que emite Usuarios en todas sus operaciones
 * (SecurityConfig del repo DeliveryGo-Notificaciones: anyRequest().authenticated(),
 * claims "sub" = usuario y "role"). Sin token responde 401.
 * Content-Type solo hace falta cuando se envía un body.
 */
function headers() {
    const token = obtenerToken();

    return {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

/*
 * Tiempo máximo de espera por respuesta. Si el 006 está caído o la red no
 * llega, la pantalla no se queda cargando para siempre (checklist de
 * integración del enunciado: "Timeout y errores contemplados").
 */
const TIEMPO_MAXIMO_MS = 8000;

/*
 * Hace el pedido HTTP y devuelve el JSON. Concentra en un solo lugar:
 *   - la dirección base y los headers;
 *   - el tiempo máximo de espera (AbortSignal.timeout);
 *   - los errores: el detalle técnico va a la consola (F12) y a la
 *     pantalla le llega un mensaje amigable.
 * El backend responde los errores con el formato normalizado del
 * enunciado: { timestamp, status, code, message, path, correlationId }.
 *
 * @param {string} ruta     ruta del Swagger después de /api/v1 (ej. "/channels")
 * @param {Object} opciones opciones extra de fetch (ej. { method: 'PATCH' })
 * @param {string} mensaje  texto para el usuario si algo sale mal
 */
async function pedir(ruta, opciones, mensaje) {

    let r;

    try {
        r = await fetch(`${API}${ruta}`, {
            headers: headers(),
            signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
            ...opciones
        });
    } catch (error) {
        // No hubo respuesta: red caída, proxy sin destino o tiempo agotado.
        console.error(`[Notificaciones] sin respuesta de ${ruta}`, error);
        throw new Error(`${mensaje} El servicio de notificaciones no responde.`, { cause: error });
    }

    if (!r.ok) {
        // Hubo respuesta, pero con error (4xx o 5xx).
        const detalle = await r.json().catch(() => null);
        console.error(`[Notificaciones] ${r.status} ${ruta}`, detalle);
        throw new Error(mensaje);
    }

    return r.json();
}

/*
 * El Swagger dice que el historial es una "página", pero no su forma.
 * Esto acepta una lista directa o los formatos de página más comunes
 * de Spring ({ content: [...] }) o del resto del ecosistema ({ items: [...] }).
 * TODO: confirmar con el 006 la forma real y simplificar.
 */
function extraerLista(data) {
    if (Array.isArray(data)) return data;
    return data?.content ?? data?.items ?? [];
}

// ─── 4. Traducción backend -> pantalla ──────────────────────────────────────

/*
 * Cómo se muestra cada estado del 006 en la etiqueta (badge) de la tarjeta.
 * Patrón "objeto de configuración": un dato del backend -> cómo se ve.
 */
const estados = {
    PENDIENTE: { badge: "Pendiente", badgeClass: "bg-surface-container-high text-on-surface-variant" },
    ENVIADA: { badge: "Enviada", badgeClass: "bg-primary-fixed text-on-primary-container" },
    FALLIDA: { badge: "No enviada", badgeClass: "bg-error-container text-on-error-container" },
    FALLIDA_DEFINITIVA: { badge: "No enviada", badgeClass: "bg-error-container text-on-error-container" },
};

/*
 * Ícono según el canal por el que se envió.
 */
const iconosPorCanal = {
    EMAIL: { icon: "mail", iconClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
    PUSH: { icon: "notifications_active", iconClass: "bg-primary-fixed/30 text-primary-container" },
    IN_APP: { icon: "chat", iconClass: "bg-surface-container text-primary" },
};

/*
 * La pantalla filtra por tipo (Pedidos / Promociones / Sistema), pero el
 * 006 no manda un tipo. Se deduce del nombre de la plantilla.
 * TODO: pedirle al 006 un campo "categoria" en la plantilla.
 */
function tipoDePlantilla(plantilla) {

    const nombre = (plantilla?.nombre ?? "").toUpperCase();

    if (/PEDIDO|ENTREGA|REPARTIDOR/.test(nombre)) return "order";
    if (/PROMO|DESCUENTO|CUPON/.test(nombre)) return "promo";
    return "system";
}

/*
 * Acción de la derecha de la tarjeta (es obligatoria: la tarjeta la usa siempre).
 */
const accionesPorTipo = {
    order: { kind: "link", label: "Ver mis pedidos" },
    promo: { kind: "button", label: "Ver promoción" },
    system: { kind: "verified", label: "Cuenta" },
};

/*
 * Reemplaza las variables de la plantilla por sus valores.
 * Ejemplo: "Hola {{nombre}}" + { nombre: "Ana" } -> "Hola Ana".
 * Acepta {{variable}} y {variable}.
 * TODO: confirmar con el 006 la sintaxis de sus variables.
 */
function completarTexto(texto, parametros = {}) {
    return (texto ?? "").replace(/\{\{?\s*(\w+)\s*\}?\}/g, (original, variable) =>
        parametros[variable] ?? original
    );
}

/*
 * Agrupa por fecha para los bloques Hoy / Esta semana / Anteriores.
 */
function grupoPorFecha(fecha) {

    if (!fecha) return "older";

    const horas = (Date.now() - new Date(fecha).getTime()) / (60 * 60 * 1000);

    if (horas < 24) return "today";
    if (horas < 24 * 7) return "this-week";
    return "older";
}

/*
 * Texto corto de la fecha: "Hace 5 min", "Hace 3 h", "12/10/2026".
 */
function textoDeFecha(fecha) {

    if (!fecha) return "";

    const minutos = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);

    if (minutos < 1) return "Recién";
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 60 * 24) return `Hace ${Math.round(minutos / 60)} h`;
    return new Date(fecha).toLocaleDateString("es-AR");
}

/*
 * Convierte una notificación del 006 (y su plantilla) en lo que dibuja
 * NotificationCard: { id, group, type, read, icon, iconClass, badge,
 * badgeClass, time, title, description, action }.
 *
 * Si el backend cambia un nombre de campo, se ajusta SOLO acá.
 */
function mapearNotificacion(dto, plantilla) {

    const tipo = tipoDePlantilla(plantilla);
    const estado = estados[dto.estado] ?? estados.PENDIENTE;
    const icono = iconosPorCanal[dto.canal] ?? iconosPorCanal.IN_APP;

    return {
        id: dto.id,
        group: grupoPorFecha(dto.fechaCreacion),
        type: tipo,
        // TODO: el Swagger no dice cómo saber si está leída; se usa "leida" si llega.
        read: Boolean(dto.leida),
        ...icono,
        ...estado,
        time: textoDeFecha(dto.fechaCreacion),
        title: completarTexto(plantilla?.asunto, dto.parametros) || "Notificación",
        description: completarTexto(plantilla?.cuerpo, dto.parametros),
        action: accionesPorTipo[tipo],
    };
}

// ─── 5. Funciones exportadas ────────────────────────────────────────────────

/*
 * Las plantillas casi no cambian: se piden una sola vez (GET /templates
 * trae todas) y se guardan en memoria mientras la página esté abierta.
 * Es más eficiente que pedir la plantilla de cada notificación.
 */
let plantillasEnCache = null;

async function obtenerPlantillasPorId() {

    if (!plantillasEnCache) {

        let lista;

        if (USE_MOCK) {
            lista = await listarPlantillasMock();
        } else {
            lista = await pedir('/templates', {}, 'No pudimos cargar el contenido de las notificaciones.');
        }

        // Map: id -> plantilla, para buscarla rápido al mapear.
        plantillasEnCache = new Map(lista.map(p => [p.id, p]));
    }

    return plantillasEnCache;
}

/**
 * CU-06 (Equipo 006) · GET /api/v1/users/{id}/notifications
 * Historial de notificaciones del usuario, listo para dibujar.
 *
 * @param {number} usuarioId  id del usuario logueado (useAuth().usuario.id)
 * @returns {Promise<Array>}  notificaciones con la forma de NotificationCard
 */
export async function listarNotificacionesDeUsuario(usuarioId) {

    let data;

    if (USE_MOCK) {
        data = await listarNotificacionesDeUsuarioMock(usuarioId);
    } else {
        data = await pedir(`/users/${usuarioId}/notifications`, {}, 'No pudimos cargar tus notificaciones.');
    }

    // Se piden las plantillas una vez y se cruzan con cada notificación.
    const plantillas = await obtenerPlantillasPorId();

    return extraerLista(data).map(dto => mapearNotificacion(dto, plantillas.get(dto.plantillaId)));
}

/**
 * CU-04 (Equipo 006) · GET /api/v1/notifications/{id}
 * Estado actual de una notificación (dato crudo del backend).
 *
 * @param {number} id
 * @returns {Promise<Object>} NotificacionResponseDto
 */
export async function obtenerNotificacion(id) {

    if (USE_MOCK) {
        return obtenerNotificacionMock(id);
    }

    return pedir(`/notifications/${id}`, {}, 'No pudimos cargar la notificación.');
}

/**
 * CU-10 (Equipo 006) · PATCH /api/v1/notifications/{id}/read
 * Marca una notificación interna como leída. No lleva body.
 *
 * @param {number} id
 * @returns {Promise<Object>} NotificacionResponseDto actualizado
 */
export async function marcarNotificacionLeida(id) {

    if (USE_MOCK) {
        return marcarNotificacionLeidaMock(id);
    }

    // PATCH sin body: no hace falta Content-Type.
    return pedir(`/notifications/${id}/read`, { method: 'PATCH' }, 'No pudimos marcar la notificación como leída.');
}

/**
 * CU-08 (Equipo 006) · GET /api/v1/channels
 * Canales disponibles (EMAIL, PUSH, IN_APP) y si están activos.
 * Habilitarlos o deshabilitarlos (PATCH /channels/{tipo}) es de la
 * administración del 006, no del cliente: no se incluye.
 *
 * @returns {Promise<Array>} CanalDto[]  { tipo, nombre, activo }
 */
export async function listarCanales() {

    if (USE_MOCK) {
        return listarCanalesMock();
    }

    return pedir('/channels', {}, 'No pudimos cargar los canales de notificación.');
}
