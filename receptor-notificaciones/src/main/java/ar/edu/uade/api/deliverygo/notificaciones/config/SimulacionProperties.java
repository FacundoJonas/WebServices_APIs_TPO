package ar.edu.uade.api.deliverygo.notificaciones.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Permite SIMULAR problemas de red o del servidor para probar cómo
 * reacciona el emisor (timeouts, errores 503, reintentos).
 *
 * @param demoraMs         milisegundos que se espera antes de responder (0 = sin demora)
 * @param porcentajeFalla  0 a 100: probabilidad de responder 503 a propósito
 */
@ConfigurationProperties(prefix = "deliverygo.simulacion")
public record SimulacionProperties(long demoraMs, int porcentajeFalla) {
}
