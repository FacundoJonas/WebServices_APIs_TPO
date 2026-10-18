package ar.edu.uade.api.deliverygo.pedidos.controller;

import ar.edu.uade.api.deliverygo.pedidos.dto.PingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

/**
 * GET /api/v1/ping: responde quién soy (hostname, IPs, puerto) y quién me llamó.
 * Es la primera prueba para saber si una VM es alcanzable desde otra PC.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Diagnóstico")
public class PingController {

    @Value("${deliverygo.modulo}")
    private String modulo;

    @Value("${server.port}")
    private int puerto;

    @Operation(summary = "Identificar la VM que responde")
    @GetMapping("/ping")
    public PingResponse ping(HttpServletRequest request) {
        return new PingResponse(
                modulo,
                "UP",
                hostname(),
                ipsLocales(),
                puerto,
                System.getProperty("java.version"),
                ManagementFactory.getRuntimeMXBean().getUptime() / 1000,
                Instant.now(),
                request.getRemoteAddr());
    }

    private static String hostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return "desconocido";
        }
    }

    /** IPv4 de todas las interfaces activas, sin la de loopback (127.0.0.1). */
    private static List<String> ipsLocales() {
        try {
            return Collections.list(NetworkInterface.getNetworkInterfaces()).stream()
                    .filter(PingController::activa)
                    .flatMap(nic -> Collections.list(nic.getInetAddresses()).stream())
                    .filter(ip -> ip instanceof Inet4Address && !ip.isLoopbackAddress())
                    .map(InetAddress::getHostAddress)
                    .toList();
        } catch (SocketException e) {
            return List.of();
        }
    }

    private static boolean activa(NetworkInterface nic) {
        try {
            return nic.isUp() && !nic.isLoopback();
        } catch (SocketException e) {
            return false;
        }
    }
}
