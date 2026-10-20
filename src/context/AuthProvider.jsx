import { useState } from "react"

import { AuthContext } from "./AuthContext"
import {
    login as loginService,
    logout as logoutService,
    obtenerToken,
    obtenerUsuario
} from "../servicies/authServicie.js"

/**
 * Estado global de la sesión.
 *
 * Arranca con lo que haya en sessionStorage,
 * así recargar la página no cierra la sesión.
 */
export function AuthProvider({ children }) {

    const [token, setToken] = useState(() => obtenerToken())
    const [usuario, setUsuario] = useState(() => obtenerUsuario())

    /*
     * Llama al servicio (auth/login + users/{id}) y actualiza
     * el estado. Devuelve los datos para que LoginForm pueda usarlos.
     */
    async function login(email, password) {
        const data = await loginService(email, password)
        setToken(obtenerToken())
        setUsuario(obtenerUsuario())
        return data
    }

    function logout() {
        logoutService()
        setToken(null)
        setUsuario(null)
    }

    /*
     * Para cuando se modifique el perfil: actualiza
     * el estado y sessionStorage al mismo tiempo.
     */
    function actualizarUsuario(datos) {
        const nuevo = { ...usuario, ...datos }
        sessionStorage.setItem("usuario", JSON.stringify(nuevo))
        setUsuario(nuevo)
    }

    const value = {
        token,
        usuario,
        login,
        logout,
        actualizarUsuario,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}