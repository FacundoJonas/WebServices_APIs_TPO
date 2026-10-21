package ar.edu.uade.api.deliverygo.notificaciones.repository;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Acceso a las plantillas del módulo. Spring Data genera la implementación. */
public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {

    Optional<Plantilla> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Plantilla> findAllByOrderByCodigoAsc();
}
