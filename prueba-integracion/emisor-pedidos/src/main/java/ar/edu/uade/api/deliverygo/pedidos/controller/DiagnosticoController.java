package ar.edu.uade.api.deliverygo.pedidos.controller;

import ar.edu.uade.api.deliverygo.pedidos.dto.DiagnosticoResponse;
import ar.edu.uade.api.deliverygo.pedidos.service.DiagnosticoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Diagnóstico")
public class DiagnosticoController {

    private final DiagnosticoService service;

    public DiagnosticoController(DiagnosticoService service) {
        this.service = service;
    }

    /**
     * 200 si toda la cadena funciona; 503 si algún paso falló
     * (así un script o un monitor puede detectarlo por el código HTTP).
     */
    @Operation(summary = "Probar la red hacia el receptor paso a paso (DNS, TCP, HTTP, contrato)")
    @GetMapping("/diagnostico")
    public ResponseEntity<DiagnosticoResponse> diagnosticar() {
        DiagnosticoResponse resultado = service.diagnosticar();
        return ResponseEntity.status(resultado.ok() ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(resultado);
    }
}
