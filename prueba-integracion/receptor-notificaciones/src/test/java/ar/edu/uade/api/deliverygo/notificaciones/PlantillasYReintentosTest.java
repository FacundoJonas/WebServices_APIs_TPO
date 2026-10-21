package ar.edu.uade.api.deliverygo.notificaciones;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import ar.edu.uade.api.deliverygo.notificaciones.repository.NotificacionRepository;
import ar.edu.uade.api.deliverygo.notificaciones.service.EstadoCanales;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Plantillas editables (POST /templates), reintento limitado (POST /notifications/{id}/retry)
 * y los defectos corregidos del receptor.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:plantillas")
@AutoConfigureMockMvc
class PlantillasYReintentosTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private EstadoCanales canales;

    @Autowired
    private NotificacionRepository notificaciones;

    private final ObjectMapper json = new ObjectMapper();

    @AfterEach
    void canalesOperativos() {
        for (Canal canal : Canal.values()) {
            canales.cambiar(canal, true);
        }
    }

    @Test
    void lasPlantillasInicialesTraenTituloTipoYDatosRequeridos() throws Exception {
        mvc.perform(get("/api/v1/templates/PEDIDO_CREADO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PEDIDO"))
                .andExpect(jsonPath("$.title").value("Pedido #{orderId} creado"))
                .andExpect(jsonPath("$.requiredData[0]").value("orderId"))
                .andExpect(jsonPath("$.requiredData[1]").value("total"));
    }

    @Test
    void unaPlantillaNuevaSeUsaYExigeSusDatos() throws Exception {
        crearPlantilla("PROMO_JUEVES", "PROMOCION", "{pct}% OFF", "Hoy {pct}% en {comercio}.", "Pedir");

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-promo", "PROMO_JUEVES", "{\"pct\":25,\"comercio\":\"La Birra Bar\"}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("PROMOCION"))
                .andExpect(jsonPath("$.title").value("25% OFF"))
                .andExpect(jsonPath("$.message").value("Hoy 25% en La Birra Bar."))
                .andExpect(jsonPath("$.action").value("Pedir"))
                .andExpect(jsonPath("$.attempts").value(1));

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-promo", "PROMO_JUEVES", "{\"pct\":25}")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DATOS_INCOMPLETOS"));
    }

    @Test
    void unImporteEnteroConDecimalesSeMuestraSinDecimales() throws Exception {
        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-num", "PEDIDO_CREADO", "{\"orderId\":4,\"total\":7800.0}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Tu pedido #4 por $ 7800 fue creado y está pendiente de pago."));

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-num", "PEDIDO_CREADO", "{\"orderId\":5,\"total\":1234.50}")))
                .andExpect(jsonPath("$.message").value("Tu pedido #5 por $ 1234.5 fue creado y está pendiente de pago."));
    }

    @Test
    void codigoRepetidoDevuelve409YCodigoMalFormadoDevuelve400() throws Exception {
        crearPlantilla("AVISO_DUPLICADO", "SISTEMA", "Aviso", "Texto", null);

        mvc.perform(post("/api/v1/templates").contentType(MediaType.APPLICATION_JSON)
                        .content(plantilla("AVISO_DUPLICADO", "SISTEMA", "Otro", "Otro", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PLANTILLA_DUPLICADA"));

        mvc.perform(post("/api/v1/templates").contentType(MediaType.APPLICATION_JSON)
                        .content(plantilla("minúsculas", "SISTEMA", "T", "T", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACION"));
    }

    @Test
    void editarUnaPlantillaNoCambiaElHistorial() throws Exception {
        crearPlantilla("AVISO_EDITABLE", "SISTEMA", "Aviso", "Versión 1", null);
        long primera = crearNotificacion("u-edit", "AVISO_EDITABLE", "{}");

        mvc.perform(put("/api/v1/templates/AVISO_EDITABLE").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"SISTEMA\",\"title\":\"Aviso\",\"text\":\"Versión 2\",\"active\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Versión 2"));

        crearNotificacion("u-edit", "AVISO_EDITABLE", "{}");

        mvc.perform(get("/api/v1/notifications/" + primera))
                .andExpect(jsonPath("$.message").value("Versión 1"));
        mvc.perform(get("/api/v1/users/u-edit/notifications"))
                .andExpect(jsonPath("$[0].message").value("Versión 2"))
                .andExpect(jsonPath("$[1].message").value("Versión 1"));
    }

    @Test
    void unaPlantillaDesactivadaNoSePuedeUsar() throws Exception {
        crearPlantilla("AVISO_VIEJO", "SISTEMA", "Aviso", "Texto", null);
        mvc.perform(put("/api/v1/templates/AVISO_VIEJO").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"SISTEMA\",\"title\":\"Aviso\",\"text\":\"Texto\",\"active\":false}"));

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-x", "AVISO_VIEJO", "{}")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PLANTILLA_INACTIVA"));
    }

    @Test
    void conElCanalCaidoQuedaFallidaYSeRecuperaConElReintento() throws Exception {
        mvc.perform(put("/api/v1/channels/EMAIL").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"available\":false}"))
                .andExpect(jsonPath("$.available").value(false));

        long id = crearNotificacion("u-retry", "PRUEBA_CONEXION", "{}");
        mvc.perform(get("/api/v1/notifications/" + id))
                .andExpect(jsonPath("$.status").value("FALLIDA"))
                .andExpect(jsonPath("$.failureReason").exists());

        mvc.perform(post("/api/v1/notifications/" + id + "/retry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FALLIDA"))
                .andExpect(jsonPath("$.attempts").value(2));

        canales.cambiar(Canal.EMAIL, true);

        mvc.perform(post("/api/v1/notifications/" + id + "/retry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENVIADA"))
                .andExpect(jsonPath("$.attempts").value(3))
                .andExpect(jsonPath("$.failureReason").doesNotExist());

        mvc.perform(post("/api/v1/notifications/" + id + "/retry"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NOTIFICACION_YA_ENVIADA"));
    }

    @Test
    void losReintentosSonLimitados() throws Exception {
        canales.cambiar(Canal.EMAIL, false);
        long id = crearNotificacion("u-tope", "PRUEBA_CONEXION", "{}");

        mvc.perform(post("/api/v1/notifications/" + id + "/retry")).andExpect(jsonPath("$.attempts").value(2));
        mvc.perform(post("/api/v1/notifications/" + id + "/retry")).andExpect(jsonPath("$.attempts").value(3));

        mvc.perform(post("/api/v1/notifications/" + id + "/retry"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("REINTENTOS_AGOTADOS"));
    }

    @Test
    void unDataLargoDevuelve422EnVezDe500() throws Exception {
        crearPlantilla("AVISO_LIBRE", "SISTEMA", "Aviso", "{texto}", null);

        mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion("u-largo", "AVISO_LIBRE", "{\"texto\":\"" + "x".repeat(600) + "\"}")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MENSAJE_DEMASIADO_LARGO"));
    }

    @Test
    void dosPedidosSimultaneosConLaMismaClaveNoDuplicanNiDan500() throws Exception {
        ExecutorService hilos = Executors.newFixedThreadPool(2);
        try {
            for (int vuelta = 0; vuelta < 5; vuelta++) {
                String clave = "k-simultanea-" + vuelta;
                String destinatario = "u-simultaneo-" + vuelta;
                CountDownLatch largada = new CountDownLatch(1);

                Callable<Integer> pedido = () -> {
                    largada.await();
                    return mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                                    .header("Idempotency-Key", clave)
                                    .content(notificacion(destinatario, "PRUEBA_CONEXION", "{}")))
                            .andReturn().getResponse().getStatus();
                };

                List<Future<Integer>> respuestas = new ArrayList<>();
                respuestas.add(hilos.submit(pedido));
                respuestas.add(hilos.submit(pedido));
                largada.countDown();

                List<Integer> codigos = new ArrayList<>();
                for (Future<Integer> respuesta : respuestas) {
                    codigos.add(respuesta.get());
                }

                assertThat(codigos).containsExactlyInAnyOrder(201, 200);
                assertThat(notificaciones.findByDestinatarioIdOrderByRecibidaEnDesc(destinatario)).hasSize(1);
            }
        } finally {
            hilos.shutdownNow();
        }
    }

    private void crearPlantilla(String code, String type, String title, String text, String action) throws Exception {
        mvc.perform(post("/api/v1/templates").contentType(MediaType.APPLICATION_JSON)
                        .content(plantilla(code, type, title, text, action)))
                .andExpect(status().isCreated());
    }

    private long crearNotificacion(String destinatario, String plantilla, String datos) throws Exception {
        MvcResult resultado = mvc.perform(post("/api/v1/notifications").contentType(MediaType.APPLICATION_JSON)
                        .content(notificacion(destinatario, plantilla, datos)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode cuerpo = json.readTree(resultado.getResponse().getContentAsString());
        return cuerpo.get("id").asLong();
    }

    private String plantilla(String code, String type, String title, String text, String action) throws Exception {
        var cuerpo = json.createObjectNode()
                .put("code", code).put("type", type).put("title", title).put("text", text);
        if (action != null) {
            cuerpo.put("action", action);
        }
        return json.writeValueAsString(cuerpo);
    }

    private static String notificacion(String destinatario, String plantilla, String datos) {
        return """
                {"recipientId":"%s","channel":"EMAIL","template":"%s","data":%s,"sourceModule":"test"}
                """.formatted(destinatario, plantilla, datos);
    }
}
