package ar.edu.uade.api.deliverygo.pedidos.client;

import java.util.Map;

/**
 * Lo que el emisor MANDA al receptor (contrato de POST /api/v1/notifications).
 *
 * Es una clase propia del emisor, NO la misma clase del receptor: cada módulo
 * es independiente y sólo comparten el formato JSON acordado.
 */
public record NotificacionRemotaRequest(
        String recipientId,
        String channel,
        String template,
        Map<String, Object> data,
        String sourceModule,
        String referenceId
) {
}
