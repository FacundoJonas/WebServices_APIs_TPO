package ar.edu.uade.api.deliverygo.notificaciones.domain;

/**
 * Estado de la notificación. En esta prueba no hay envío real de emails:
 * la entrega se simula y sólo falla si el canal está marcado como caído
 * (ver EstadoCanales). Una FALLIDA se puede reintentar un número limitado de veces.
 */
public enum EstadoEnvio {
    PENDIENTE,
    ENVIADA,
    FALLIDA
}
