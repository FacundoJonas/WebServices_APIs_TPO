package ar.edu.uade.api.deliverygo.notificaciones.service;

import ar.edu.uade.api.deliverygo.notificaciones.config.CorrelationIdFilter;
import ar.edu.uade.api.deliverygo.notificaciones.config.EnvioProperties;
import ar.edu.uade.api.deliverygo.notificaciones.config.SimulacionProperties;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import ar.edu.uade.api.deliverygo.notificaciones.domain.EstadoEnvio;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Notificacion;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CrearNotificacionRequest;
import ar.edu.uade.api.deliverygo.notificaciones.exception.ApiException;
import ar.edu.uade.api.deliverygo.notificaciones.repository.NotificacionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Reglas de negocio del receptor.
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private static final int MAX_TITULO = 100;
    private static final int MAX_MENSAJE = 500;

    private final NotificacionRepository repository;
    private final PlantillaService plantillas;
    private final EstadoCanales canales;
    private final SimulacionProperties simulacion;
    private final EnvioProperties envio;

    public NotificacionService(NotificacionRepository repository, PlantillaService plantillas,
                               EstadoCanales canales, SimulacionProperties simulacion, EnvioProperties envio) {
        this.repository = repository;
        this.plantillas = plantillas;
        this.canales = canales;
        this.simulacion = simulacion;
        this.envio = envio;
    }

    /** Resultado de registrar: la notificación y si es nueva o repetida (idempotencia). */
    public record Resultado(Notificacion notificacion, boolean nueva) {
    }

    /**
     * Sin @Transactional a propósito: si dos pedidos con la misma Idempotency-Key
     * llegan a la vez, el segundo choca con el unique al guardar. Fuera de una
     * transacción se puede capturar ese choque y volver a leer la que ganó.
     */
    public Resultado registrar(CrearNotificacionRequest request, String claveIdempotencia, String ipOrigen) {

        String clave = claveIdempotencia == null || claveIdempotencia.isBlank() ? null : claveIdempotencia;

        // Idempotencia ANTES de la simulación: reintentar algo ya guardado no debe recibir una falla simulada.
        if (clave != null) {
            Optional<Resultado> repetida = buscarRepetida(clave);
            if (repetida.isPresent()) {
                return repetida.get();
            }
        }

        aplicarSimulacion();

        Plantilla plantilla = plantillas.paraUsar(request.template());
        Map<String, Object> datos = request.data() == null ? Map.of() : request.data();
        validarDatos(plantilla, datos);

        String titulo = plantilla.armarTitulo(datos);
        String mensaje = plantilla.armarMensaje(datos);
        validarLargo("El título", titulo, MAX_TITULO, "TITULO_DEMASIADO_LARGO");
        validarLargo("El mensaje", mensaje, MAX_MENSAJE, "MENSAJE_DEMASIADO_LARGO");

        Notificacion notificacion = new Notificacion(
                request.recipientId(),
                Canal.valueOf(request.channel()),
                plantilla,
                titulo,
                mensaje,
                request.sourceModule(),
                request.referenceId(),
                clave,
                CorrelationIdFilter.actual(),
                ipOrigen);

        entregar(notificacion);

        Notificacion guardada;
        try {
            guardada = repository.saveAndFlush(notificacion);
        } catch (DataIntegrityViolationException e) {
            // Otra petición con la misma clave se guardó primero: se devuelve esa.
            if (clave != null) {
                Optional<Resultado> repetida = buscarRepetida(clave);
                if (repetida.isPresent()) {
                    return repetida.get();
                }
            }
            throw e;
        }

        log.info("Notificación {} recibida desde {} (módulo {}): {} [{}]",
                guardada.getId(), ipOrigen, request.sourceModule(), guardada.getMensaje(), guardada.getEstado());

        return new Resultado(guardada, true);
    }

    /**
     * POST /api/v1/notifications/{id}/retry: vuelve a intentar la entrega
     * de una notificación FALLIDA, hasta el tope de intentos.
     */
    @Transactional
    public Notificacion reintentar(Long id) {
        Notificacion notificacion = buscarPorId(id);

        if (notificacion.getEstado() == EstadoEnvio.ENVIADA) {
            throw new ApiException(HttpStatus.CONFLICT, "NOTIFICACION_YA_ENVIADA",
                    "La notificación " + id + " ya fue entregada");
        }
        if (notificacion.getIntentos() >= envio.maxIntentos()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "REINTENTOS_AGOTADOS",
                    "La notificación " + id + " ya tuvo " + notificacion.getIntentos()
                            + " intentos (máximo " + envio.maxIntentos() + ")");
        }

        entregar(notificacion);
        log.info("Reintento de la notificación {}: intento {} -> {}",
                id, notificacion.getIntentos(), notificacion.getEstado());
        return notificacion;
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

    private Optional<Resultado> buscarRepetida(String clave) {
        return repository.findByClaveIdempotencia(clave).map(existente -> {
            log.info("Solicitud repetida con Idempotency-Key={}: se devuelve la notificación {}",
                    clave, existente.getId());
            return new Resultado(existente, false);
        });
    }

    /** Entrega simulada: falla sólo si el canal está marcado como caído. */
    private void entregar(Notificacion notificacion) {
        Canal canal = notificacion.getCanal();
        if (canales.disponible(canal)) {
            notificacion.registrarIntento(true, null);
        } else {
            notificacion.registrarIntento(false, "El canal " + canal + " no está disponible (simulación)");
            log.warn("Entrega fallida por canal {} caído (intento {})", canal, notificacion.getIntentos());
        }
    }

    private void validarDatos(Plantilla plantilla, Map<String, Object> datos) {
        List<String> faltantes = plantilla.getDatosRequeridos().stream()
                .filter(clave -> datos.get(clave) == null)
                .toList();

        if (!faltantes.isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "DATOS_INCOMPLETOS",
                    "La plantilla " + plantilla.getCodigo() + " requiere: " + String.join(", ", faltantes));
        }
    }

    /** Sin esto, un "data" largo terminaba en un 500 al guardar. */
    private static void validarLargo(String que, String texto, int maximo, String codigo) {
        if (texto.length() > maximo) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, codigo,
                    que + " armado tiene " + texto.length() + " caracteres (máximo " + maximo + ")");
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
