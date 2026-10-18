package ar.edu.uade.api.deliverygo.notificaciones.domain;

/**
 * Estado de la notificación. En esta prueba no hay envío real de emails:
 * la notificación queda ENVIADA apenas se registra.
 */
public enum EstadoEnvio {
    PENDIENTE,
    ENVIADA,
    FALLIDA
}
