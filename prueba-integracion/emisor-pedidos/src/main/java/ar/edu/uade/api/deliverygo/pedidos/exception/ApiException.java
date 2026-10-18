package ar.edu.uade.api.deliverygo.pedidos.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción de negocio con el status HTTP y el código de error que
 * deben llegar al cliente. La convierte en JSON el GlobalExceptionHandler.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
