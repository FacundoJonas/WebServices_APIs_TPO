package ar.edu.uade.api.deliverygo.notificaciones.config;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Canal;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Entrega simulada de las notificaciones.
 *
 * @param maxIntentos   tope de intentos de entrega, contando el primero
 *                      (regla del Equipo 6: "reintentos limitados")
 * @param canalesCaidos canales que arrancan caídos (ej. EMAIL). Se pueden
 *                      cambiar en caliente desde la página o PUT /api/v1/channels/{canal}
 */
@ConfigurationProperties(prefix = "deliverygo.envio")
public record EnvioProperties(int maxIntentos, List<Canal> canalesCaidos) {

    public EnvioProperties {
        canalesCaidos = canalesCaidos == null ? List.of() : List.copyOf(canalesCaidos);
    }
}
