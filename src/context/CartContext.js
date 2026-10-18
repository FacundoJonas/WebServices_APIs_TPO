import { createContext } from "react"

/**
 * Contexto del carrito (DM-01).
 *
 * Lo provee CartProvider y se lee con useCart.
 */
export const CartContext = createContext(null)
