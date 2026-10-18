package ar.edu.uade.api.deliverygo.pedidos.service;

import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionRemotaRequest;
import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionRemotaResponse;
import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionesClient;
import ar.edu.uade.api.deliverygo.pedidos.client.ReceptorException;
import ar.edu.uade.api.deliverygo.pedidos.domain.EstadoNotificacion;
import ar.edu.uade.api.deliverygo.pedidos.domain.ItemPedido;
import ar.edu.uade.api.deliverygo.pedidos.domain.Pedido;
import ar.edu.uade.api.deliverygo.pedidos.dto.CrearPedidoRequest;
import ar.edu.uade.api.deliverygo.pedidos.exception.ApiException;
import ar.edu.uade.api.deliverygo.pedidos.repository.PedidoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Orquesta la creación del pedido y su notificación al otro módulo.
 *
 * Decisión importante: la llamada HTTP al receptor se hace FUERA de una
 * transacción. Si se hiciera dentro, una VM lenta mantendría abierta la
 * transacción de la base durante segundos.
 */
@Service
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
    private static final String PLANTILLA = "PEDIDO_CREADO";

    private final PedidoRepository repository;
    private final NotificacionesClient notificaciones;

    public PedidoService(PedidoRepository repository, NotificacionesClient notificaciones) {
        this.repository = repository;
        this.notificaciones = notificaciones;
    }

    /**
     * 1) Guarda el pedido. 2) Intenta notificar.
     * Si la notificación falla, el pedido IGUAL queda creado (falla parcial):
     * se informa en la respuesta y se puede reintentar.
     */
    public Pedido crear(CrearPedidoRequest request) {

        List<ItemPedido> items = request.items().stream()
                .map(i -> new ItemPedido(i.productId(), i.quantity(), i.unitPrice()))
                .toList();

        Pedido pedido = repository.save(
                new Pedido(request.userId(), request.merchantId(), request.deliveryAddressId(), items));

        log.info("Pedido {} creado por el usuario {} (total $ {})", pedido.getId(), pedido.getUsuarioId(), pedido.getTotal());

        try {
            notificar(pedido);
        } catch (ReceptorException e) {
            // Ya quedó registrado en el pedido; no se corta la creación.
            log.warn("Pedido {} creado SIN notificar: {}", pedido.getId(), e.getMessage());
        }

        return pedido;
    }

    public Pedido buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PEDIDO_INEXISTENTE",
                        "No existe el pedido " + id));
    }

    public List<Pedido> listar() {
        return repository.findAllByOrderByCreadoEnDesc();
    }

    /**
     * Reintenta la notificación. Si ya estaba enviada, no vuelve a mandar.
     * Si vuelve a fallar, responde 503/504 con el formato de error normalizado.
     */
    public Pedido reintentarNotificacion(Long id) {

        Pedido pedido = buscar(id);

        if (pedido.getEstadoNotificacion() == EstadoNotificacion.ENVIADA) {
            return pedido;
        }

        try {
            notificar(pedido);
            return pedido;
        } catch (ReceptorException e) {
            throw aApiException(e);
        }
    }

    /**
     * Le pregunta al receptor qué guardó para la notificación de este pedido.
     * Lo usa la página web para comprobar la integración sin tener que entrar al receptor.
     */
    public NotificacionRemotaResponse verificarEnReceptor(Long id) {

        Pedido pedido = buscar(id);

        if (pedido.getNotificacionId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "PEDIDO_SIN_NOTIFICACION",
                    "El pedido " + id + " todavía no fue notificado al receptor (estado "
                            + pedido.getEstadoNotificacion() + "). Reintentá la notificación primero.");
        }

        try {
            return notificaciones.buscar(pedido.getNotificacionId());
        } catch (ReceptorException e) {
            throw aApiException(e);
        }
    }

    /** 504 para los timeouts, 503 para el resto, con el error normalizado. */
    private static ApiException aApiException(ReceptorException e) {
        HttpStatus status = switch (e.getTipo()) {
            case TIMEOUT_CONEXION, TIMEOUT_LECTURA -> HttpStatus.GATEWAY_TIMEOUT;
            default -> HttpStatus.SERVICE_UNAVAILABLE;
        };
        return new ApiException(status, "RECEPTOR_" + e.getTipo().name(),
                e.getMessage() + ". Sugerencia: " + e.getSugerencia());
    }

    /** Llama al receptor y guarda el resultado (éxito o falla) en el pedido. */
    private void notificar(Pedido pedido) {

        NotificacionRemotaRequest request = new NotificacionRemotaRequest(
                pedido.getUsuarioId(),
                "EMAIL",
                PLANTILLA,
                Map.of("orderId", pedido.getId(), "total", pedido.getTotal()),
                "pedidos",
                String.valueOf(pedido.getId()));

        // Misma clave en cada reintento del mismo pedido: el receptor no duplica.
        String claveIdempotencia = "pedido-" + pedido.getId() + "-" + PLANTILLA;

        try {
            NotificacionRemotaResponse respuesta = notificaciones.enviar(request, claveIdempotencia);
            pedido.registrarNotificacionEnviada(respuesta.id());
            log.info("Pedido {} notificado: el receptor la guardó con id {}", pedido.getId(), respuesta.id());
        } catch (ReceptorException e) {
            pedido.registrarNotificacionFallida("[" + e.getTipo() + "] " + e.getMessage()
                    + " | Sugerencia: " + e.getSugerencia());
            throw e;
        } finally {
            repository.save(pedido);
        }
    }
}
