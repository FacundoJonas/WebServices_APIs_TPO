package ar.edu.uade.api.deliverygo.notificaciones.dto;

import java.time.Instant;
import java.util.List;

/**
 * DTO de salida de una plantilla.
 *
 * @param requiredData claves que hay que mandar en "data" al usar la plantilla
 */
public record PlantillaResponse(
        String code,
        String type,
        String title,
        String text,
        String action,
        List<String> requiredData,
        boolean active,
        Instant updatedAt
) {
}
