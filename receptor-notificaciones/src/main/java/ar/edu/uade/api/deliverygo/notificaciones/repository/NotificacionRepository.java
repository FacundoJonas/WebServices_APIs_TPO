package ar.edu.uade.api.deliverygo.notificaciones.repository;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Acceso a la base propia del módulo. Spring Data genera la implementación. */
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByDestinatarioIdOrderByRecibidaEnDesc(String destinatarioId);

    Optional<Notificacion> findByClaveIdempotencia(String claveIdempotencia);

    List<Notificacion> findAllByOrderByRecibidaEnDesc();
}
