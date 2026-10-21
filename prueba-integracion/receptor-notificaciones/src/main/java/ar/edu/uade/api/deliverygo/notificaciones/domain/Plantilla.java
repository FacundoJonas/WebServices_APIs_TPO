package ar.edu.uade.api.deliverygo.notificaciones.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Entidad JPA: una plantilla de notificación (caso de uso "usar plantilla"
 * y endpoint obligatorio POST /api/v1/templates del Equipo 6).
 *
 * El texto lleva marcadores {clave}. Los datos que la plantilla exige
 * se deducen de esos marcadores, así no hay dos listas que mantener.
 *
 * No se borran: las notificaciones guardan el código de la plantilla que usaron.
 * Para dejar de usar una, se desactiva.
 */
@Entity
@Table(name = "plantilla")
public class Plantilla {

    private static final Pattern MARCADOR = Pattern.compile("\\{([A-Za-z0-9_]+)\\}");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNotificacion tipo;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String texto;

    /** Texto del botón que muestra el Portal (ej. "Ver pedido"). Opcional. */
    @Column(length = 40)
    private String accion;

    @Column(nullable = false)
    private boolean activa;

    @Column(nullable = false)
    private Instant actualizadaEn;

    protected Plantilla() {
        // Constructor vacío requerido por JPA
    }

    public Plantilla(String codigo, TipoNotificacion tipo, String titulo, String texto, String accion) {
        this.codigo = codigo;
        this.tipo = tipo;
        this.titulo = titulo;
        this.texto = texto;
        this.accion = accion;
        this.activa = true;
        this.actualizadaEn = Instant.now();
    }

    public void actualizar(TipoNotificacion tipo, String titulo, String texto, String accion, boolean activa) {
        this.tipo = tipo;
        this.titulo = titulo;
        this.texto = texto;
        this.accion = accion;
        this.activa = activa;
        this.actualizadaEn = Instant.now();
    }

    /** Claves de los marcadores {clave} del título y del texto, en el orden en que aparecen. */
    public List<String> getDatosRequeridos() {
        Set<String> claves = new LinkedHashSet<>();
        Matcher matcher = MARCADOR.matcher(titulo + " " + texto);
        while (matcher.find()) {
            claves.add(matcher.group(1));
        }
        return List.copyOf(claves);
    }

    public String armarTitulo(Map<String, Object> datos) {
        return completar(titulo, datos);
    }

    public String armarMensaje(Map<String, Object> datos) {
        return completar(texto, datos);
    }

    /** Reemplaza cada {clave} por su valor en {@code datos}. */
    private static String completar(String base, Map<String, Object> datos) {
        String resultado = base;
        for (Map.Entry<String, Object> dato : datos.entrySet()) {
            resultado = resultado.replace("{" + dato.getKey() + "}", comoTexto(dato.getValue()));
        }
        return resultado;
    }

    /**
     * Un importe puede llegar como 7800 o como 7800.0 según cómo lo serialice
     * el otro módulo: los números enteros se muestran siempre sin decimales.
     */
    private static String comoTexto(Object valor) {
        if (valor instanceof Number numero && !(valor instanceof Long) && !(valor instanceof Integer)) {
            try {
                return new BigDecimal(numero.toString()).stripTrailingZeros().toPlainString();
            } catch (NumberFormatException e) {
                return numero.toString(); // NaN o Infinity
            }
        }
        return String.valueOf(valor);
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public TipoNotificacion getTipo() { return tipo; }
    public String getTitulo() { return titulo; }
    public String getTexto() { return texto; }
    public String getAccion() { return accion; }
    public boolean isActiva() { return activa; }
    public Instant getActualizadaEn() { return actualizadaEn; }
}
