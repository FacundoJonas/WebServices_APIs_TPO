import { useContext } from "react"

import { AuthContext } from "./AuthContext"

/**
 * Hook para usar la sesión desde cualquier componente.
 */
export function useAuth() {
    return useContext(AuthContext)
}