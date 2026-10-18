package ar.edu.uade.api.deliverygo.pedidos.client;

import ar.edu.uade.api.deliverygo.pedidos.config.ReceptorProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.Map;

/**
 * Cliente del Módulo Notificaciones: es la ÚNICA clase del emisor que sabe
 * que el receptor existe y cómo se le habla por HTTP.
 *
 * Si algo falla, lanza {@link ReceptorException} con el tipo de falla y una
 * sugerencia concreta para revisar en la VM.
 */
@Component
public class NotificacionesClient {

    private static final Logger log = LoggerFactory.getLogger(NotificacionesClient.class);

    private final RestClient restClient;
    private final ReceptorProperties receptor;

    public NotificacionesClient(RestClient receptorRestClient, ReceptorProperties receptor) {
        this.restClient = receptorRestClient;
        this.receptor = receptor;
    }

    /**
     * POST {RECEPTOR_URL}/api/v1/notifications
     *
     * @param claveIdempotencia si se reintenta con la misma clave, el receptor no duplica
     */
    public NotificacionRemotaResponse enviar(NotificacionRemotaRequest request, String claveIdempotencia) {
        log.info("Enviando notificación a {} (Idempotency-Key={})", receptor.url(), claveIdempotencia);
        try {
            return restClient.post()
                    .uri("/api/v1/notifications")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Idempotency-Key", claveIdempotencia)
                    .body(request)
                    .retrieve()
                    .body(NotificacionRemotaResponse.class);
        } catch (RestClientException e) {
            throw clasificar(e);
        }
    }

    /** GET {RECEPTOR_URL}/api/v1/ping */
    public Map<String, Object> ping() {
        try {
            return restClient.get()
                    .uri("/api/v1/ping")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });
        } catch (RestClientException e) {
            throw clasificar(e);
        }
    }

    public String url() {
        return receptor.url();
    }

    /**
     * Traduce la excepción técnica en un diagnóstico entendible.
     * Se busca la causa raíz porque Spring envuelve la IOException original.
     */
    private ReceptorException clasificar(RestClientException e) {

        if (e instanceof RestClientResponseException respuesta) {
            ErrorRemoto error = leerError(respuesta);
            String detalle = error != null && error.code() != null
                    ? error.code() + ": " + error.message()
                    : respuesta.getStatusText();
            return new ReceptorException(ReceptorException.Tipo.RESPUESTA_ERROR,
                    "El receptor respondió HTTP " + respuesta.getStatusCode().value() + " (" + detalle + ")",
                    sugerenciaHttp(respuesta.getStatusCode().value()),
                    respuesta.getStatusCode().value());
        }

        // Ojo: un timeout de LECTURA puede llegar como RestClientException genérica
        // ("Error while extracting response") y no como ResourceAccessException.
        // Por eso siempre se busca la causa raíz.
        Throwable causa = raiz(e);
        String host = receptor.url();

        if (causa instanceof UnknownHostException) {
            return new ReceptorException(ReceptorException.Tipo.HOST_DESCONOCIDO,
                    "No se pudo resolver el nombre del host en " + host,
                    "Usar la IP en RECEPTOR_URL, o agregar el nombre en /etc/hosts de la VM emisora.", null);
        }
        if (causa instanceof NoRouteToHostException) {
            return new ReceptorException(ReceptorException.Tipo.SIN_RUTA,
                    "No hay ruta de red hasta " + host,
                    "Verificar que ambas VMs estén en la misma subred/bridge de Proxmox (vmbr0), "
                            + "la máscara y el gateway (ip a / ip route), o un firewall que responda 'host unreachable'.", null);
        }
        if (causa instanceof ConnectException) {
            return new ReceptorException(ReceptorException.Tipo.CONEXION_RECHAZADA,
                    "Conexión rechazada por " + host + " (" + causa.getMessage() + ")",
                    "La VM existe pero nada escucha en ese puerto: revisar 'systemctl status deliverygo-receptor', "
                            + "el PUERTO configurado y 'ss -tlnp' en la VM receptora; o un firewall con REJECT.", null);
        }
        if (causa instanceof SocketTimeoutException) {
            String mensaje = String.valueOf(causa.getMessage()).toLowerCase();
            if (mensaje.contains("connect")) {
                return new ReceptorException(ReceptorException.Tipo.TIMEOUT_CONEXION,
                        "No se pudo conectar a " + host + " en " + receptor.timeoutConexionMs() + " ms",
                        "La VM receptora puede estar apagada, la IP no existir o un firewall descartar paquetes "
                                + "(Firewall de Proxmox en Datacenter/Nodo/VM, ufw o nftables en Debian).", null);
            }
            return new ReceptorException(ReceptorException.Tipo.TIMEOUT_LECTURA,
                    "El receptor no respondió en " + receptor.timeoutLecturaMs() + " ms",
                    "Conecta pero responde lento: revisar CPU/RAM de la VM receptora, sus logs "
                            + "(journalctl -u deliverygo-receptor) o si SIMULAR_DEMORA_MS está activo.", null);
        }

        return new ReceptorException(ReceptorException.Tipo.OTRO,
                "Error de comunicación con " + host + ": " + causa,
                "Revisar los logs de ambas VMs buscando el mismo correlationId.", null);
    }

    private static ErrorRemoto leerError(RestClientResponseException respuesta) {
        try {
            return respuesta.getResponseBodyAs(ErrorRemoto.class);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static String sugerenciaHttp(int status) {
        if (status == 404) {
            return "La IP y el puerto responden, pero la ruta no existe: ¿RECEPTOR_URL apunta al servicio correcto "
                    + "y la versión desplegada tiene /api/v1/notifications?";
        }
        if (status == 400 || status == 422) {
            return "El receptor rechazó los datos: revisar que ambos módulos usen el mismo contrato (DTO).";
        }
        if (status >= 500) {
            return "Falla interna del receptor: revisar 'journalctl -u deliverygo-receptor' en esa VM.";
        }
        return "Revisar la respuesta del receptor y sus logs.";
    }

    private static Throwable raiz(Throwable t) {
        Throwable actual = t;
        while (actual.getCause() != null && actual.getCause() != actual) {
            actual = actual.getCause();
        }
        return actual;
    }
}
