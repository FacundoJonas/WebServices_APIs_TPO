package ar.edu.uade.api.deliverygo.notificaciones.domain;

import java.util.List;
import java.util.Map;

/**
 * Plantillas válidas (regla del Equipo 6: "cada solicitud debe tener
 * destinatario, canal y plantilla válida").
 *
 * Cada plantilla declara qué datos necesita y cómo se arma el mensaje.
 */
public enum Plantilla {

    PEDIDO_CREADO(List.of("orderId", "total"),
            "Tu pedido #{orderId} por $ {total} fue creado y está pendiente de pago."),

    PEDIDO_CONFIRMADO(List.of("orderId"),
            "Tu pedido #{orderId} fue confirmado. ¡Ya lo están preparando!"),

    PRUEBA_CONEXION(List.of(),
            "Mensaje de prueba de conexión entre máquinas virtuales.");

    private final List<String> datosRequeridos;
    private final String texto;

    Plantilla(List<String> datosRequeridos, String texto) {
        this.datosRequeridos = datosRequeridos;
        this.texto = texto;
    }

    public List<String> getDatosRequeridos() {
        return datosRequeridos;
    }

    /** Reemplaza cada {clave} del texto por su valor en {@code datos}. */
    public String armarMensaje(Map<String, Object> datos) {
        String mensaje = texto;
        for (Map.Entry<String, Object> dato : datos.entrySet()) {
            mensaje = mensaje.replace("{" + dato.getKey() + "}", String.valueOf(dato.getValue()));
        }
        return mensaje;
    }
}
