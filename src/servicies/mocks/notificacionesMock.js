/*
 * Mock del Módulo Notificaciones (Equipo 006).
 *
 * REGLA PARA ARMAR UN MOCK: los datos tienen la forma que devuelve el
 * BACKEND (los DTO del Swagger), no la forma que usa la pantalla.
 * La traducción a lo que dibuja la tarjeta la hace el servicio
 * (mapearNotificacion). Así, cuando se apaga el mock, la pantalla no cambia.
 *
 * Swagger del ecosistema (v1.4.0):
 * - NotificacionResponseDto { id, destinatarioId, plantillaId, canal, estado, cantidadIntentos }
 * - PlantillaResponseDto    { id, nombre, asunto, cuerpo, activa, canal, variables[] }
 * - CanalDto                { tipo, nombre, activo }
 *
 * CAMPOS A CONFIRMAR CON EL 006 (no están en el Swagger, pero la pantalla
 * los necesita): fechaCreacion, leida y parametros. El mock los incluye para
 * poder probar; el servicio funciona aunque el backend no los mande.
 */

/*
 * Plantillas: de acá sale el texto (asunto y cuerpo) de cada notificación.
 * Las variables van entre llaves dobles: {{nombre}}.
 */
const plantillasMock = [
    {
        id: 1,
        nombre: "PEDIDO_EN_CAMINO",
        asunto: "Tu pedido #{{pedidoId}} está en camino",
        cuerpo: "{{repartidor}} ya retiró tu pedido de {{comercio}} y llega en unos {{minutos}} minutos.",
        activa: true,
        canal: "PUSH",
        variables: ["pedidoId", "repartidor", "comercio", "minutos"],
    },
    {
        id: 2,
        nombre: "PEDIDO_ENTREGADO",
        asunto: "Pedido #{{pedidoId}} entregado",
        cuerpo: "Tu pedido de {{comercio}} fue entregado. ¡Contanos qué te pareció!",
        activa: true,
        canal: "IN_APP",
        variables: ["pedidoId", "comercio"],
    },
    {
        id: 3,
        nombre: "PROMO_DESCUENTO",
        asunto: "{{porcentaje}}% de descuento en {{comercio}}",
        cuerpo: "Usá el cupón {{cupon}} en tu próximo pedido.",
        activa: true,
        canal: "EMAIL",
        variables: ["porcentaje", "comercio", "cupon"],
    },
    {
        id: 4,
        nombre: "BIENVENIDA",
        asunto: "¡Bienvenido a DeliveryGo, {{nombre}}!",
        cuerpo: "Tu cuenta ya está activa. Te avisaremos por este medio el estado de tus pedidos.",
        activa: true,
        canal: "EMAIL",
        variables: ["nombre"],
    },
]

/*
 * Fechas relativas a "ahora", para que los grupos Hoy / Esta semana /
 * Anteriores tengan datos cada vez que se prueba.
 */
function haceHoras(horas) {
    return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString()
}

/*
 * Notificaciones del historial. destinatarioId 2 = cliente@gmail.com.
 */
const notificacionesMock = [
    {
        id: 101, destinatarioId: 2, plantillaId: 1, canal: "PUSH",
        estado: "ENVIADA", cantidadIntentos: 1,
        // campos a confirmar con el 006
        fechaCreacion: haceHoras(0.1), leida: false,
        parametros: { pedidoId: "1012", repartidor: "Matías G.", comercio: "La Birra Bar", minutos: "12" },
    },
    {
        id: 102, destinatarioId: 2, plantillaId: 3, canal: "EMAIL",
        estado: "ENVIADA", cantidadIntentos: 1,
        fechaCreacion: haceHoras(3), leida: false,
        parametros: { porcentaje: "25", comercio: "Pizzería Güerrín", cupon: "GUERRIN25" },
    },
    {
        id: 103, destinatarioId: 2, plantillaId: 2, canal: "IN_APP",
        estado: "ENVIADA", cantidadIntentos: 1,
        fechaCreacion: haceHoras(30), leida: true,
        parametros: { pedidoId: "984", comercio: "Pizzería Güerrín" },
    },
    {
        id: 104, destinatarioId: 2, plantillaId: 4, canal: "EMAIL",
        estado: "FALLIDA", cantidadIntentos: 2,
        fechaCreacion: haceHoras(24 * 15), leida: true,
        parametros: { nombre: "Lucas" },
    },
]

const canalesMock = [
    { tipo: "EMAIL", nombre: "Correo electrónico", activo: true },
    { tipo: "PUSH", nombre: "Notificaciones push", activo: true },
    { tipo: "IN_APP", nombre: "Bandeja interna", activo: true },
]

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * GET /api/v1/users/{id}/notifications
 * El Swagger solo dice "Página del historial". Se simula una página
 * con la forma más común en Spring: { content, page, size, totalElements }.
 */
export async function listarNotificacionesDeUsuarioMock(usuarioId) {

    await esperar(600)

    const content = notificacionesMock
        .filter(n => n.destinatarioId === Number(usuarioId))
        .map(n => ({ ...n }))

    return { content, page: 0, size: content.length, totalElements: content.length }
}

/*
 * GET /api/v1/notifications/{id}
 */
export async function obtenerNotificacionMock(id) {

    await esperar(300)

    const notificacion = notificacionesMock.find(n => n.id === Number(id))

    if (!notificacion) {
        throw new Error("No encontramos la notificación.")
    }

    return { ...notificacion }
}

/*
 * PATCH /api/v1/notifications/{id}/read
 * Modifica el arreglo, así al volver a listar aparece leída.
 */
export async function marcarNotificacionLeidaMock(id) {

    await esperar(300)

    const notificacion = notificacionesMock.find(n => n.id === Number(id))

    if (!notificacion) {
        throw new Error("No encontramos la notificación.")
    }

    notificacion.leida = true

    return { ...notificacion }
}

/*
 * GET /api/v1/templates
 */
export async function listarPlantillasMock() {

    await esperar(300)

    return plantillasMock.map(p => ({ ...p }))
}

/*
 * GET /api/v1/channels
 */
export async function listarCanalesMock() {

    await esperar(300)

    return canalesMock.map(c => ({ ...c }))
}
