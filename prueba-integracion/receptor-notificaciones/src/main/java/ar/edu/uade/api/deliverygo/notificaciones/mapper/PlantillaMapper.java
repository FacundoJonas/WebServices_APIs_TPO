package ar.edu.uade.api.deliverygo.notificaciones.mapper;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import ar.edu.uade.api.deliverygo.notificaciones.dto.PlantillaResponse;

/** Convierte la entidad Plantilla en el DTO público. */
public final class PlantillaMapper {

    private PlantillaMapper() {
    }

    public static PlantillaResponse aResponse(Plantilla p) {
        return new PlantillaResponse(
                p.getCodigo(),
                p.getTipo().name(),
                p.getTitulo(),
                p.getTexto(),
                p.getAccion(),
                p.getDatosRequeridos(),
                p.isActiva(),
                p.getActualizadaEn());
    }
}
