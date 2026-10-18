package ar.edu.uade.api.deliverygo.pedidos.client;

/**
 * Falla al comunicarse con el receptor, ya clasificada.
 * El {@link Tipo} indica DÓNDE falló, que es lo que hace falta para
 * arreglar la VM o la red.
 */
public class ReceptorException extends RuntimeException {

    public enum Tipo {
        /** El nombre del host no se pudo resolver (DNS / /etc/hosts). */
        HOST_DESCONOCIDO,
        /** No hay ruta de red hasta la IP (otra subred, gateway, bridge de Proxmox). */
        SIN_RUTA,
        /** La IP responde pero el puerto rechaza (servicio caído, puerto errado, firewall REJECT). */
        CONEXION_RECHAZADA,
        /** No se pudo abrir la conexión a tiempo (VM apagada, IP inexistente, firewall DROP). */
        TIMEOUT_CONEXION,
        /** Conectó pero no respondió a tiempo (receptor lento o colgado). */
        TIMEOUT_LECTURA,
        /** El receptor respondió con un error HTTP (4xx/5xx). */
        RESPUESTA_ERROR,
        /** Cualquier otro problema de entrada/salida. */
        OTRO
    }

    private final Tipo tipo;
    private final String sugerencia;
    private final Integer httpStatus;

    public ReceptorException(Tipo tipo, String mensaje, String sugerencia, Integer httpStatus) {
        super(mensaje);
        this.tipo = tipo;
        this.sugerencia = sugerencia;
        this.httpStatus = httpStatus;
    }

    public Tipo getTipo() { return tipo; }
    public String getSugerencia() { return sugerencia; }
    public Integer getHttpStatus() { return httpStatus; }
}
