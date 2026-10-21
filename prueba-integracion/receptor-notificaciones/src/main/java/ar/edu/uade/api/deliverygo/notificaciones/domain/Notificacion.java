package ar.edu.uade.api.deliverygo.notificaciones.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Entidad JPA: una notificación recibida.
 *
 * Es una clase del DOMINIO del módulo. No se expone directamente por la API:
 * para eso están los DTO (regla del TPO: "los DTO externos no se reutilizan
 * como entidades JPA").
 *
 * Tipo, título, mensaje y acción se COPIAN de la plantilla al crearla:
 * si después se edita la plantilla, el historial no cambia.
 */
@Entity
@Table(name = "notificacion")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String destinatarioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Canal canal;

    /** Código de la plantilla usada (ej. PEDIDO_CREADO). */
    @Column(name = "plantilla_codigo", nullable = false, length = 50)
    private String plantilla;

    @Enumerated(EnumType.STRING)
    private TipoNotificacion tipo;

    @Column(length = 100)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String mensaje;

    @Column(length = 40)
    private String accion;

    /** Módulo que pidió la notificación (ej. "pedidos"). */
    private String moduloOrigen;

    /** Id del recurso que la originó en el otro módulo (ej. el id del pedido). */
    private String referenciaId;

    /** Clave para no duplicar si el emisor reintenta la misma solicitud. */
    @Column(unique = true)
    private String claveIdempotencia;

    private String correlationId;

    /** IP desde la que llegó la petición: útil para verificar qué VM la mandó. */
    private String ipOrigen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEnvio estado;

    /** Intentos de entrega por el canal (el primero cuenta). */
    @Column(nullable = false)
    private int intentos;

    /** Motivo del último intento fallido; null si se entregó. */
    @Column(length = 300)
    private String motivoFalla;

    @Column(nullable = false)
    private Instant recibidaEn;

    protected Notificacion() {
        // Constructor vacío requerido por JPA
    }

    public Notificacion(String destinatarioId, Canal canal, Plantilla plantilla, String titulo, String mensaje,
                        String moduloOrigen, String referenciaId, String claveIdempotencia,
                        String correlationId, String ipOrigen) {
        this.destinatarioId = destinatarioId;
        this.canal = canal;
        this.plantilla = plantilla.getCodigo();
        this.tipo = plantilla.getTipo();
        this.titulo = titulo;
        this.accion = plantilla.getAccion();
        this.mensaje = mensaje;
        this.moduloOrigen = moduloOrigen;
        this.referenciaId = referenciaId;
        this.claveIdempotencia = claveIdempotencia;
        this.correlationId = correlationId;
        this.ipOrigen = ipOrigen;
        this.estado = EstadoEnvio.PENDIENTE;
        this.intentos = 0;
        this.recibidaEn = Instant.now();
    }

    /** Registra un intento de entrega por el canal. */
    public void registrarIntento(boolean entregada, String motivo) {
        this.intentos++;
        this.estado = entregada ? EstadoEnvio.ENVIADA : EstadoEnvio.FALLIDA;
        this.motivoFalla = entregada ? null : motivo;
    }

    public Long getId() { return id; }
    public String getDestinatarioId() { return destinatarioId; }
    public Canal getCanal() { return canal; }
    public String getPlantilla() { return plantilla; }
    public TipoNotificacion getTipo() { return tipo; }
    public String getTitulo() { return titulo; }
    public String getMensaje() { return mensaje; }
    public String getAccion() { return accion; }
    public String getModuloOrigen() { return moduloOrigen; }
    public String getReferenciaId() { return referenciaId; }
    public String getClaveIdempotencia() { return claveIdempotencia; }
    public String getCorrelationId() { return correlationId; }
    public String getIpOrigen() { return ipOrigen; }
    public EstadoEnvio getEstado() { return estado; }
    public int getIntentos() { return intentos; }
    public String getMotivoFalla() { return motivoFalla; }
    public Instant getRecibidaEn() { return recibidaEn; }
}
