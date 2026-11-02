/*
 * Formatos que usan las tarjetas del tablero de métricas.
 */

export function formatearNumero(valor) {
    return valor.toLocaleString("es-AR")
}

export function formatearPorcentaje(parte, total) {
    if (total === 0) return "0%"
    return `${((parte / total) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
}

/*
 * Ejemplo: 23700000 -> "$ 23,7 M"
 */
export function formatearMillones(valor) {
    return `$ ${(valor / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`
}

/*
 * Ejemplo: "2026-10-01" -> "01/10/2026"
 */
export function formatearFechaCorta(iso) {
    const [anio, mes, dia] = iso.split("-")
    return `${dia}/${mes}/${anio}`
}

/*
 * Fecha local en formato YYYY-MM-DD.
 */
export function aIso(fecha) {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0")
    const dia = String(fecha.getDate()).padStart(2, "0")
    return `${fecha.getFullYear()}-${mes}-${dia}`
}
