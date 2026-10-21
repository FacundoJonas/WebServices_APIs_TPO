package ar.edu.uade.api.deliverygo.notificaciones.controller;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CambiarCanalRequest;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CanalResponse;
import ar.edu.uade.api.deliverygo.notificaciones.service.EstadoCanales;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * SÓLO PARA LA PRUEBA: marcar un canal como caído para provocar
 * notificaciones FALLIDA y probar el reintento. No es parte del contrato.
 */
@RestController
@RequestMapping("/api/v1/channels")
@Tag(name = "Simulación (sólo prueba)")
public class CanalController {

    private final EstadoCanales canales;

    public CanalController(EstadoCanales canales) {
        this.canales = canales;
    }

    @Operation(summary = "Estado simulado de cada canal")
    @GetMapping
    public List<CanalResponse> listar() {
        return Arrays.stream(Canal.values())
                .map(canal -> new CanalResponse(canal.name(), canales.disponible(canal)))
                .toList();
    }

    @Operation(summary = "Marcar un canal como operativo o caído")
    @PutMapping("/{canal}")
    public CanalResponse cambiar(@PathVariable Canal canal, @Valid @RequestBody CambiarCanalRequest request) {
        canales.cambiar(canal, request.available());
        return new CanalResponse(canal.name(), canales.disponible(canal));
    }
}
