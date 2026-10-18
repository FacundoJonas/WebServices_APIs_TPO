package ar.edu.uade.api.deliverygo.notificaciones.dto;

import java.time.Instant;

/** DTO de salida: lo que el receptor devuelve sobre una notificación. */
public record NotificacionResponse(
        Long id,
        String recipientId,
        String channel,
        String template,
        String message,
        String status,
        String sourceModule,
        String referenceId,
        String correlationId,
        String originIp,
        Instant receivedAt
) {
}
