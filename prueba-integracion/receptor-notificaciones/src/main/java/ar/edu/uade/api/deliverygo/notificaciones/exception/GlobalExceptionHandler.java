package ar.edu.uade.api.deliverygo.notificaciones.exception;

import ar.edu.uade.api.deliverygo.notificaciones.config.CorrelationIdFilter;
import ar.edu.uade.api.deliverygo.notificaciones.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.stream.Collectors;

/**
 * Manejo centralizado de errores: TODA respuesta de error sale con el
 * formato normalizado, sin importar dónde se originó.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> manejarApi(ApiException ex, HttpServletRequest request) {
        return construir(ex.getStatus(), ex.getCode(), ex.getMessage(), request);
    }

    /** @Valid falló: se juntan todos los mensajes de los campos inválidos. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex,
                                                           HttpServletRequest request) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return construir(HttpStatus.BAD_REQUEST, "VALIDACION", mensaje, request);
    }

    /** El cuerpo no es JSON válido. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> manejarJsonInvalido(HttpMessageNotReadableException ex,
                                                             HttpServletRequest request) {
        return construir(HttpStatus.BAD_REQUEST, "JSON_INVALIDO",
                "El cuerpo de la petición no es un JSON válido", request);
    }

    /** Ej: GET /api/v1/notifications/abc (se esperaba un número). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> manejarTipo(MethodArgumentTypeMismatchException ex,
                                                     HttpServletRequest request) {
        return construir(HttpStatus.BAD_REQUEST, "PARAMETRO_INVALIDO",
                "El parámetro '" + ex.getName() + "' tiene un formato inválido", request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> manejarRutaInexistente(NoResourceFoundException ex,
                                                                HttpServletRequest request) {
        return construir(HttpStatus.NOT_FOUND, "RUTA_INEXISTENTE",
                "No existe la ruta " + request.getRequestURI(), request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarMetodo(HttpRequestMethodNotSupportedException ex,
                                                       HttpServletRequest request) {
        return construir(HttpStatus.METHOD_NOT_ALLOWED, "METODO_NO_PERMITIDO",
                "El método " + ex.getMethod() + " no está permitido en esta ruta", request);
    }

    /** Cualquier error no previsto: 500, sin exponer detalles internos al cliente. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarGeneral(Exception ex, HttpServletRequest request) {
        log.error("Error no controlado en {}", request.getRequestURI(), ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
                "Ocurrió un error inesperado. Revisar los logs con el correlationId.", request);
    }

    private ResponseEntity<ErrorResponse> construir(HttpStatus status, String code, String message,
                                                    HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(Instant.now(), status.value(), code, message,
                request.getRequestURI(), CorrelationIdFilter.actual());
        return ResponseEntity.status(status).body(error);
    }
}
