package ar.edu.uade.api.deliverygo.notificaciones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Receptor de la prueba de integración: simula el Módulo Notificaciones (Equipo 6).
 *
 * Recibe por HTTP las solicitudes de notificación que envían otros módulos
 * (en esta prueba, el emisor de Pedidos que corre en OTRA máquina virtual),
 * las valida, las guarda en su propia base y responde con el resultado.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class NotificacionesApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificacionesApplication.class, args);
    }
}
