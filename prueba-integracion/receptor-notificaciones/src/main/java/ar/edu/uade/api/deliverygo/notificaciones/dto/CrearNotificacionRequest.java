package ar.edu.uade.api.deliverygo.notificaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * DTO de entrada de POST /api/v1/notifications.
 *
 * Los nombres de los campos están en inglés porque son el CONTRATO público
 * (igual que el ejemplo de la consigna: userId, merchantId...).
 *
 * @param recipientId  id del usuario destinatario (obligatorio)
 * @param channel      EMAIL, PUSH o INTERNA (obligatorio)
 * @param template     PEDIDO_CREADO, PEDIDO_CONFIRMADO o PRUEBA_CONEXION (obligatorio)
 * @param data         valores que completan la plantilla (ej. orderId, total)
 * @param sourceModule módulo que pide la notificación (ej. "pedidos")
 * @param referenceId  id del recurso de origen (ej. id del pedido)
 */
public record CrearNotificacionRequest(
        @NotBlank(message = "recipientId es obligatorio")
        @Size(max = 100, message = "recipientId admite hasta 100 caracteres")
        String recipientId,

        @NotBlank(message = "channel es obligatorio")
        @Pattern(regexp = "EMAIL|PUSH|INTERNA", message = "channel debe ser EMAIL, PUSH o INTERNA")
        String channel,

        @NotBlank(message = "template es obligatorio")
        String template,

        Map<String, Object> data,

        @Size(max = 50, message = "sourceModule admite hasta 50 caracteres")
        String sourceModule,

        @Size(max = 100, message = "referenceId admite hasta 100 caracteres")
        String referenceId
) {
}
