package ar.edu.uade.api.deliverygo.notificaciones.config;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import ar.edu.uade.api.deliverygo.notificaciones.domain.TipoNotificacion;
import ar.edu.uade.api.deliverygo.notificaciones.repository.PlantillaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Carga las plantillas que usa el emisor si la base está vacía
 * (datos de prueba reproducibles, criterio de aceptación del TPO).
 *
 * Si ya hay plantillas no hace nada: lo que se editó desde la página se conserva.
 */
@Component
public class PlantillasIniciales implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlantillasIniciales.class);

    private final PlantillaRepository repository;

    public PlantillasIniciales(PlantillaRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }

        List<Plantilla> iniciales = List.of(
                new Plantilla("PEDIDO_CREADO", TipoNotificacion.PEDIDO, "Pedido #{orderId} creado",
                        "Tu pedido #{orderId} por $ {total} fue creado y está pendiente de pago.", "Ver pedido"),
                new Plantilla("PEDIDO_CONFIRMADO", TipoNotificacion.PEDIDO, "Pedido #{orderId} confirmado",
                        "Tu pedido #{orderId} fue confirmado. ¡Ya lo están preparando!", "Ver seguimiento"),
                new Plantilla("PRUEBA_CONEXION", TipoNotificacion.SISTEMA, "Prueba de conexión",
                        "Mensaje de prueba de conexión entre máquinas virtuales.", null));

        repository.saveAll(iniciales);
        log.info("Se cargaron {} plantillas iniciales", iniciales.size());
    }
}
