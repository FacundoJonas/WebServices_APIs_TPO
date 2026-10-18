package ar.edu.uade.api.deliverygo.notificaciones.service;

import ar.edu.uade.api.deliverygo.notificaciones.config.CorrelationIdFilter;
import ar.edu.uade.api.deliverygo.notificaciones.config.SimulacionProperties;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Notificacion;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CrearNotificacionRequest;
import ar.edu.uade.api.deliverygo.notificaciones.exception.ApiException;
import ar.edu.uade.api.deliverygo.notificaciones.repository.NotificacionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Reglas de negocio del receptor.
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final NotificacionRepository repository;
    private final SimulacionProperties simulacion;

    public NotificacionService(NotificacionRepository repository, SimulacionProperties simulacion) {
        this.repository = repository;
        this.simulacion = simulacion;
    }

    /** Resultado de registrar: la notificación y si es nueva o repetida (idempotencia). */
    public record Resultado(Notificacion notificacion, boolean nueva) {
    }

    @Transactional
    public Resultado registrar(CrearNotificacionRequest request, String claveIdempotencia, String ipOrigen) {

        aplicarSimulacion();

        // Idempotencia: si el emisor reintenta con la misma clave, no se duplica.
        if (claveIdempotencia != null && !claveIdempotencia.isBlank()) {
            Optional<Notificacion> existente = repository.findByClaveIdempotencia(claveIdempotencia);
            if (existente.isPresent()) {
                log.info("Solicitud repetida con Idempotency-Key={}: se devuelve la notificación {}",
                        claveIdempotencia, existente.get().getId());
                return new Resultado(existente.get(), false);
            }
        } else {
            claveIdempotencia = null;
        }

        Plantilla plantilla = buscarPlantilla(request.template());
        Map<String, Object> datos = request.data() == null ? Map.of() : request.data();
        validarDatos(plantilla, datos);

        Notificacion notificacion = new Notificacion(
                request.recipientId(),
                Canal.valueOf(request.channel()),
                plantilla,
                plantilla.armarMensaje(datos),
                request.sourceModule(),
                request.referenceId(),
                claveIdempotencia,
                CorrelationIdFilter.actual(),
                ipOrigen);

        Notificacion guardada = repository.save(notificacion);

        log.info("Notificación {} recibida desde {} (módulo {}): {}",
                guardada.getId(), ipOrigen, request.sourceModule(), guardada.getMensaje());

        return new Resultado(guardada, true);
    }

    @Transactional(readOnly = true)
    public Notificacion buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICACION_INEXISTENTE",
                        "No existe la notificación " + id));
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listarPorUsuario(String usuarioId) {
        return repository.findByDestinatarioIdOrderByRecibidaEnDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listarTodas() {
        return repository.findAllByOrderByRecibidaEnDesc();
    }

    /** 422: la plantilla no existe (regla de negocio, no error de formato). */
    private Plantilla buscarPlantilla(String nombre) {
        try {
            return Plantilla.valueOf(nombre);
        } catch (IllegalArgumentException e) {
            String validas = Arrays.stream(Plantilla.values()).map(Enum::name).collect(Collectors.joining(", "));
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "PLANTILLA_INVALIDA",
                    "La plantilla '" + nombre + "' no existe. Válidas: " + validas);
        }
    }

    private void validarDatos(Plantilla plantilla, Map<String, Object> datos) {
        List<String> faltantes = plantilla.getDatosRequeridos().stream()
                .filter(clave -> datos.get(clave) == null)
                .toList();

        if (!faltantes.isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "DATOS_INCOMPLETOS",
                    "La plantilla " + plantilla + " requiere: " + String.join(", ", faltantes));
        }
    }

    /** Demora y fallas artificiales, configurables por variables de entorno. */
    private void aplicarSimulacion() {
        if (simulacion.demoraMs() > 0) {
            log.warn("SIMULACIÓN: demorando la respuesta {} ms", simulacion.demoraMs());
            try {
                Thread.sleep(simulacion.demoraMs());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        if (simulacion.porcentajeFalla() > 0
                && ThreadLocalRandom.current().nextInt(100) < simulacion.porcentajeFalla()) {
            log.warn("SIMULACIÓN: respondiendo 503 a propósito");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "FALLA_SIMULADA",
                    "Falla simulada del receptor (SIMULAR_FALLA_PORCENTAJE=" + simulacion.porcentajeFalla() + ")");
        }
    }
}
