package ar.edu.uade.api.deliverygo.pedidos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

/**
 * Ítem de un pedido. Es @Embeddable: no tiene tabla ni id propio,
 * vive dentro del pedido (tabla pedido_item).
 */
@Embeddable
public class ItemPedido {

    @Column(nullable = false)
    private String productoId;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    protected ItemPedido() {
    }

    public ItemPedido(String productoId, int cantidad, BigDecimal precioUnitario) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal subtotal() {
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }

    public String getProductoId() { return productoId; }
    public int getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
}
