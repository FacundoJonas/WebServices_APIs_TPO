package ar.edu.uade.api.deliverygo.pedidos.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Formato de error normalizado que devuelve el receptor. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ErrorRemoto(int status, String code, String message) {
}
