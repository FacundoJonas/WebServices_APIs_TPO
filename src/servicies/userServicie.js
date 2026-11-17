import { USUARIOS_URL } from './api';
import { pedir } from './http';
import {
    obtenerUsuarioPorIdMock,
    crearDireccionMock,
    actualizarPerfilMock,
    marcarPredeterminadaMock,
    eliminarDireccionMock,
} from './mocks/usersMock';

/*
 * Módulo Usuarios y Autenticación (Grupo 2) — CU-06.
 *
 * /api/v1/users/{id} y /addresses no están en el consolidado del
 * ecosistema (v1.4.0), pero sí en el contrato del propio módulo
 * (deliverygo-usuarios-auth: doc/openapi/deliverygo-usuarios.yaml).
 */
const API = `${USUARIOS_URL}/api/v1/users`;

// Cambiar a false cuando el Módulo Usuarios esté disponible
const USE_MOCK = true;

/*
 * Zonas del Portal → provincia del contrato.
 */
const PROVINCIA = {
    CABA: 'Ciudad Autónoma de Buenos Aires',
    GBA: 'Buenos Aires',
};

/*
 * DireccionResponse { id, calle, numero, piso, departamento, ciudad,
 * provincia, codigoPostal, predeterminada } → formato del Portal
 * { id, calle, pisoDepto, barrio, ciudad, codigoPostal, predeterminada }.
 *
 * En el Portal "barrio" es la localidad (ciudad del contrato) y "ciudad"
 * es la zona CABA/GBA (provincia del contrato).
 */
function mapearDireccion(dto) {
    return {
        id: dto.id,
        calle: [dto.calle, dto.numero].filter(Boolean).join(' '),
        pisoDepto: [dto.piso && `Piso ${dto.piso}`, dto.departamento].filter(Boolean).join(' '),
        barrio: dto.ciudad ?? '',
        ciudad: dto.provincia === PROVINCIA.GBA ? 'GBA' : 'CABA',
        codigoPostal: dto.codigoPostal,
        predeterminada: Boolean(dto.predeterminada),
    };
}

/*
 * Dirección del formulario del Portal → CrearDireccionRequest.
 * La calle se escribe junto con la altura ("Av. Corrientes 1450"): se separa
 * el número. "Piso 4 B" se separa en piso y departamento. El módulo limita
 * número, piso, departamento y código postal a 10 caracteres.
 */
function armarDireccionRequest(direccion, predeterminada) {
    const calle = direccion.calle.match(/^(.*?)\s+(\d+\w*)\b\s*,?\s*(.*)$/);
    const pisoDepto = (direccion.pisoDepto || calle?.[3] || '').replace(/^piso\s*/i, '').trim();
    const [piso, ...departamento] = pisoDepto.split(/\s+/).filter(Boolean);

    return {
        calle: calle ? calle[1] : direccion.calle,
        numero: calle ? calle[2].slice(0, 10) : 'S/N',
        piso: piso?.slice(0, 10) || undefined,
        departamento: departamento.join(' ').slice(0, 10) || undefined,
        ciudad: direccion.barrio,
        provincia: PROVINCIA[direccion.ciudad] ?? PROVINCIA.CABA,
        codigoPostal: direccion.codigoPostal,
        predeterminada,
    };
}

/*
 * La predeterminada va primero: así la muestran el perfil y el carrito.
 */
function predeterminadaPrimero(direcciones) {
    return [...direcciones].sort((a, b) => Number(b.predeterminada) - Number(a.predeterminada));
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
        direcciones: predeterminadaPrimero((direcciones ?? []).map(mapearDireccion)),
    };
}

/**
 * PUT /api/v1/users/{id}
 * ModificarPerfilRequest { nombre, apellido, email, telefono } → UsuarioResponse
 * El módulo exige el email aunque no cambie.
 */
export async function actualizarPerfil(usuarioId, datos) {

    if (USE_MOCK) {
        return actualizarPerfilMock(usuarioId, datos);
    }

    return pedir(`${API}/${usuarioId}`, {
        method: 'PUT',
        body: {
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            telefono: datos.telefono || null,
        },
        mensajeError: 'No pudimos actualizar tus datos.',
    });
}

/**
 * POST /api/v1/users/{id}/addresses
 * CrearDireccionRequest → DireccionResponse
 */
export async function crearDireccion(usuarioId, direccion, { predeterminada = false } = {}) {

    if (USE_MOCK) {
        return crearDireccionMock(usuarioId, direccion, predeterminada);
    }

    const dto = await pedir(`${API}/${usuarioId}/addresses`, {
        method: 'POST',
        body: armarDireccionRequest(direccion, predeterminada),
        mensajeError: 'No pudimos guardar la dirección.',
    });

    return mapearDireccion(dto);
}

/**
 * PATCH /api/v1/users/{id}/addresses/{addressId}/default → DireccionResponse
 * El módulo desmarca la anterior en la misma operación.
 */
export async function marcarDireccionPredeterminada(usuarioId, direccionId) {

    if (USE_MOCK) {
        return marcarPredeterminadaMock(usuarioId, direccionId);
    }

    const dto = await pedir(`${API}/${usuarioId}/addresses/${direccionId}/default`, {
        method: 'PATCH',
        mensajeError: 'No pudimos cambiar la dirección predeterminada.',
    });

    return mapearDireccion(dto);
}

/**
 * DELETE /api/v1/users/{id}/addresses/{addressId} → 204
 */
export async function eliminarDireccion(usuarioId, direccionId) {

    if (USE_MOCK) {
        return eliminarDireccionMock(usuarioId, direccionId);
    }

    await pedir(`${API}/${usuarioId}/addresses/${direccionId}`, {
        method: 'DELETE',
        mensajeError: 'No pudimos eliminar la dirección.',
    });
}
