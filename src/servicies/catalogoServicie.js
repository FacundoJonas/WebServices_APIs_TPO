import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { obtenerCatalogoMock } from './mocks/catalogoMock';
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
 * Convierte el DTO de un producto al formato que usa ProductCard.
 */
function mapearProducto(dto) {
    return {
        id: dto.id,
        categoryId: dto.categoryId,
        categoryName: dto.categoryName,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        available: dto.available,
        badge: dto.badge,
        badgeIcon: dto.badgeIcon,
        badgeColor: dto.badgeColor,
        image: dto.imageUrl || placeholderImage,
    };
}

/*
 * Convierte el DTO del Módulo Catálogo al formato que usan
 * StoreCard y StorePage. Si el backend cambia el nombre
 * de un campo, solo se ajusta acá.
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
        path: `/comercio/${dto.id}`,
        products: (dto.products ?? []).map(mapearProducto),
    };
}

/**
 * GET /api/v1/catalog
 * Devuelve todos los comercios, cada uno con sus productos.
 * Es el único endpoint de listado del Módulo Catálogo.
 */
export async function obtenerComercios() {

    let data;

    if (USE_MOCK) {
        data = await obtenerCatalogoMock();
    } else {

        const r = await fetch(API, {
            headers: headers()
        });

        if (!r.ok) {
            throw new Error('No pudimos cargar el catálogo. Intentá nuevamente.');
        }

        data = await r.json();
    }

    // Si el backend responde paginado ({ content: [...] }), se toma la lista.
    const comercios = Array.isArray(data) ? data : data.content;

    return comercios.map(mapearComercio);
}

/**
 * Busca un comercio por id dentro del catálogo.
 * Devuelve el comercio con sus productos.
 */
export async function obtenerComercioPorId(id) {

    const comercios = await obtenerComercios();

    const comercio = comercios.find((item) => String(item.id) === String(id));

    if (!comercio) {
        throw new Error('No encontramos ese comercio.');
    }

    return comercio;
}
