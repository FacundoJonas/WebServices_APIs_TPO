import { CATALOGO_URL } from './api';
import { pedir } from './http';
import { obtenerCatalogoMock } from './mocks/catalogoMock';
import placeholderImage from '../assets/deliverygo_logo.png';

/*
 * Módulo Comercios y Catálogo (Grupo 7) — CU-02.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/catalogo, /api/v1/comercios
 *
 * Los GET del catálogo son públicos (permitAll en el módulo): el inicio
 * se ve sin sesión y no se manda el token (un token de otra firma daría 401).
 */
const API = `${CATALOGO_URL}/api/v1`;

// Cambiar a false cuando el Módulo Catálogo esté disponible
const USE_MOCK = false;

// El módulo acepta size entre 1 y 100 (CatalogoService.validarCriterios).
const TAMANIO_PAGINA = 100;

// Tope de páginas por búsqueda, para no quedar en un bucle si el total viene mal.
const MAXIMO_PAGINAS = 20;

/* ─── Mapeo del contrato real ──────────────────────────────────────────── */

/*
 * ProductoResponseDTO { id, nombre, precio, disponible, estado, comercioId,
 * categorias: CategoriaDTO[] } → formato de ProductCard.
 */
function mapearProducto(dto) {
    const categoria = dto.categorias?.[0];

    return {
        id: dto.id,
        comercioId: dto.comercioId,
        categoryId: categoria?.id ?? 'otros',
        categoryName: categoria?.nombre ?? 'Otros',
        name: dto.nombre,
        description: '',
        price: dto.precio,
        available: dto.disponible !== false && dto.estado !== 'INACTIVO',
        image: placeholderImage,
    };
}

/*
 * ComercioResponseDTO { id, cuit, razonSocial, estado } + sus productos
 * → formato de StoreCard y StorePage.
 *
 * Los datos de "vidriera" (rating, tiempo y costo de envío) no son de
 * Catálogo: el rating es de Opiniones y el envío de Logística. Hasta que
 * se integren quedan con valores neutros para que la pantalla no se rompa.
 */
function mapearComercio(dto, productos) {
    return {
        id: dto.id,
        name: dto.razonSocial,
        category: productos[0]?.categoryName ?? '',
        description: '',
        rating: '—',
        deliveryTime: { min: '—', max: '—' },
        shippingCost: '—',
        isOpen: dto.estado === 'ACTIVO',
        opensAt: '—',
        image: placeholderImage,
        path: `/comercio/${dto.id}`,
        products: productos,
    };
}

/**
 * GET /api/v1/catalogo?comercioId=&page=&size=
 * Cada respuesta es una página: CatalogoResponseDTO { items, page, size, total }.
 * Se recorren las páginas hasta juntar los "total" productos.
 */
async function buscarProductos(filtros = {}) {
    const productos = [];

    for (let page = 0; page < MAXIMO_PAGINAS; page++) {
        const params = new URLSearchParams({ ...filtros, page, size: TAMANIO_PAGINA });

        const data = await pedir(`${API}/catalogo?${params}`, {
            auth: false,
            mensajeError: 'No pudimos cargar el catálogo. Intentá nuevamente.',
        });

        const items = data?.items ?? [];
        productos.push(...items.map(mapearProducto));

        if (items.length < TAMANIO_PAGINA || productos.length >= (data?.total ?? 0)) {
            break;
        }
    }

    return productos;
}

/**
 * GET /api/v1/comercios/{id} → ComercioResponseDTO
 */
function buscarComercio(id) {
    return pedir(`${API}/comercios/${id}`, {
        auth: false,
        mensajeError: 'No pudimos cargar el comercio.',
    });
}

/* ─── Mapeo del mock ───────────────────────────────────────────────────── */

/*
 * El mock conserva los datos de vidriera que usa el diseño
 * (rating, envío, imágenes), por eso tiene su propio formato.
 */
function mapearProductoMock(dto) {
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

function mapearComercioMock(dto) {
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
        products: (dto.products ?? []).map(mapearProductoMock),
    };
}

/* ─── Funciones exportadas ─────────────────────────────────────────────── */

/**
 * Devuelve todos los comercios con sus productos.
 *
 * El catálogo del contrato es una lista de productos: se agrupan por
 * comercioId y se pide cada comercio. Si un comercio falla, el resto
 * se muestra igual (RN-11).
 */
export async function obtenerComercios() {

    if (USE_MOCK) {
        const comercios = await obtenerCatalogoMock();
        return comercios.map(mapearComercioMock);
    }

    const productos = await buscarProductos();

    const porComercio = new Map();
    for (const producto of productos) {
        const lista = porComercio.get(producto.comercioId) ?? [];
        lista.push(producto);
        porComercio.set(producto.comercioId, lista);
    }

    const resultados = await Promise.allSettled(
        [...porComercio.keys()].map((id) => buscarComercio(id))
    );

    return resultados
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => mapearComercio(r.value, porComercio.get(r.value.id) ?? []));
}

/**
 * Devuelve un comercio con sus productos.
 * GET /api/v1/comercios/{id} + GET /api/v1/catalogo?comercioId={id}
 */
export async function obtenerComercioPorId(id) {

    if (USE_MOCK) {
        const comercios = await obtenerComercios();
        const comercio = comercios.find((item) => String(item.id) === String(id));

        if (!comercio) {
            throw new Error('No encontramos ese comercio.');
        }

        return comercio;
    }

    const [comercio, productos] = await Promise.all([
        buscarComercio(id).catch((error) => {
            if (error.status === 404) throw new Error('No encontramos ese comercio.');
            throw error;
        }),
        buscarProductos({ comercioId: id }),
    ]);

    return mapearComercio(comercio, productos);
}
