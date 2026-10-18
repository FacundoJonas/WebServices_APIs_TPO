
/*
 * Resultado simulado por medio de pago.
 * La Visa Débito siempre se rechaza para poder mostrar RN-05.
 */
const rechazosMock = {
    "visa-4821": "ERR_INSUFFICIENT_FUNDS_704",
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * API-05 POST /pagos y API-10 POST /pagos/reintentar
 * Recibe DTO-06 (PagoRequest) y devuelve DTO-05 (PedidoResponse).
 */
export async function procesarPagoMock(pagoRequest) {

    await esperar(1200)

    const codigoError = rechazosMock[pagoRequest.metodoPagoId]

    if (codigoError) {
        const error = new Error("Tu pago no pudo ser procesado por la entidad emisora (fondos insuficientes o límite excedido).")
        error.codigo = codigoError
        throw error
    }

    return {
        id: pagoRequest.pedidoId,
        estado: "CONFIRMADO",
    }
}
