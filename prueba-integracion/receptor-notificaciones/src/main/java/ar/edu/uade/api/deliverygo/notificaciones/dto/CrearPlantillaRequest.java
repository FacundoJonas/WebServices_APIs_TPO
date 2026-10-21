package ar.edu.uade.api.deliverygo.notificaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada de POST /api/v1/templates (endpoint obligatorio del Equipo 6).
 *
 * @param code   identificador que usan los otros módulos (ej. PEDIDO_CREADO)
 * @param type   PEDIDO, PROMOCION o SISTEMA
 * @param title  título; admite marcadores {clave}
 * @param text   mensaje; admite marcadores {clave}
 * @param action texto del botón que muestra el Portal (opcional)
 */
public record CrearPlantillaRequest(
        @NotBlank(message = "code es obligatorio")
        @Pattern(regexp = "[A-Z][A-Z0-9_]{2,49}",
                message = "code debe tener entre 3 y 50 caracteres: mayúsculas, números o _ (ej. PEDIDO_CREADO)")
        String code,

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
        String action
) {
}
