package ar.edu.uade.api.deliverygo.notificaciones.mapper;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Notificacion;
import ar.edu.uade.api.deliverygo.notificaciones.dto.NotificacionResponse;

/** Convierte la entidad del dominio en el DTO público. */
public final class NotificacionMapper {

    private NotificacionMapper() {
    }

    public static NotificacionResponse aResponse(Notificacion n) {
        return new NotificacionResponse(
                n.getId(),
                n.getDestinatarioId(),
                n.getCanal().name(),
                n.getPlantilla(),
                n.getTipo() == null ? null : n.getTipo().name(),
                n.getTitulo(),
                n.getMensaje(),
                n.getAccion(),
                n.getEstado().name(),
                n.getIntentos(),
                n.getMotivoFalla(),
                n.getModuloOrigen(),
                n.getReferenciaId(),
                n.getCorrelationId(),
                n.getIpOrigen(),
                n.getRecibidaEn());
    }
}
