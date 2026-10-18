package ar.edu.uade.api.deliverygo.pedidos.dto;

import java.time.Instant;
import java.util.List;

/**
 * Respuesta de GET /api/v1/ping: identifica QUÉ máquina respondió.
 * Sirve para confirmar que la IP a la que se llama es realmente la VM esperada.
 */
public record PingResponse(
        String module,
        String status,
        String hostname,
        List<String> ips,
        int port,
        String javaVersion,
        long uptimeSeconds,
        Instant serverTime,
        String clientIp
) {
}
