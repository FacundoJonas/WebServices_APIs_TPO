package ar.edu.uade.api.deliverygo.notificaciones.service;

import ar.edu.uade.api.deliverygo.notificaciones.domain.Plantilla;
import ar.edu.uade.api.deliverygo.notificaciones.domain.TipoNotificacion;
import ar.edu.uade.api.deliverygo.notificaciones.dto.ActualizarPlantillaRequest;
import ar.edu.uade.api.deliverygo.notificaciones.dto.CrearPlantillaRequest;
import ar.edu.uade.api.deliverygo.notificaciones.exception.ApiException;
import ar.edu.uade.api.deliverygo.notificaciones.repository.PlantillaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Reglas de las plantillas (caso de uso "usar plantilla" del Equipo 6).
 */
@Service
public class PlantillaService {

    private static final Logger log = LoggerFactory.getLogger(PlantillaService.class);

    private final PlantillaRepository repository;

    public PlantillaService(PlantillaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Plantilla crear(CrearPlantillaRequest request) {
        if (repository.existsByCodigo(request.code())) {
            throw new ApiException(HttpStatus.CONFLICT, "PLANTILLA_DUPLICADA",
                    "Ya existe la plantilla " + request.code());
        }

        Plantilla plantilla = repository.save(new Plantilla(
                request.code(),
                TipoNotificacion.valueOf(request.type()),
                request.title().trim(),
                request.text().trim(),
                vacioANull(request.action())));

        log.info("Plantilla {} creada", plantilla.getCodigo());
        return plantilla;
    }

    @Transactional
    public Plantilla actualizar(String codigo, ActualizarPlantillaRequest request) {
        Plantilla plantilla = buscar(codigo);
        plantilla.actualizar(
                TipoNotificacion.valueOf(request.type()),
                request.title().trim(),
                request.text().trim(),
                vacioANull(request.action()),
                request.active());

        log.info("Plantilla {} actualizada (activa={})", codigo, request.active());
        return plantilla;
    }

    @Transactional(readOnly = true)
    public Plantilla buscar(String codigo) {
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PLANTILLA_INEXISTENTE",
                        "No existe la plantilla " + codigo));
    }

    @Transactional(readOnly = true)
    public List<Plantilla> listar() {
        return repository.findAllByOrderByCodigoAsc();
    }

    /**
     * Plantilla que pide otro módulo al crear una notificación.
     * Que no exista o esté desactivada es una regla de negocio incumplida: 422.
     */
    @Transactional(readOnly = true)
    public Plantilla paraUsar(String codigo) {
        Plantilla plantilla = repository.findByCodigo(codigo).orElseThrow(() -> {
            String validas = listar().stream()
                    .filter(Plantilla::isActiva)
                    .map(Plantilla::getCodigo)
                    .collect(Collectors.joining(", "));
            return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "PLANTILLA_INVALIDA",
                    "La plantilla '" + codigo + "' no existe. Válidas: " + validas);
        });

        if (!plantilla.isActiva()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "PLANTILLA_INACTIVA",
                    "La plantilla " + codigo + " está desactivada");
        }
        return plantilla;
    }

    private static String vacioANull(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
