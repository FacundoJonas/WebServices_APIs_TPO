package ar.edu.uade.api.deliverygo.pedidos.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Resultado de GET /api/v1/diagnostico: prueba la red hacia el receptor paso a paso.
 *
 * @param ok          true si los 4 pasos salieron bien
 * @param receptorUrl URL configurada en RECEPTOR_URL
 * @param pasos       DNS -> TCP -> HTTP ping -> contrato
 */
public record DiagnosticoResponse(
        boolean ok,
        String receptorUrl,
        Instant timestamp,
        List<Paso> pasos
) {

    /**
     * @param nombre      qué se probó
     * @param ok          si funcionó
     * @param ms          cuánto tardó
     * @param detalle     qué pasó exactamente
     * @param sugerencia  qué revisar en la VM si falló (null si ok)
     * @param datos       información extra (ej. lo que respondió el receptor)
     */
    public record Paso(String nombre, boolean ok, long ms, String detalle,
                       String sugerencia, Map<String, Object> datos) {
    }
}
