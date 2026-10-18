package ar.edu.uade.api.deliverygo.pedidos.client;

import ar.edu.uade.api.deliverygo.pedidos.config.ReceptorProperties;
import ar.edu.uade.api.deliverygo.pedidos.config.RestClientConfig;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifica que el cliente clasifique bien las fallas de red, que es lo que
 * después se usa para diagnosticar las VMs. No necesita levantar Spring.
 */
class NotificacionesClientTest {

    private static NotificacionesClient cliente(String url, int timeoutLecturaMs) {
        ReceptorProperties props = new ReceptorProperties(url, 1000, timeoutLecturaMs);
        return new NotificacionesClient(new RestClientConfig().receptorRestClient(props), props);
    }

    private static NotificacionRemotaRequest request() {
        return new NotificacionRemotaRequest("u1", "EMAIL", "PRUEBA_CONEXION", java.util.Map.of(), "test", null);
    }

    @Test
    void puertoCerradoEsConexionRechazada() throws IOException {
        int puertoLibre;
        try (ServerSocket s = new ServerSocket(0)) {
            puertoLibre = s.getLocalPort();
        } // se cierra: nadie escucha en ese puerto

        assertThatThrownBy(() -> cliente("http://127.0.0.1:" + puertoLibre, 1000).enviar(request(), "k"))
                .isInstanceOfSatisfying(ReceptorException.class,
                        e -> assertThat(e.getTipo()).isEqualTo(ReceptorException.Tipo.CONEXION_RECHAZADA));
    }

    @Test
    void servidorQueNoRespondeEsTimeoutDeLectura() throws Exception {
        // Acepta la conexión TCP pero nunca contesta: simula un receptor colgado
        try (ServerSocket servidor = new ServerSocket(0)) {
            Thread aceptador = new Thread(() -> {
                try (Socket ignorado = servidor.accept()) {
                    Thread.sleep(5000);
                } catch (Exception ignored) {
                    // fin del test
                }
            });
            aceptador.setDaemon(true);
            aceptador.start();

            assertThatThrownBy(() -> cliente("http://127.0.0.1:" + servidor.getLocalPort(), 500).enviar(request(), "k"))
                    .isInstanceOfSatisfying(ReceptorException.class,
                            e -> assertThat(e.getTipo()).isEqualTo(ReceptorException.Tipo.TIMEOUT_LECTURA));
        }
    }

    @Test
    void hostInexistenteEsHostDesconocido() {
        assertThatThrownBy(() -> cliente("http://vm-que-no-existe.invalid:8082", 1000).enviar(request(), "k"))
                .isInstanceOfSatisfying(ReceptorException.class,
                        e -> assertThat(e.getTipo()).isEqualTo(ReceptorException.Tipo.HOST_DESCONOCIDO));
    }
}
