package ar.edu.uade.api.deliverygo.pedidos.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad JPA del pedido, con el estado de su notificación al otro módulo.
 */
@Entity
@Table(name = "pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuarioId;

    @Column(nullable = false)
    private String comercioId;

    private String direccionEntregaId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pedido_item", joinColumns = @JoinColumn(name = "pedido_id"))
    private List<ItemPedido> items = new ArrayList<>();

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 3)
    private String moneda = "ARS";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPedido estado = EstadoPedido.BORRADOR;

    @Column(nullable = false)
    private Instant creadoEn = Instant.now();

    // ----- Seguimiento de la integración con Notificaciones -----

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoNotificacion estadoNotificacion = EstadoNotificacion.PENDIENTE;

    /** Id que devolvió el receptor (en SU base). */
    private Long notificacionId;

    private int intentosNotificacion;

    @Column(length = 500)
    private String ultimoErrorNotificacion;

    protected Pedido() {
    }

    public Pedido(String usuarioId, String comercioId, String direccionEntregaId, List<ItemPedido> items) {
        this.usuarioId = usuarioId;
        this.comercioId = comercioId;
        this.direccionEntregaId = direccionEntregaId;
        this.items = new ArrayList<>(items);
        // Regla: el total se calcula en el servidor, nunca se toma del cliente.
        this.total = items.stream().map(ItemPedido::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void registrarNotificacionEnviada(Long notificacionId) {
        this.intentosNotificacion++;
        this.estadoNotificacion = EstadoNotificacion.ENVIADA;
        this.notificacionId = notificacionId;
        this.ultimoErrorNotificacion = null;
    }

    public void registrarNotificacionFallida(String error) {
        this.intentosNotificacion++;
        this.estadoNotificacion = EstadoNotificacion.FALLIDA;
        this.ultimoErrorNotificacion = error.length() > 500 ? error.substring(0, 500) : error;
    }

    public Long getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getComercioId() { return comercioId; }
    public String getDireccionEntregaId() { return direccionEntregaId; }
    public List<ItemPedido> getItems() { return items; }
    public BigDecimal getTotal() { return total; }
    public String getMoneda() { return moneda; }
    public EstadoPedido getEstado() { return estado; }
    public Instant getCreadoEn() { return creadoEn; }
    public EstadoNotificacion getEstadoNotificacion() { return estadoNotificacion; }
    public Long getNotificacionId() { return notificacionId; }
    public int getIntentosNotificacion() { return intentosNotificacion; }
    public String getUltimoErrorNotificacion() { return ultimoErrorNotificacion; }
}
