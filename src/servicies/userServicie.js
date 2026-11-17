import { USUARIOS_URL } from './api';
import { pedir } from './http';
import { obtenerUsuarioPorIdMock, crearDireccionMock } from './mocks/usersMock';

/*
 * Módulo Usuarios y Autenticación (Grupo 2) — CU-06.
 *
 * GET /api/v1/users/{id} y /addresses no están en el consolidado del
 * ecosistema (v1.4.0), pero sí en el contrato del propio módulo
 * (deliverygo-usuarios-auth: doc/openapi/deliverygo-usuarios.yaml).
 */
const API = `${USUARIOS_URL}/api/v1/users`;

// Cambiar a false cuando el Módulo Usuarios esté disponible
const USE_MOCK = true;

/*
 * DireccionResponse { id, calle, numero, piso, departamento, ciudad,
 * provincia, codigoPostal, predeterminada } → formato del Portal.
 */
function mapearDireccion(dto) {
    const pisoDepto = [dto.piso && `Piso ${dto.piso}`, dto.departamento].filter(Boolean).join(' ');

    return {
        id: dto.id,
        calle: [dto.calle, dto.numero].filter(Boolean).join(' ') + (pisoDepto ? `, ${pisoDepto}` : ''),
        barrio: dto.provincia ?? '',
        ciudad: dto.ciudad,
        codigoPostal: dto.codigoPostal,
        predeterminada: dto.predeterminada,
    };
}

/*
 * Dirección del formulario del Portal { calle, barrio, ciudad }
 * → CrearDireccionRequest. La calle se escribe junto con la altura
 * ("Av. Corrientes 1450"): se separa el número para el contrato.
 */
function armarDireccionRequest(direccion, predeterminada) {
    const coincidencia = direccion.calle.match(/^(.*?)\s+(\d+)\b\s*,?\s*(.*)$/);

    return {
        calle: coincidencia ? coincidencia[1] : direccion.calle,
        numero: coincidencia ? coincidencia[2] : 'S/N',
        piso: coincidencia?.[3] || undefined,
        ciudad: direccion.ciudad,
        provincia: direccion.ciudad === 'CABA' ? 'CABA' : 'Buenos Aires',
        codigoPostal: direccion.codigoPostal,
        predeterminada,
    };
}

/**
 * GET /api/v1/users/{id} → UsuarioResponse { id, nombre, apellido, email, telefono, rol, estado }
 * GET /api/v1/users/{id}/addresses → DireccionResponse[]
 *
 * Devuelve el usuario con sus direcciones. Si las direcciones fallan,
 * el perfil se muestra igual (RN-11: falla parcial).
 */
export async function obtenerUsuarioPorId(id) {

    if (USE_MOCK) {
        return obtenerUsuarioPorIdMock(id);
    }

    const [usuario, direcciones] = await Promise.all([
        pedir(`${API}/${id}`, { mensajeError: 'No se pudieron obtener los datos del usuario.' }),
        pedir(`${API}/${id}/addresses`).catch(() => []),
    ]);

    return {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado: usuario.estado,
        direcciones: (direcciones ?? []).map(mapearDireccion),
    };
}

/**
 * POST /api/v1/users/{id}/addresses
 * CrearDireccionRequest → DireccionResponse
 */
export async function crearDireccion(usuarioId, direccion, { predeterminada = false } = {}) {

    if (USE_MOCK) {
        return crearDireccionMock(usuarioId, direccion);
    }

    const dto = await pedir(`${API}/${usuarioId}/addresses`, {
        method: 'POST',
        body: armarDireccionRequest(direccion, predeterminada),
        mensajeError: 'No pudimos guardar la dirección.',
    });

    return mapearDireccion(dto);
}
