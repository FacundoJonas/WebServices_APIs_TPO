package ar.edu.uade.api.deliverygo.notificaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada de PUT /api/v1/templates/{code}.
 *
 * Es una EXTENSIÓN de la prueba (la consigna sólo exige POST /templates).
 * El código no se cambia: lo usan los otros módulos y el historial.
 */
public record ActualizarPlantillaRequest(
        @NotBlank(message = "type es obligatorio")
        @Pattern(regexp = "PEDIDO|PROMOCION|SISTEMA", message = "type debe ser PEDIDO, PROMOCION o SISTEMA")
        String type,

        @NotBlank(message = "title es obligatorio")
        @Size(max = 100, message = "title admite hasta 100 caracteres")
        String title,

        @NotBlank(message = "text es obligatorio")
        @Size(max = 500, message = "text admite hasta 500 caracteres")
        String text,

        @Size(max = 40, message = "action admite hasta 40 caracteres")
        String action,

        @NotNull(message = "active es obligatorio")
        Boolean active
) {
}
