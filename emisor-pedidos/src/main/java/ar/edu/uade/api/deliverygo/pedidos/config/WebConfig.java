package ar.edu.uade.api.deliverygo.pedidos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración web: CORS y datos de Swagger.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${deliverygo.cors.origenes}")
    private String[] origenes;

    /**
     * CORS: el navegador bloquea las llamadas de una página (ej. el Portal React
     * en http://192.168.1.50:5173) a otro origen (ej. http://192.168.1.21:8082)
     * salvo que el servidor lo permita explícitamente.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origenes)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders(CorrelationIdFilter.HEADER);
    }

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI().info(new Info()
                .title("DeliveryGo - Pedidos (emisor de prueba)")
                .version("v1")
                .description("Crea pedidos y notifica al módulo Notificaciones que corre en otra VM. Prueba de integración."));
    }
}
