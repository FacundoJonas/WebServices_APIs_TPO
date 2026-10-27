
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