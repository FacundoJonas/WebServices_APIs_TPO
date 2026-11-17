import { ANALITICA_URL } from './api';
import { pedir } from './http';
import { obtenerTableroMock } from './mocks/analiticaMock';

/*
 * Módulo Opiniones y Analítica (Grupo 4) — CU-10.
 * Contrato: doc/swagger-ecosistema.yaml → GET /api/v1/analytics/dashboard
 */
const API = `${ANALITICA_URL}/api/v1/analytics`;

// Cambiar a false cuando el Módulo Opiniones y Analítica esté disponible
const USE_MOCK = true;

const SIN_DATO = 'El Módulo Analítica no informa esta métrica.';

/*
 * DashboardResponse { generadoEn, parcial, metricas: MetricaResumen[] }
 * MetricaResumen { fuente: RESENAS|PEDIDOS|PAGOS|LOGISTICA, tipoMetrica, periodoDesde, periodoHasta, valor }
 * → bloques que usa MetricsPage.
 *
 * RN-09: cada bloque indica su fuente. RN-11: si una métrica no llega,
 * sólo ese bloque muestra el error y el resto del tablero sigue visible.
 */
function mapearTablero(dto, desde, hasta) {

    const valor = (tipo) => dto.metricas?.find((m) => m.tipoMetrica === tipo)?.valor;

    const entregados = valor('PEDIDOS_ENTREGADOS');
    const cancelados = valor('CANTIDAD_PEDIDOS_CANCELADOS');
    const aprobados = valor('CANTIDAD_PAGOS_APROBADOS');
    const rechazados = valor('CANTIDAD_PAGOS_RECHAZADOS');
    const promedio = valor('PROMEDIO_CALIFICACION');
    const resenas = valor('CANTIDAD_RESENAS');

    const hayPedidos = entregados !== undefined || cancelados !== undefined;
    const hayPagos = aprobados !== undefined || rechazados !== undefined;

    return {
        periodo: { desde, hasta },
        parcial: dto.parcial,

        pedidos: hayPedidos
            ? {
                fuente: 'Pedidos',
                total: (entregados ?? 0) + (cancelados ?? 0),
                variacion: null,
                porDia: [],
                porEstado: [
                    { estado: 'ENTREGADO', cantidad: entregados ?? 0 },
                    { estado: 'CANCELADO', cantidad: cancelados ?? 0 },
                ],
            }
            : { fuente: 'Pedidos', error: SIN_DATO, porDia: [], porEstado: [] },

        pagos: hayPagos
            ? {
                fuente: 'Pagos',
                facturacion: null,
                variacion: null,
                aprobados: aprobados ?? 0,
                rechazados: rechazados ?? 0,
                fondosInsuficientes: 0,
            }
            : { fuente: 'Pagos', error: SIN_DATO },

        opiniones: promedio !== undefined
            ? { fuente: 'Opiniones', promedio, resenas: resenas ?? 0 }
            : { fuente: 'Opiniones', error: SIN_DATO },

        topComercios: { fuente: 'Pedidos / Opiniones', error: SIN_DATO, items: [] },

        topRepartidores: { fuente: 'Logística / Opiniones', error: SIN_DATO, items: [] },
    };
}

/**
 * CU-10 GET /api/v1/analytics/dashboard?periodoDesde=&periodoHasta=
 * Solo para el rol ADMIN (RN-10). Las fechas van en formato YYYY-MM-DD.
 */
export async function obtenerTablero(desde, hasta) {

    if (USE_MOCK) {
        return obtenerTableroMock(desde, hasta);
    }

    const params = new URLSearchParams({ periodoDesde: desde, periodoHasta: hasta });

    const dto = await pedir(`${API}/dashboard?${params}`, {
        mensajeError: 'No pudimos cargar las métricas. Intentá nuevamente.',
    }).catch((error) => {
        if (error.status === 403) {
            throw new Error('No tenés permisos para ver las métricas.');
        }
        throw error;
    });

    return mapearTablero(dto, desde, hasta);
}
