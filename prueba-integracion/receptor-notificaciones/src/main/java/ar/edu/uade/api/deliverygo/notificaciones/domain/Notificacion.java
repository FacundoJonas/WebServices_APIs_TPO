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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Plantilla plantilla;

    @Column(nullable = false, length = 500)
    private String mensaje;

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

    @Column(nullable = false)
    private Instant recibidaEn;

    protected Notificacion() {
        // Constructor vacío requerido por JPA
    }

    public Notificacion(String destinatarioId, Canal canal, Plantilla plantilla, String mensaje,
                        String moduloOrigen, String referenciaId, String claveIdempotencia,
                        String correlationId, String ipOrigen) {
        this.destinatarioId = destinatarioId;
        this.canal = canal;
        this.plantilla = plantilla;
        this.mensaje = mensaje;
        this.moduloOrigen = moduloOrigen;
        this.referenciaId = referenciaId;
        this.claveIdempotencia = claveIdempotencia;
        this.correlationId = correlationId;
        this.ipOrigen = ipOrigen;
        this.estado = EstadoEnvio.ENVIADA;
        this.recibidaEn = Instant.now();
    }

    public Long getId() { return id; }
    public String getDestinatarioId() { return destinatarioId; }
    public Canal getCanal() { return canal; }
    public Plantilla getPlantilla() { return plantilla; }
    public String getMensaje() { return mensaje; }
    public String getModuloOrigen() { return moduloOrigen; }
    public String getReferenciaId() { return referenciaId; }
    public String getClaveIdempotencia() { return claveIdempotencia; }
    public String getCorrelationId() { return correlationId; }
    public String getIpOrigen() { return ipOrigen; }
    public EstadoEnvio getEstado() { return estado; }
    public Instant getRecibidaEn() { return recibidaEn; }
}
