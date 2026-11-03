import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"

import { useCart } from "../context/useCart"
import { obtenerComercioPorId, obtenerProductos } from "../servicies/catalogoServicie.js"

import StoreHero from "../components/storePage/StoreHero"
import CategorySidebar from "../components/storePage/CategorySidebar"
import ProductCard from "../components/storePage/ProductCard"
import MiniCart from "../components/storePage/MiniCart"
import Toast from "../components/storePage/Toast"

/**
 * Página principal de detalle de un comercio.
 *
 * El comercio se obtiene del id de la URL (/comercio/:id)
 * y sus productos del Módulo Catálogo.
 *
 * Permite:
 * - Visualizar la información del comercio.
 * - Marcarlo como favorito.
 * - Compartir el comercio.
 * - Navegar entre categorías.
 * - Agregar productos al carrito.
 * - Incrementar o disminuir cantidades.
 * - Visualizar subtotales y total del pedido.
 * - Mostrar mensajes temporales mediante Toast.
 */
function StorePage() {

    /*
     * Id del comercio que viene en la URL.
     */
    const { id } = useParams()

    /*
     * Datos que devuelve el Módulo Catálogo.
     */
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    /*
     * Aumenta cada vez que el usuario toca "Reintentar".
     * Al cambiar, el useEffect vuelve a pedir los datos.
     */
    const [retryCount, setRetryCount] = useState(0)

    /*
     * Pide el comercio y sus productos al entrar a la página,
     * al cambiar de comercio y en cada reintento.
     *
     * "ignore" evita actualizar el estado si la página se desmontó
     * antes de que llegue la respuesta.
     */
    useEffect(() => {

        let ignore = false

        Promise.all([obtenerComercioPorId(id), obtenerProductos(id)])
            .then(([storeData, productsData]) => {
                if (ignore) return

                setError("")
                setStore(storeData)
                setProducts(productsData)
            })
            .catch((error) => {
                if (!ignore) setError(error.message)
            })
            .finally(() => {
                if (!ignore) setLoading(false)
            })

        return () => {
            ignore = true
        }
    }, [id, retryCount])

    /**
     * Vuelve a pedir los datos después de un error.
     */
    function handleRetry() {
        setError("")
        setLoading(true)
        setRetryCount((current) => current + 1)
    }

    /*
     * Indica si el comercio está marcado
     * actualmente como favorito.
     */
    const [favorite, setFavorite] = useState(true)

    /*
     * El carrito ahora vive en CartContext (DM-01)
     * para que CartPage y CheckoutPage puedan usarlo.
     */
    const { cart, addToCart: addProductToCart, changeQuantity } = useCart()

    /*
     * Mensaje temporal utilizado por el componente Toast.
     *
     * Si contiene una cadena vacía, el Toast no se muestra.
     */
    const [toast, setToast] = useState("")

    /**
     * Agrega un producto al carrito.
     *
     * Si el producto ya existe, aumenta su cantidad.
     * Si todavía no existe, lo agrega con cantidad 1.
     */
    function addToCart(product) {

        addProductToCart(product)

        /*
         * Informa visualmente que el producto
         * fue agregado correctamente.
         */
        setToast(`${product.name} agregado al carrito`)

        setTimeout(() => {
            setToast("")
        }, 2200)
    }

    /**
     * Incrementa en una unidad la cantidad de
     * un producto existente en el carrito.
     */
    function increaseQuantity(id) {

        changeQuantity(id, 1)
    }

    /**
     * Disminuye en una unidad la cantidad de
     * un producto del carrito.
     *
     * Cuando la cantidad llega a 0,
     * el producto se elimina del carrito.
     */
    function decreaseQuantity(id) {

        changeQuantity(id, -1)
    }

    /*
     * Agrupa los productos por categoría, respetando
     * el orden en que los devuelve el catálogo.
     */
    const categories = products.reduce((groups, product) => {

        const group = groups.find((item) => item.id === product.categoryId)

        if (group) {
            group.products.push(product)
            group.count += 1
        } else {
            groups.push({
                id: product.categoryId,
                name: product.categoryName,
                count: 1,
                products: [product],
            })
        }

        return groups
    }, [])

    /*
     * Cantidad total de unidades presentes
     * actualmente en el carrito.
     */
    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    )

    /*
     * Suma del precio de todos los productos
     * teniendo en cuenta sus cantidades.
     */
    const subtotal = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    )

    /*
     * El costo de envío se agrega únicamente
     * cuando existe al menos un producto.
     */
    const total =
        subtotal + (cart.length > 0 ? 850 : 0)

    /*
     * Cargando: tarjetas vacías mientras llega la respuesta.
     */
    if (loading) {

        return (
            <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

                <div className="h-64 md:h-80 bg-surface-container-low animate-pulse" />

                <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl space-y-space-md">

                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-32 rounded-xl bg-surface-container-low animate-pulse"
                        />
                    ))}
                </div>
            </main>
        )
    }

    /*
     * Error al consultar el Módulo Catálogo o comercio inexistente.
     */
    if (error) {

        return (
            <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

                <div
                    role="alert"
                    className="max-w-[1280px] mx-auto mt-space-xl flex flex-col items-center text-center py-space-2xl rounded-xl bg-surface-container-lowest shadow-sm"
                >

                    <span className="material-symbols-outlined text-[40px] text-error mb-space-xs">
                        cloud_off
                    </span>

                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-md">
                        {error}
                    </p>

                    <div className="flex items-center gap-space-xs">

                        <button
                            type="button"
                            onClick={handleRetry}
                            className="h-11 px-space-lg rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary font-body-md-medium text-body-md-medium transition-colors"
                        >
                            Reintentar
                        </button>

                        <Link
                            to="/inicio"
                            className="h-11 px-space-lg rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors flex items-center"
                        >
                            Ver comercios
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main id="top" className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

            <div className="flex flex-col w-full">

                {/* Información principal del comercio */}
                <StoreHero
                    store={store}
                    favorite={favorite}
                    onToggleFavorite={() => setFavorite((current) => !current)}
                />

                {/* Área principal del catálogo */}
                <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

                        {/* Navegación de categorías para escritorio */}
                        <CategorySidebar categories={categories} />

                        {/*Catalogo */}
                        <section className="col-span-1 lg:col-span-6 space-y-space-xl">

                            {/* Navegación horizontal visible en dispositivos móviles */}
                            <div className="lg:hidden flex items-center gap-space-xs overflow-x-auto pb-space-xs pr-8">

                                {categories.map((category, index) => (
                                    <a
                                        key={category.id}
                                        href={`#${category.id}`}
                                        className={`px-space-md py-1.5 rounded-full font-caption-bold text-caption-bold shrink-0 shadow-sm
                                            ${index === 0 ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface-variant"}`}
                                    >
                                        {category.name}
                                    </a>
                                ))}
                            </div>

                            {/* Una sección por cada categoría del comercio */}
                            {categories.map((category) => (
                                <ProductSection
                                    key={category.id}
                                    id={category.id}
                                    title={category.name}
                                    products={category.products}
                                    onAdd={addToCart}
                                />
                            ))}

                            {/* Comercio sin productos publicados */}
                            {categories.length === 0 && (
                                <div className="flex flex-col items-center text-center py-space-2xl rounded-xl bg-surface-container-lowest shadow-sm">

                                    <span className="material-symbols-outlined text-[40px] text-secondary mb-space-xs">
                                        restaurant_menu
                                    </span>

                                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                                        Este comercio todavía no publicó productos.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Carrito lateral */}
                        <MiniCart
                            cart={cart}
                            onIncrease={increaseQuantity}
                            onDecrease={decreaseQuantity}
                        />
                    </div>
                </div>

                {/* Carrito para MOBILE */}
                {cart.length > 0 && (

                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest p-space-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">

                        <div className="flex items-center justify-between gap-space-md max-w-[1280px] mx-auto">

                            {/* Resumen del carrito */}
                            <div className="flex flex-col">

                <span className="font-caption-sm text-caption-sm text-secondary">
                  {cartCount} productos seleccionados
                </span>

                                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  $ {total.toLocaleString("es-AR")}
                </span>
                            </div>

                            {/* Checkout (NAV-03) */}
                            <Link
                                to="/carrito"
                                className="h-12 px-space-lg bg-primary-container hover:bg-primary text-on-primary rounded-xl font-body-lg-medium text-body-lg-medium flex items-center justify-center gap-2 shadow-md flex-1"
                            >

                <span>
                  Ir a pagar
                </span>

                                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
                            </Link>
                        </div>
                    </div>

                )}
            </div>

            {/* Mensaje temporal de confirmación */}
            <Toast message={toast} />
        </main>
    )
}

/**
 * Sección reutilizable del catálogo.
 *
 * Props:
 * @param {string} id
 * Identificador utilizado para navegación mediante anclas.
 *
 * @param {string} title
 * Nombre visible de la categoría.
 *
 * @param {Array} products
 * Productos pertenecientes a la categoría.
 *
 * @param {Function} onAdd
 * Función ejecutada cuando se agrega un producto.
 */
function ProductSection({ id, title, products, onAdd }) {

    return (
        <div
            id={id}
            className="space-y-space-md scroll-mt-24"
        >

            {/* Encabezado de la categoría */}
            <div className="flex items-baseline justify-between">

                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    {title}
                </h2>
            </div>

            {/* Generación dinámica de las tarjetas de producto */}
            {products.map((product) => (

                <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={onAdd}
                />
            ))}
        </div>
    )
}

export default StorePage