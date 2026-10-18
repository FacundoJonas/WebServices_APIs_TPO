package ar.edu.uade.api.deliverygo.pedidos.controller;

import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionesClient;
import ar.edu.uade.api.deliverygo.pedidos.dto.CrearPedidoRequest;
import ar.edu.uade.api.deliverygo.pedidos.dto.PedidoResponse;
import ar.edu.uade.api.deliverygo.pedidos.mapper.PedidoMapper;
import ar.edu.uade.api.deliverygo.pedidos.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Pedidos")
public class PedidoController {

    private final PedidoService service;
    private final NotificacionesClient notificaciones;

    public PedidoController(PedidoService service, NotificacionesClient notificaciones) {
        this.service = service;
        this.notificaciones = notificaciones;
    }

    @Operation(summary = "Crear un pedido y notificar al receptor (otra VM)")
    @PostMapping
    public ResponseEntity<PedidoResponse> crear(@Valid @RequestBody CrearPedidoRequest request) {
        PedidoResponse body = PedidoMapper.aResponse(service.crear(request), notificaciones.url());
        return ResponseEntity.created(URI.create("/api/v1/orders/" + body.id())).body(body);
    }

    @Operation(summary = "Consultar un pedido")
    @GetMapping("/{id}")
    public PedidoResponse buscar(@PathVariable Long id) {
        return PedidoMapper.aResponse(service.buscar(id), notificaciones.url());
    }

    @Operation(summary = "Listar pedidos")
    @GetMapping
    public List<PedidoResponse> listar() {
        return service.listar().stream().map(p -> PedidoMapper.aResponse(p, notificaciones.url())).toList();
    }

    @Operation(summary = "Reintentar la notificación de un pedido que falló")
    @PostMapping("/{id}/notify")
    public PedidoResponse reintentar(@PathVariable Long id) {
        return PedidoMapper.aResponse(service.reintentarNotificacion(id), notificaciones.url());
    }
}
