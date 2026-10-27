import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { obtenerComerciosMock } from './mocks/catalogoMock';
import placeholderImage from '../assets/deliverygo_logo.png';

const API = `${BASE_URL}/api/v1/catalog`;

// Cambiar a false cuando el Módulo Catálogo esté disponible
const USE_MOCK = true;

/*
 * El catálogo es público (el inicio se ve sin sesión),
 * así que el token se envía solo si el usuario está logueado.
 */
function headers() {
    const token = obtenerToken();

    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

/*
 * Convierte el DTO del Módulo Catálogo al formato que usa StoreCard.
 * Si el backend cambia el nombre de un campo, solo se ajusta acá.
 */
function mapearComercio(dto) {
    return {
        id: dto.id,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        rating: dto.rating,
        deliveryTime: { min: dto.deliveryTimeMin, max: dto.deliveryTimeMax },
        shippingCost: dto.shippingCost,
        isOpen: dto.open,
        opensAt: dto.opensAt,
        image: dto.imageUrl || placeholderImage,
        path: "/comercio",
    };
}

/**
 * GET /api/v1/catalog
 * Devuelve los comercios disponibles para mostrar en el inicio.
 */
export async function obtenerComercios() {

    let data;

    if (USE_MOCK) {
        data = await obtenerComerciosMock();
    } else {

        const r = await fetch(API, {
            headers: headers()
        });

        if (!r.ok) {
            throw new Error('No pudimos cargar los comercios. Intentá nuevamente.');
        }

        data = await r.json();
    }

    // Si el backend responde paginado ({ content: [...] }), se toma la lista.
    const comercios = Array.isArray(data) ? data : data.content;

    return comercios.map(mapearComercio);
}