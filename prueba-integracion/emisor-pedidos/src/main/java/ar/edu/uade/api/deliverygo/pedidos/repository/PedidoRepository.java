package ar.edu.uade.api.deliverygo.pedidos.repository;

import ar.edu.uade.api.deliverygo.pedidos.domain.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findAllByOrderByCreadoEnDesc();
}
