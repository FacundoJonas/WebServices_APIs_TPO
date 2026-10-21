package ar.edu.uade.api.deliverygo.notificaciones.service;

import ar.edu.uade.api.deliverygo.notificaciones.config.EnvioProperties;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SIMULACIÓN: qué canales están caídos en este momento.
 *
 * Vive en memoria: al reiniciar el servicio vuelve a lo que diga CANALES_CAIDOS.
 * Sirve para provocar notificaciones FALLIDA y probar el reintento sin tocar la red.
 */
@Component
public class EstadoCanales {

    private static final Logger log = LoggerFactory.getLogger(EstadoCanales.class);

    private final Set<Canal> caidos = ConcurrentHashMap.newKeySet();

    public EstadoCanales(EnvioProperties propiedades) {
        caidos.addAll(propiedades.canalesCaidos());
    }

    public boolean disponible(Canal canal) {
        return !caidos.contains(canal);
    }

    public void cambiar(Canal canal, boolean disponible) {
        if (disponible) {
            caidos.remove(canal);
        } else {
            caidos.add(canal);
        }
        log.warn("SIMULACIÓN: canal {} {}", canal, disponible ? "operativo" : "caído");
    }
}
