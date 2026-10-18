package ar.edu.uade.api.deliverygo.notificaciones.dto;

import java.time.Instant;

/**
 * Formato de error normalizado del TPO (sección 6):
 * { timestamp, status, code, message, path, correlationId }
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        String correlationId
) {
}
