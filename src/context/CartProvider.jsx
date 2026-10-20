import { useRef, useState } from "react"

import { CartContext } from "./CartContext"
import productImage from "../assets/deliverygo_logo.png"

/*
 * Comercio al que pertenece el carrito.
 * TODO: obtenerlo del Módulo Catálogo (API-03).
 */
const store = {
    id: 1,
    name: "La Birra Bar",
    area: "Almagro",
    deliveryTime: "25-35 min",
    image: productImage,
}

/*
 * Dirección de entrega seleccionada.
 * TODO: obtenerla del Módulo Usuarios (direcciones del usuario).
 */
const address = {
    id: 1,
    street: "Av. Corrientes 1450, Piso 4 Depto B",
    detail: "Balvanera, Ciudad Autónoma de Buenos Aires (C1042AAN)",
    instructions: "Timbre: \"4B Rossi\" • Dejar en conserjería si no atiende de inmediato.",
}

/*
 * Carrito inicial de demostración (el mismo que tenía StorePage).
 */
const initialCart = [
    {
        id: 1,
        name: "Golden Burger Doble",
        description: "Doble medallón 120g + cheddar",
        price: 7800,
        image: productImage,
        quantity: 1,
    },
    {
        id: 4,
        name: "Papas con Cheddar y Panceta",
        description: "Porción grande",
        price: 3900,
        image: productImage,
        quantity: 1,
    },
]

const SHIPPING_COST = 850
const SERVICE_FEE = 350

/**
 * Estado global del carrito (DM-01).
 *
 * Lo comparten StorePage, CartPage y CheckoutPage.
 */
export function CartProvider({ children }) {

    const [cart, setCart] = useState(initialCart)

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

    function addToCart(product) {

        setCart((currentCart) => {

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
        address,
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
