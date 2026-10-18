package ar.edu.uade.api.deliverygo.pedidos.service;

import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionRemotaRequest;
import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionRemotaResponse;
import ar.edu.uade.api.deliverygo.pedidos.client.NotificacionesClient;
import ar.edu.uade.api.deliverygo.pedidos.client.ReceptorException;
import ar.edu.uade.api.deliverygo.pedidos.config.ReceptorProperties;
import ar.edu.uade.api.deliverygo.pedidos.dto.DiagnosticoResponse;
import ar.edu.uade.api.deliverygo.pedidos.dto.DiagnosticoResponse.Paso;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.ConnectException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NoRouteToHostException;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Diagnóstico de red hacia el receptor, capa por capa. Cada paso sólo se
 * ejecuta si el anterior salió bien, así el primer paso en falla indica
 * exactamente qué arreglar:
 *
 *  1. Configuración  ¿RECEPTOR_URL es una URL válida?
 *  2. DNS            ¿el nombre se traduce a una IP?
 *  3. TCP            ¿la VM acepta conexiones en ese puerto?
 *  4. HTTP ping      ¿responde el servicio correcto?
 *  5. Contrato       ¿acepta un POST real con el DTO acordado?
 *
 * El paso 5 ESCRIBE una notificación de prueba en el receptor. Con
 * {@code incluirContrato = false} se omite, para chequeos frecuentes
 * (ej. la página web) que no deben llenar la base del receptor.
 */
@Service
public class DiagnosticoService {

    private final ReceptorProperties receptor;
    private final NotificacionesClient cliente;

    public DiagnosticoService(ReceptorProperties receptor, NotificacionesClient cliente) {
        this.receptor = receptor;
        this.cliente = cliente;
    }

    public DiagnosticoResponse diagnosticar(boolean incluirContrato) {

        int esperados = incluirContrato ? 5 : 4;
        List<Paso> pasos = new ArrayList<>();

        // ---------- 1. Configuración ----------
        URI uri;
        int puerto;
        try {
            uri = URI.create(receptor.url());
            if (uri.getHost() == null || uri.getScheme() == null) {
                throw new IllegalArgumentException("falta el esquema (http://) o el host");
            }
            puerto = uri.getPort() != -1 ? uri.getPort() : ("https".equals(uri.getScheme()) ? 443 : 80);
            String aviso = "localhost".equals(uri.getHost()) || uri.getHost().startsWith("127.")
                    ? "ATENCIÓN: apunta a esta misma VM. Si el receptor está en otra VM, poner su IP."
                    : null;
            pasos.add(new Paso("1. Configuración", true, 0,
                    "host=" + uri.getHost() + ", puerto=" + puerto, aviso, null));
        } catch (IllegalArgumentException e) {
            pasos.add(new Paso("1. Configuración", false, 0, "RECEPTOR_URL inválida: " + e.getMessage(),
                    "Formato esperado: http://IP:PUERTO, ej. http://192.168.1.22:8082", null));
            return resultado(pasos, esperados);
        }

        // ---------- 2. DNS ----------
        InetAddress ip;
        long inicio = System.currentTimeMillis();
        try {
            InetAddress[] ips = InetAddress.getAllByName(uri.getHost());
            ip = ips[0];
            pasos.add(new Paso("2. DNS", true, desde(inicio),
                    uri.getHost() + " -> " + Arrays.stream(ips).map(InetAddress::getHostAddress).toList(), null, null));
        } catch (UnknownHostException e) {
            pasos.add(new Paso("2. DNS", false, desde(inicio), "No se pudo resolver " + uri.getHost(),
                    "Usar la IP directamente o agregar el nombre en /etc/hosts de esta VM.", null));
            return resultado(pasos, esperados);
        }

        // ---------- 3. TCP ----------
        inicio = System.currentTimeMillis();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, puerto), receptor.timeoutConexionMs());
            pasos.add(new Paso("3. TCP", true, desde(inicio),
                    "Conexión abierta a " + ip.getHostAddress() + ":" + puerto
                            + " (IP local usada: " + socket.getLocalAddress().getHostAddress() + ")", null, null));
        } catch (IOException e) {
            pasos.add(new Paso("3. TCP", false, desde(inicio), e.getClass().getSimpleName() + ": " + e.getMessage(),
                    sugerenciaTcp(e, puerto), null));
            return resultado(pasos, esperados);
        }

        // ---------- 4. HTTP ping ----------
        inicio = System.currentTimeMillis();
        try {
            Map<String, Object> ping = cliente.ping();
            boolean esReceptor = "notificaciones".equals(ping.get("module"));
            pasos.add(new Paso("4. HTTP ping", esReceptor, desde(inicio),
                    esReceptor ? "Respondió el módulo notificaciones en " + ping.get("hostname")
                               : "Respondió otro servicio: module=" + ping.get("module"),
                    esReceptor ? null : "RECEPTOR_URL apunta a un servicio que no es el receptor (¿puerto equivocado?).",
                    ping));
            if (!esReceptor) {
                return resultado(pasos, esperados);
            }
        } catch (ReceptorException e) {
            pasos.add(new Paso("4. HTTP ping", false, desde(inicio), e.getMessage(), e.getSugerencia(), null));
            return resultado(pasos, esperados);
        }

        if (!incluirContrato) {
            return resultado(pasos, esperados);
        }

        // ---------- 5. Contrato ----------
        inicio = System.currentTimeMillis();
        try {
            NotificacionRemotaResponse respuesta = cliente.enviar(new NotificacionRemotaRequest(
                    "diagnostico", "INTERNA", "PRUEBA_CONEXION", Map.of(), "pedidos-diagnostico", null),
                    "diagnostico-" + UUID.randomUUID());
            pasos.add(new Paso("5. Contrato (POST /api/v1/notifications)", true, desde(inicio),
                    "El receptor guardó la notificación de prueba con id " + respuesta.id(), null,
                    Map.of("ipQueVioElReceptor", String.valueOf(respuesta.originIp()))));
        } catch (ReceptorException e) {
            pasos.add(new Paso("5. Contrato (POST /api/v1/notifications)", false, desde(inicio),
                    e.getMessage(), e.getSugerencia(), null));
        }

        return resultado(pasos, esperados);
    }

    private DiagnosticoResponse resultado(List<Paso> pasos, int esperados) {
        boolean ok = pasos.size() == esperados && pasos.stream().allMatch(Paso::ok);
        return new DiagnosticoResponse(ok, receptor.url(), Instant.now(), pasos);
    }

    private static long desde(long inicio) {
        return System.currentTimeMillis() - inicio;
    }

    private static String sugerenciaTcp(IOException e, int puerto) {
        if (e instanceof ConnectException) {
            return "La VM responde pero el puerto " + puerto + " está cerrado: ¿el servicio receptor está levantado "
                    + "(systemctl status deliverygo-receptor)? ¿escucha en 0.0.0.0 y no en 127.0.0.1 (ss -tlnp)?";
        }
        if (e instanceof NoRouteToHostException) {
            return "Sin ruta: revisar que ambas VMs estén en el mismo bridge de Proxmox (vmbr0), misma subred y gateway.";
        }
        if (e instanceof SocketTimeoutException) {
            return "Sin respuesta: VM apagada, IP inexistente o firewall que descarta (Proxmox Firewall, ufw, nftables). "
                    + "Probar 'ping IP' y 'nc -vz IP " + puerto + "' desde esta VM.";
        }
        return "Revisar la red de la VM (ip a, ip route) y el firewall.";
    }
}
