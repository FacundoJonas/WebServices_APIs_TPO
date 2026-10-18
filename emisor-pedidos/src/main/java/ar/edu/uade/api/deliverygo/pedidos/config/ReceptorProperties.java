package ar.edu.uade.api.deliverygo.pedidos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Dónde está el receptor y cuánto esperarlo (checklist de integración del TPO:
 * "URL y versión acordadas", "Timeout y errores contemplados").
 *
 * @param url                  ej. http://192.168.1.22:8082
 * @param timeoutConexionMs    máximo para abrir la conexión TCP
 * @param timeoutLecturaMs     máximo para recibir la respuesta
 */
@ConfigurationProperties(prefix = "deliverygo.receptor")
public record ReceptorProperties(String url, int timeoutConexionMs, int timeoutLecturaMs) {
}
