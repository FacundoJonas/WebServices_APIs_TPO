package ar.edu.uade.api.deliverygo.pedidos.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Lo que el emisor LEE de la respuesta del receptor.
 * {@code ignoreUnknown}: si el receptor agrega campos nuevos, el emisor no se rompe.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NotificacionRemotaResponse(
        Long id,
        String recipientId,
        String template,
        String message,
        String status,
        String originIp,
        String correlationId,
        String receivedAt
) {
}
