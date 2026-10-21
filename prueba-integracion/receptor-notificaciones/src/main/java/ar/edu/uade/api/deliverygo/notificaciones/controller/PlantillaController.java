package ar.edu.uade.api.deliverygo.notificaciones.controller;

import ar.edu.uade.api.deliverygo.notificaciones.dto.ActualizarPlantillaRequest;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CrearPlantillaRequest;
import ar.edu.uade.api.deliverygo.notificaciones.dto.PlantillaResponse;
import ar.edu.uade.api.deliverygo.notificaciones.mapper.PlantillaMapper;
import ar.edu.uade.api.deliverygo.notificaciones.service.PlantillaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * Plantillas de notificación. POST es obligatorio para el Equipo 6;
 * GET y PUT son extensiones de la prueba para poder editarlas desde la página.
 * No hay DELETE: el historial guarda el código de la plantilla; se desactiva con PUT.
 */
@RestController
@RequestMapping("/api/v1/templates")
@Tag(name = "Plantillas")
public class PlantillaController {

    private final PlantillaService service;

    public PlantillaController(PlantillaService service) {
        this.service = service;
    }

    @Operation(summary = "Crear una plantilla (obligatorio del Equipo 6)")
    @PostMapping
    public ResponseEntity<PlantillaResponse> crear(@Valid @RequestBody CrearPlantillaRequest request) {
        PlantillaResponse body = PlantillaMapper.aResponse(service.crear(request));
        return ResponseEntity.created(URI.create("/api/v1/templates/" + body.code())).body(body);
    }

    @Operation(summary = "Listar las plantillas (extensión de la prueba)")
    @GetMapping
    public List<PlantillaResponse> listar() {
        return service.listar().stream().map(PlantillaMapper::aResponse).toList();
    }

    @Operation(summary = "Consultar una plantilla (extensión de la prueba)")
    @GetMapping("/{code}")
    public PlantillaResponse buscar(@PathVariable String code) {
        return PlantillaMapper.aResponse(service.buscar(code));
    }

    @Operation(summary = "Editar o desactivar una plantilla (extensión de la prueba)")
    @PutMapping("/{code}")
    public PlantillaResponse actualizar(@PathVariable String code,
                                        @Valid @RequestBody ActualizarPlantillaRequest request) {
        return PlantillaMapper.aResponse(service.actualizar(code, request));
    }
}
