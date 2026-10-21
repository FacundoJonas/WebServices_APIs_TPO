package ar.edu.uade.api.deliverygo.notificaciones.dto;

import jakarta.validation.constraints.NotNull;

/** DTO de entrada de PUT /api/v1/channels/{canal} (sólo simulación). */
public record CambiarCanalRequest(
        @NotNull(message = "available es obligatorio")
        Boolean available
) {
}
