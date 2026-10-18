package ar.edu.uade.api.deliverygo.pedidos.domain;

/** Resultado de avisarle al receptor que se creó el pedido. */
public enum EstadoNotificacion {
    /** Todavía no se intentó. */
    PENDIENTE,
    /** El receptor la recibió (respondió 2xx). */
    ENVIADA,
    /** Falló: el detalle queda en {@code ultimoErrorNotificacion}. Se puede reintentar. */
    FALLIDA
}
