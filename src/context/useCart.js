import { useContext } from "react"

import { CartContext } from "./CartContext"

/**
 * Hook para usar el carrito desde cualquier componente.
 */
export function useCart() {
    return useContext(CartContext)
}
