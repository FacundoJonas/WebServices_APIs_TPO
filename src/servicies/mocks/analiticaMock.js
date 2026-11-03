/*
 * Tablero simulado del Módulo Opiniones y Analítica (CU-10).
 *
 * Cada bloque indica su fuente, porque toda métrica debe
 * indicar período y fuente (RN-09). Si una fuente no responde,
 * el bloque trae "error" y el resto del tablero sigue funcionando.
 */

// Cambiar a true para ver cómo se muestra una falla parcial
const SIMULAR_FALLA_PAGOS = false

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * Cantidad de pedidos de un día. Es fija para cada fecha,
 * así el gráfico no cambia cada vez que se recarga.
 * Los viernes, sábados y domingos tienen más pedidos.
 */
function pedidosDelDia(fecha) {
    const finDeSemana = [0, 5, 6].includes(fecha.getDay())
    const variacion = (fecha.getDate() * 7) % 13
    return (finDeSemana ? 58 : 30) + variacion
}

/*
 * GET /api/v1/analytics/dashboard?from=&to=
 */
export async function obtenerTableroMock(desde, hasta) {

    await esperar(800)

    const porDia = []

    for (let d = new Date(`${desde}T12:00:00`); d <= new Date(`${hasta}T12:00:00`); d.setDate(d.getDate() + 1)) {
        porDia.push({ fecha: d.toISOString().slice(0, 10), cantidad: pedidosDelDia(d) })
    }

    const total = porDia.reduce((suma, dia) => suma + dia.cantidad, 0)

    const entregados = Math.round(total * 0.896)
    const enCamino = Math.round(total * 0.033)
    const enPreparacion = Math.round(total * 0.029)
    const cancelados = total - entregados - enCamino - enPreparacion

    const operaciones = Math.round(total * 1.05)
    const aprobados = Math.round(operaciones * 0.942)
    const rechazados = Math.round(operaciones * 0.041)

    return {
        periodo: { desde, hasta },

        pedidos: {
            fuente: "Pedidos",
            total,
            variacion: 12,
            porDia,
            porEstado: [
                { estado: "ENTREGADO", cantidad: entregados },
                { estado: "EN_CAMINO", cantidad: enCamino },
                { estado: "EN_PREPARACION", cantidad: enPreparacion },
                { estado: "CANCELADO", cantidad: cancelados },
            ],
        },

        pagos: SIMULAR_FALLA_PAGOS
            ? { fuente: "Pagos", error: "El Módulo Pagos no respondió a tiempo." }
            : {
                fuente: "Pagos",
                facturacion: total * 18450,
                variacion: 18.4,
                aprobados,
                rechazados,
                fondosInsuficientes: operaciones - aprobados - rechazados,
            },

        opiniones: {
            fuente: "Opiniones",
            promedio: 4.6,
            resenas: Math.round(total * 2.65),
        },

        topComercios: {
            fuente: "Pedidos / Opiniones",
            items: [
                { id: 1, nombre: "La Birra Bar", pedidos: Math.round(total * 0.27), rating: 4.8, tiempoMedio: 28 },
                { id: 2, nombre: "Pizzería Güerrín", pedidos: Math.round(total * 0.23), rating: 4.9, tiempoMedio: 32 },
                { id: 3, nombre: "Sushiclub Recoleta", pedidos: Math.round(total * 0.14), rating: 4.7, tiempoMedio: 41 },
            ],
        },

        topRepartidores: {
            fuente: "Logística / Opiniones",
            items: [
                { id: 1, nombre: "Matías González", entregas: Math.round(total * 0.11), rating: 4.95 },
                { id: 2, nombre: "Camila Romero", entregas: Math.round(total * 0.1), rating: 4.92 },
                { id: 3, nombre: "Federico Paz", entregas: Math.round(total * 0.09), rating: 4.88 },
            ],
        },
    }
}
