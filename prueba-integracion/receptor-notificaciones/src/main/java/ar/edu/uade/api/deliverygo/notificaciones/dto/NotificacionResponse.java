package ar.edu.uade.api.deliverygo.notificaciones.dto;

import java.time.Instant;

/**
 * DTO de salida: lo que el receptor devuelve sobre una notificación.
 *
 * type, title y action salen de la plantilla y son lo que el Portal necesita
 * para dibujar su tarjeta (ícono/filtro, título y botón). "Leída" no existe
 * en el contrato del Equipo 6: el Portal la maneja de su lado.
 */
public record NotificacionResponse(
        Long id,
        String recipientId,
        String channel,
        String template,
        String type,
        String title,
        String message,
        String action,
        String status,
        int attempts,
        String failureReason,
        String sourceModule,
        String referenceId,
        String correlationId,
        String originIp,
        Instant receivedAt
) {
}
