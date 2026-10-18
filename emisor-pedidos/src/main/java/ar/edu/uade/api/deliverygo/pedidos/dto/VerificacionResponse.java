package ar.edu.uade.api.deliverygo.pedidos.dto;

/**
 * Resultado de GET /api/v1/orders/{id}/verificacion: lo que el RECEPTOR
 * tiene guardado para la notificación de ese pedido.
 *
 * Los datos vienen de la base del receptor (otra CT), no de la del emisor:
 * por eso sirven para comprobar que la integración funcionó de verdad.
 *
 * @param orderId         pedido en el emisor
 * @param notificationId  id de la notificación en el receptor
 * @param recipientId     destinatario que guardó el receptor
 * @param message         mensaje armado por el receptor
 * @param status          estado en el receptor
 * @param originIp        IP desde la que el receptor vio llegar la petición
 * @param correlationId   correlationId que guardó el receptor
 * @param receivedAt      cuándo la recibió
 * @param receptorUrl     a qué receptor se le preguntó
 */
public record VerificacionResponse(
        Long orderId,
        Long notificationId,
        String recipientId,
        String message,
        String status,
        String originIp,
        String correlationId,
        String receivedAt,
        String receptorUrl
) {
}
