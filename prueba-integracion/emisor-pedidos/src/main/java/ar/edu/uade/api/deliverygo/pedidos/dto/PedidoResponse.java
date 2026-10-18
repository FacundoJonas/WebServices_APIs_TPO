package ar.edu.uade.api.deliverygo.pedidos.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO de salida del pedido. Incluye el bloque {@code notification} para ver,
 * en la misma respuesta, si la integración con la otra VM funcionó.
 */
public record PedidoResponse(
        Long id,
        String userId,
        String merchantId,
        String deliveryAddressId,
        String status,
        BigDecimal total,
        String currency,
        Instant createdAt,
        List<Item> items,
        Notificacion notification
) {

    public record Item(String productId, int quantity, BigDecimal unitPrice) {
    }

    /**
     * @param status          PENDIENTE, ENVIADA o FALLIDA
     * @param notificationId  id en la base del RECEPTOR (prueba de que llegó)
     * @param attempts        cantidad de intentos
     * @param lastError       motivo del último fallo, si lo hubo
     * @param receptorUrl     a dónde se intentó enviar
     */
    public record Notificacion(String status, Long notificationId, int attempts,
                               String lastError, String receptorUrl) {
    }
}
