package ar.edu.uade.api.deliverygo.notificaciones.controller;

import ar.edu.uade.api.deliverygo.notificaciones.dto.CrearNotificacionRequest;
import ar.edu.uade.api.deliverygo.notificaciones.dto.NotificacionResponse;
import ar.edu.uade.api.deliverygo.notificaciones.mapper.NotificacionMapper;
import ar.edu.uade.api.deliverygo.notificaciones.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * Endpoints del receptor. Las rutas son las obligatorias del Equipo 6.
 * El controller sólo traduce HTTP <-> servicio; la lógica está en el service.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Notificaciones")
public class NotificacionController {

    private final NotificacionService service;

    public NotificacionController(NotificacionService service) {
        this.service = service;
    }

    @Operation(summary = "Recibir una solicitud de notificación (la llama el emisor)")
    @PostMapping("/notifications")
    public ResponseEntity<NotificacionResponse> crear(
            @Valid @RequestBody CrearNotificacionRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String claveIdempotencia,
            HttpServletRequest http) {

        NotificacionService.Resultado resultado =
                service.registrar(request, claveIdempotencia, http.getRemoteAddr());

        NotificacionResponse body = NotificacionMapper.aResponse(resultado.notificacion());

        // 201 Created si es nueva; 200 OK si es una repetición idempotente.
        if (!resultado.nueva()) {
            return ResponseEntity.ok(body);
        }
        return ResponseEntity.created(URI.create("/api/v1/notifications/" + body.id())).body(body);
    }

    @Operation(summary = "Consultar una notificación")
    @GetMapping("/notifications/{id}")
    public NotificacionResponse buscar(@PathVariable Long id) {
        return NotificacionMapper.aResponse(service.buscarPorId(id));
    }

    @Operation(summary = "Reintentar la entrega de una notificación FALLIDA (intentos limitados)")
    @PostMapping("/notifications/{id}/retry")
    public NotificacionResponse reintentar(@PathVariable Long id) {
        return NotificacionMapper.aResponse(service.reintentar(id));
    }

    @Operation(summary = "Listar todas las notificaciones recibidas (para la prueba)")
    @GetMapping("/notifications")
    public List<NotificacionResponse> listar() {
        return service.listarTodas().stream().map(NotificacionMapper::aResponse).toList();
    }

    @Operation(summary = "Historial de notificaciones de un usuario")
    @GetMapping("/users/{id}/notifications")
    public List<NotificacionResponse> listarPorUsuario(@PathVariable String id) {
        return service.listarPorUsuario(id).stream().map(NotificacionMapper::aResponse).toList();
    }
}
