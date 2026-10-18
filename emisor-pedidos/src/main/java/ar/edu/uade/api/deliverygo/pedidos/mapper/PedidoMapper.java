package ar.edu.uade.api.deliverygo.pedidos.mapper;

import ar.edu.uade.api.deliverygo.pedidos.domain.Pedido;
import ar.edu.uade.api.deliverygo.pedidos.dto.PedidoResponse;

/** Convierte la entidad Pedido en el DTO público. */
public final class PedidoMapper {

    private PedidoMapper() {
    }

    public static PedidoResponse aResponse(Pedido p, String receptorUrl) {
        return new PedidoResponse(
                p.getId(),
                p.getUsuarioId(),
                p.getComercioId(),
                p.getDireccionEntregaId(),
                p.getEstado().name(),
                p.getTotal(),
                p.getMoneda(),
                p.getCreadoEn(),
                p.getItems().stream()
                        .map(i -> new PedidoResponse.Item(i.getProductoId(), i.getCantidad(), i.getPrecioUnitario()))
                        .toList(),
                new PedidoResponse.Notificacion(
                        p.getEstadoNotificacion().name(),
                        p.getNotificacionId(),
                        p.getIntentosNotificacion(),
                        p.getUltimoErrorNotificacion(),
                        receptorUrl));
    }
}
