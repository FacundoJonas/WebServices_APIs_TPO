import { useState } from "react"

import { AuthContext } from "./AuthContext"
import {
    login as loginService,
    logout as logoutService,
    register as registerService,
    obtenerToken,
    obtenerUsuario
} from "../servicies/authServicie.js"
import { crearDireccion } from "../servicies/userServicie.js"

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

    /*
 * Crea la cuenta e inicia la sesión con los mismos datos.
 * PublicRoute se encarga de redirigir cuando cambia el token.
 */
    async function register(datos) {
        await registerService(datos)
        const data = await login(datos.email, datos.password)

        /*
         * En el contrato de Usuarios el registro no incluye la dirección:
         * se crea con POST /users/{id}/addresses, que ya necesita el token.
         * Si falla, la cuenta queda creada y la dirección se carga desde el perfil.
         */
        if (datos.direccion) {
            try {
                const direccion = await crearDireccion(data.id, datos.direccion, { predeterminada: true })
                const actual = obtenerUsuario()
                const nuevo = { ...actual, direcciones: [...(actual?.direcciones ?? []), direccion] }
                sessionStorage.setItem("usuario", JSON.stringify(nuevo))
                setUsuario(nuevo)
            } catch {
                // RN-11: no se interrumpe el registro por la dirección.
            }
        }

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
        register,
        logout,
        actualizarUsuario,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}