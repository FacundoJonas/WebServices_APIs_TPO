
/*
 * Comercios simulados del Módulo Catálogo.
 *
 * Tienen la forma del DTO que devolvería el backend
 * (no la de StoreCard): catalogoServicie.js se encarga de convertirlos.
 */
const comerciosMock = [
    {
        id: 1,
        name: "La Birra Bar",
        category: "burgers",
        description: "Hamburguesas • Cervezas artesanales (1.240)",
        rating: 4.8,
        deliveryTimeMin: 25,
        deliveryTimeMax: 35,
        shippingCost: 850,
        open: true,
        opensAt: null,
        imageUrl: null,
    },{
        id: 2,
        name: "Pizzería Güerrín",
        category: "pizza",
        description: "Pizza clásica porteña • Fugazzeta (3.410)",
        rating: 4.9,
        deliveryTimeMin: 30,
        deliveryTimeMax: 40,
        shippingCost: 950,
        open: true,
        opensAt: null,
        imageUrl: null,
    },
    {
        id: 3,
        name: "Sushiclub Recoleta",
        category: "sushi",
        description: "Sushi & Fusión • Woks (890)",
        rating: 4.7,
        deliveryTimeMin: 40,
        deliveryTimeMax: 50,
        shippingCost: 0,
        open: true,
        opensAt: null,
        imageUrl: null,
    }
]

/*
 * Productos simulados del Módulo Catálogo.
 * Cada uno indica a qué comercio pertenece (merchantId).
 */
const productosMock = [
    {
        id: 1,
        merchantId: 1,
        categoryId: "hamburguesas-dobles",
        categoryName: "Hamburguesas Dobles & Triples",
        name: "Golden Burger Doble",
        description: "Doble medallón de carne smash de 120g, queso cheddar americano x4, bacon crocante y salsa Thousand Island en pan brioche de papa.",
        price: 7800,
        available: true,
        badge: "Más pedida",
        badgeIcon: "workspace_premium",
        badgeColor: "text-amber-600",
        imageUrl: null,
    },
    {
        id: 2,
        merchantId: 1,
        categoryId: "hamburguesas-dobles",
        categoryName: "Hamburguesas Dobles & Triples",
        name: "Royale Burger",
        description: "Medallón de carne novillo, cebolla caramelizada lentamente, queso brie fundido, rúcula fresca seleccionada y mayonesa ahumada artesanal.",
        price: 8200,
        available: true,
        imageUrl: null,
    },
    {
        id: 3,
        merchantId: 1,
        categoryId: "hamburguesas-dobles",
        categoryName: "Hamburguesas Dobles & Triples",
        name: "Truffle Bacon Smash",
        description: "Doble smash con mayonesa emulsionada de trufas negras europeas, panceta ahumada crujiente y cebolla morada grillada.",
        price: 8900,
        available: false,
        imageUrl: null,
    },
    {
        id: 4,
        merchantId: 1,
        categoryId: "guarniciones-papas",
        categoryName: "Guarniciones & Papas",
        name: "Papas con Cheddar y Panceta",
        description: "Papas bastón rústicas doble cocción, cheddar fundido de la casa, lluvia de panceta crocante y ciboulette finamente picado.",
        price: 3900,
        available: true,
        imageUrl: null,
    },
    {
        id: 5,
        merchantId: 1,
        categoryId: "bebidas-cervezas",
        categoryName: "Bebidas & Cervezas",
        name: "Limonada con Menta y Jengibre 500ml",
        description: "Fresca exprimida en el momento con jugo de limones tucumanos, hojas frescas de menta orgánica y un toque de jengibre.",
        price: 2100,
        available: true,
        badge: "100% Natural",
        badgeIcon: "eco",
        imageUrl: null,
    },
    {
        id: 201,
        merchantId: 2,
        categoryId: "pizzas",
        categoryName: "Pizzas",
        name: "Muzzarella grande",
        description: "Muzzarella abundante, salsa de tomate y aceitunas. 8 porciones.",
        price: 9500,
        available: true,
        badge: "Más pedida",
        badgeIcon: "workspace_premium",
        badgeColor: "text-amber-600",
        imageUrl: null,
    },
    {
        id: 202,
        merchantId: 2,
        categoryId: "pizzas",
        categoryName: "Pizzas",
        name: "Fugazzeta rellena",
        description: "Rellena de muzzarella, con cebolla dorada y orégano. 8 porciones.",
        price: 12800,
        available: true,
        imageUrl: null,
    },
    {
        id: 203,
        merchantId: 2,
        categoryId: "empanadas",
        categoryName: "Empanadas",
        name: "Empanada de carne",
        description: "Carne cortada a cuchillo, al horno.",
        price: 1600,
        available: true,
        imageUrl: null,
    },
    {
        id: 301,
        merchantId: 3,
        categoryId: "rolls",
        categoryName: "Rolls",
        name: "Philadelphia Roll x10",
        description: "Salmón, queso crema y palta.",
        price: 11200,
        available: true,
        imageUrl: null,
    },
    {
        id: 302,
        merchantId: 3,
        categoryId: "woks",
        categoryName: "Woks",
        name: "Wok de vegetales y pollo",
        description: "Fideos de arroz, pollo y vegetales salteados con salsa teriyaki.",
        price: 9800,
        available: false,
        imageUrl: null,
    },
]

// Cambiar a true para probar el manejo de errores (sirve para el Demo Day).
const SIMULAR_ERROR = false

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * GET /api/v1/catalog
 * Devuelve la lista de comercios.
 */
export async function obtenerComerciosMock() {

    await esperar(500)

    if (SIMULAR_ERROR) {
        throw new Error("No pudimos cargar los comercios. Intentá nuevamente.")
    }

    return comerciosMock
}

/*
 * GET /api/v1/catalog?merchantId={id}
 * Devuelve los productos de un comercio.
 */
export async function obtenerProductosMock(merchantId) {

    await esperar(500)

    if (SIMULAR_ERROR) {
        throw new Error("No pudimos cargar los productos. Intentá nuevamente.")
    }

    return productosMock.filter(
        (producto) => String(producto.merchantId) === String(merchantId)
    )
}