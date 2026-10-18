package ar.edu.uade.api.deliverygo.notificaciones;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prueba el contrato del receptor de punta a punta (HTTP -> service -> base H2 en memoria).
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:test")
@AutoConfigureMockMvc
class NotificacionControllerTest {

    @Autowired
    private MockMvc mvc;

    private static final String VALIDA = """
            {"recipientId":"u-1","channel":"EMAIL","template":"PEDIDO_CREADO",
             "data":{"orderId":10,"total":1500},"sourceModule":"pedidos","referenceId":"10"}
            """;

    @Test
    void creaLaNotificacionYArmaElMensaje() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON).content(VALIDA)
                        .header("X-Correlation-Id", "cid-test"))
                .andExpect(status().isCreated())
                .andExpect(header().string("X-Correlation-Id", "cid-test"))
                .andExpect(jsonPath("$.status").value("ENVIADA"))
                .andExpect(jsonPath("$.message").value("Tu pedido #10 por $ 1500 fue creado y está pendiente de pago."))
                .andExpect(jsonPath("$.correlationId").value("cid-test"));
    }

    @Test
    void laMismaClaveIdempotenteNoDuplica() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON).content(VALIDA)
                        .header("Idempotency-Key", "k-test"))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON).content(VALIDA)
                        .header("Idempotency-Key", "k-test"))
                .andExpect(status().isOk());
    }

    @Test
    void plantillaInexistenteDevuelve422Normalizado() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recipientId\":\"u\",\"channel\":\"EMAIL\",\"template\":\"NO_EXISTE\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PLANTILLA_INVALIDA"))
                .andExpect(jsonPath("$.path").value("/api/v1/notifications"))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void faltanCamposDevuelve400() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"channel\":\"FAX\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACION"));
    }
}
