package ar.edu.uade.api.deliverygo.pedidos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Emisor de la prueba de integración: simula el Módulo Pedidos (Equipo 3).
 *
 * Cuando se crea un pedido, le pide al Módulo Notificaciones (que corre en
 * OTRA máquina virtual) que avise al usuario. Así se prueba la comunicación
 * REST real entre dos VMs de la red.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class PedidosApplication {

    public static void main(String[] args) {
        SpringApplication.run(PedidosApplication.class, args);
    }
}
