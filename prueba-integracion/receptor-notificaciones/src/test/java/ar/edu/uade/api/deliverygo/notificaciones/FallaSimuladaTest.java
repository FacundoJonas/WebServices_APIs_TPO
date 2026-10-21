package ar.edu.uade.api.deliverygo.notificaciones;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import ar.edu.uade.api.deliverygo.notificaciones.domain.Notificacion;
import ar.edu.uade.api.deliverygo.notificaciones.repository.NotificacionRepository;
import ar.edu.uade.api.deliverygo.notificaciones.repository.PlantillaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Con SIMULAR_FALLA_PORCENTAJE=100 toda solicitud NUEVA recibe 503,
 * pero la repetición de una que ya se guardó tiene que devolver 200.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:falla",
        "deliverygo.simulacion.porcentaje-falla=100"})
@AutoConfigureMockMvc
class FallaSimuladaTest {

    private static final String CUERPO = """
            {"recipientId":"u-falla","channel":"EMAIL","template":"PRUEBA_CONEXION","sourceModule":"test"}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private NotificacionRepository notificaciones;

    @Autowired
    private PlantillaRepository plantillas;

    @Test
    void unaSolicitudNuevaRecibeLaFallaSimulada() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON).content(CUERPO)
                        .header("Idempotency-Key", "k-nueva"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("FALLA_SIMULADA"));
    }

    @Test
    void laRepeticionDeAlgoYaGuardadoNoRecibeLaFallaSimulada() throws Exception {
        // Simula que el primer intento del emisor se guardó pero la respuesta se perdió.
        var plantilla = plantillas.findByCodigo("PRUEBA_CONEXION").orElseThrow();
        Notificacion guardada = new Notificacion("u-falla", Canal.EMAIL, plantilla, plantilla.getTitulo(),
                plantilla.getTexto(), "test", null, "k-guardada", "cid", "127.0.0.1");
        guardada.registrarIntento(true, null);
        notificaciones.save(guardada);

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON).content(CUERPO)
                        .header("Idempotency-Key", "k-guardada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(guardada.getId()));
    }
}
