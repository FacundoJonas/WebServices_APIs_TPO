package ar.edu.uade.api.deliverygo.pedidos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO de entrada de POST /api/v1/orders (basado en el ejemplo de la consigna).
 *
 * En el sistema real el precio lo confirma el Módulo Catálogo. En esta prueba
 * no hay Catálogo, por eso el cliente manda {@code unitPrice}.
 */
public record CrearPedidoRequest(
        @NotBlank(message = "userId es obligatorio")
        String userId,

        @NotBlank(message = "merchantId es obligatorio")
        String merchantId,

        String deliveryAddressId,

        @NotEmpty(message = "El pedido debe tener al menos un ítem")
        List<@Valid ItemRequest> items
) {

    public record ItemRequest(
            @NotBlank(message = "productId es obligatorio")
            String productId,

            @Min(value = 1, message = "quantity debe ser al menos 1")
            @Max(value = 99, message = "quantity admite hasta 99")
            int quantity,

            @NotNull(message = "unitPrice es obligatorio")
            @DecimalMin(value = "0.01", message = "unitPrice debe ser mayor a 0")
            BigDecimal unitPrice
    ) {
    }
}
