package ar.edu.uade.api.deliverygo.pedidos.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Asigna un X-Correlation-Id a cada petición (convención del TPO, sección 6).
 *
 * - Si la petición ya trae el header (porque la mandó otro módulo), se reutiliza:
 *   así el MISMO id aparece en los logs de las dos VMs y se puede seguir el recorrido.
 * - Si no lo trae, se genera uno nuevo.
 *
 * El id se guarda en el MDC de los logs y se devuelve en la respuesta.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String correlationId = request.getHeader(HEADER);

        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        MDC.put(MDC_KEY, correlationId);
        response.setHeader(HEADER, correlationId);

        try {
            chain.doFilter(request, response);
        } finally {
            // El hilo vuelve al pool de Tomcat: hay que limpiar para no "contaminar" otra petición
            MDC.remove(MDC_KEY);
        }
    }

    /** Devuelve el correlationId de la petición en curso. */
    public static String actual() {
        return MDC.get(MDC_KEY);
    }
}
