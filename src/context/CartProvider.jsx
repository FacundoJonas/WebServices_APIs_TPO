import { useRef, useState } from "react"

import { CartContext } from "./CartContext"

/*
 * Pedidos no cobra envío ni tarifa de servicio: el total del pedido es la
 * suma de sus líneas (PedidoResponse.total). La estimación local usa lo mismo
 * para que el carrito no muestre un importe distinto al que se cobra.
 */
const SHIPPING_COST = 0
const SERVICE_FEE = 0

/**
 * Estado global del carrito (DM-01).
 *
 * Lo comparten StorePage, CartPage y CheckoutPage. Arranca vacío: los
 * productos y el comercio salen de Catálogo cuando el usuario agrega algo
 * desde StorePage. La dirección de entrega es la del usuario (Módulo Usuarios).
 */
export function CartProvider({ children }) {

    const [cart, setCart] = useState([])

    /*
     * Comercio al que pertenece el carrito (null mientras está vacío).
     * Su id viaja a Pedidos como comercioId (CrearPedidoRequest).
     */
    const [store, setStore] = useState(null)

    const [notes, setNotes] = useState("")

    /*
     * Cupón aplicado: { code, discount } o null.
     */
    const [coupon, setCoupon] = useState(null)

    /*
     * Pedido creado en el Módulo Pedidos (DTO-05).
     * Se conserva si el pago es rechazado (DM-03).
     */
    const [order, setOrder] = useState(null)

    /*
     * Aumenta cada vez que cambia el carrito. Permite descartar
     * respuestas de la API que llegan después de un cambio.
     */
    const cartVersion = useRef(0)

    /**
     * @param {Object} product producto de ProductCard
     * @param {Object} comercio comercio de StorePage (opcional)
     *
     * Un pedido es de un solo comercio: si el producto es de otro,
     * el carrito empieza de nuevo con ese comercio.
     */
    function addToCart(product, comercio) {

        const otroComercio = comercio && (!store || String(comercio.id) !== String(store.id))

        if (otroComercio) {
            setStore({
                id: comercio.id,
                name: comercio.name,
                area: comercio.category ?? "",
                // Catálogo no informa el tiempo de entrega ("—"): sólo se muestra si es un número.
                deliveryTime: Number.isFinite(comercio.deliveryTime?.min)
                    ? `${comercio.deliveryTime.min}-${comercio.deliveryTime.max} min`
                    : "",
                image: comercio.image,
            })
        }

        setCart((previousCart) => {

            const currentCart = otroComercio ? [] : previousCart


            const existingItem = currentCart.find((item) => item.id === product.id)

            if (existingItem) {
                return currentCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }

            return [
                ...currentCart,
                {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    quantity: 1,
                },
            ]
        })

        resetOrder()
    }

    /*
     * Suma o resta unidades. Si la cantidad llega a 0, se elimina.
     */
    function changeQuantity(id, amount) {

        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity + amount }
                        : item
                )
                .filter((item) => item.quantity > 0)
        )

        resetOrder()
    }

    function removeFromCart(id) {

        setCart((currentCart) => currentCart.filter((item) => item.id !== id))

        resetOrder()
    }

    /*
     * Si el carrito cambia, el pedido y el cupón ya no son válidos.
     */
    function resetOrder() {
        cartVersion.current += 1
        setOrder(null)
        setCoupon(null)
    }

    /*
     * Las notas viajan dentro del pedido (DTO-04). Si el pedido ya
     * se creó, hay que recrearlo para que lleve las notas nuevas.
     */
    function updateNotes(text) {
        setNotes(text)

        if (order) resetOrder()
    }

    function clearCart() {
        setCart([])
        setStore(null)
        setNotes("")
        resetOrder()
    }

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0)

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

    /*
     * Si el pedido ya existe, se muestran los importes que devolvió
     * el Módulo Pedidos (DTO-05). Si no, una estimación local.
     */
    const amounts = order
        ? {
            subtotal: order.subtotal,
            shipping: order.envio,
            serviceFee: order.tarifaServicio,
            discount: order.descuento,
            total: order.total,
        }
        : {
            subtotal,
            shipping: cart.length > 0 ? SHIPPING_COST : 0,
            serviceFee: cart.length > 0 ? SERVICE_FEE : 0,
            discount: 0,
            total: subtotal + (cart.length > 0 ? SHIPPING_COST + SERVICE_FEE : 0),
        }

    const value = {
        store,
        cart,
        notes,
        updateNotes,
        coupon,
        setCoupon,
        order,
        setOrder,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        amounts,
        getCartVersion: () => cartVersion.current,
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
