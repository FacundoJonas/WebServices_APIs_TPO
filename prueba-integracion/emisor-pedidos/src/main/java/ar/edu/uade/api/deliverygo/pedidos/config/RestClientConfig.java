package ar.edu.uade.api.deliverygo.pedidos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Cliente HTTP para hablar con el receptor.
 *
 * - Timeouts explícitos: sin ellos, si la otra VM no responde, el emisor
 *   quedaría esperando indefinidamente y se colgarían los hilos.
 * - Interceptor: agrega el X-Correlation-Id de la petición actual a la
 *   llamada saliente, para seguir la misma operación en los logs de ambas VMs.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient receptorRestClient(ReceptorProperties receptor) {

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(receptor.timeoutConexionMs());
        factory.setReadTimeout(receptor.timeoutLecturaMs());

        return RestClient.builder()
                .baseUrl(receptor.url())
                .requestFactory(factory)
                .requestInterceptor((request, body, execution) -> {
                    String correlationId = CorrelationIdFilter.actual();
                    if (correlationId != null) {
                        request.getHeaders().set(CorrelationIdFilter.HEADER, correlationId);
                    }
                    return execution.execute(request, body);
                })
                .build();
    }
}
