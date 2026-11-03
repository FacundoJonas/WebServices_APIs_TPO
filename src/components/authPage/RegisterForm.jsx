import { useState } from "react"

import { useAuth } from "../../context/useAuth"

const emptyForm = {
    nombre: "",
    apellido: "",
    email: "",
    calle: "",
    barrio: "",
    password: "",
    telefono: "",
}

/*
 * Clases compartidas por los campos del formulario.
 */
const inputClass = "w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"

/**
 * Formulario para registrar un nuevo usuario.
 *
 * Al registrarse, el AuthContext inicia la sesión automáticamente
 * y PublicRoute redirige al usuario fuera del login.
 *
 * Props:
 * @param {Function} goToLogin
 * Función recibida desde AuthPage que permite regresar
 * al formulario de inicio de sesión.
 */
function RegisterForm({ goToLogin }) {

    const { register } = useAuth()

    // Datos ingresados por el usuario.
    const [form, setForm] = useState(emptyForm)
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    // Estados de la solicitud.
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    /**
     * Actualiza un campo del formulario.
     */
    function handleChange(e) {
        setForm((current) => ({ ...current, [e.target.name]: e.target.value }))
    }

    /**
     * Devuelve el primer error de validación, o "" si está todo bien.
     */
    function validate() {

        if (!form.nombre.trim() || !form.apellido.trim()) {
            return "Completá tu nombre y apellido."
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            return "Ingresá un correo electrónico válido."
        }

        if (!form.calle.trim() || !form.barrio.trim()) {
            return "Completá tu dirección y barrio de entrega."
        }

        if (form.password.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres."
        }

        if (!acceptedTerms) {
            return "Tenés que aceptar los Términos y Condiciones."
        }

        return ""
    }

    /**
     * Valida los datos y registra al usuario.
     */
    async function handleSubmit(e) {
        e.preventDefault()

        const validationError = validate()

        if (validationError) {
            setError(validationError)
            return
        }

        setError("")
        setLoading(true)

        try {
            await register({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                telefono: form.telefono.trim(),
                direccion: {
                    calle: form.calle.trim(),
                    barrio: form.barrio.trim(),
                    ciudad: "CABA",
                },
            })
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-space-md"
        >

            {/* Encabezado */}
            <div>

                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Creá tu cuenta
                </h2>

                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Disfrutá envíos bonificados en tus primeros 3 pedidos.
                </p>
            </div>

            {/* Nombre y apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">

                <div className="flex flex-col gap-1.5">

                    <label
                        htmlFor="register-name"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Nombre
                    </label>

                    <input
                        id="register-name"
                        name="nombre"
                        type="text"
                        placeholder="Lucas"
                        autoComplete="given-name"
                        value={form.nombre}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-1.5">

                    <label
                        htmlFor="register-lastname"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Apellido
                    </label>

                    <input
                        id="register-lastname"
                        name="apellido"
                        type="text"
                        placeholder="Martínez"
                        autoComplete="family-name"
                        value={form.apellido}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Correo electrónico */}
            <div className="flex flex-col gap-1.5">

                <label
                    htmlFor="register-email"
                    className="font-label-md text-label-md text-on-surface"
                >
                    Correo electrónico
                </label>

                <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.com.ar"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>

            {/* Dirección habitual de entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">

                <div className="flex flex-col gap-1.5 sm:col-span-2">

                    <label
                        htmlFor="register-address"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Dirección de entrega habitual
                    </label>

                    <div className="relative flex items-center">

            <span className="material-symbols-outlined absolute left-3 text-primary text-[20px] pointer-events-none">
              location_on
            </span>

                        <input
                            id="register-address"
                            name="calle"
                            type="text"
                            placeholder="Av. Santa Fe 3200"
                            autoComplete="street-address"
                            value={form.calle}
                            onChange={handleChange}
                            className="w-full h-11 pl-10 pr-20 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
                        />

                        {/* Indicador visual de la localidad */}
                        <span className="absolute right-2 px-2 py-1 rounded bg-surface-container text-on-surface font-caption-bold text-caption-bold">
              CABA
            </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">

                    <label
                        htmlFor="register-neighborhood"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Barrio
                    </label>

                    <input
                        id="register-neighborhood"
                        name="barrio"
                        type="text"
                        placeholder="Palermo"
                        value={form.barrio}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Contraseña y teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">

                <div className="flex flex-col gap-1.5">

                    <label
                        htmlFor="register-password"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Crear contraseña
                    </label>

                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-1.5">

                    <label
                        htmlFor="register-phone"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Teléfono celular
                    </label>

                    <div className="relative flex items-center">

                        {/* Prefijo telefónico de Argentina */}
                        <span className="absolute left-3 text-on-surface-variant font-caption-bold text-caption-bold">
              +54 9
            </span>

                        <input
                            id="register-phone"
                            name="telefono"
                            type="tel"
                            placeholder="11 5555-1234"
                            autoComplete="tel-national"
                            value={form.telefono}
                            onChange={handleChange}
                            className="w-full h-11 pl-16 pr-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
                        />
                    </div>
                </div>
            </div>

            {/* Aceptación de términos y condiciones */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">

                <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded accent-primary-container"
                />

                <span className="font-caption-sm text-caption-sm text-on-surface-variant leading-relaxed">

          Acepto los{" "}

                    <a
                        href="#"
                        className="text-primary font-caption-bold text-caption-bold hover:underline"
                    >
            Términos y Condiciones
          </a>

                    {" "}y las{" "}

                    <a
                        href="#"
                        className="text-primary font-caption-bold text-caption-bold hover:underline"
                    >
            Políticas de Privacidad
          </a>

                    {" "}de DeliveryGo Argentina.
        </span>
            </label>

            {/* Mensaje de error */}
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-500 text-center"
                >
                    {error}
                </p>
            )}

            {/* Botón principal de registro */}
            <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-primary-container hover:bg-surface-tint active:scale-[0.99] text-on-primary font-body-lg-medium text-body-lg-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >

        <span>
          {loading ? "Creando tu cuenta..." : "Registrarme y empezar"}
        </span>

                <span className="material-symbols-outlined text-[20px]">
          {loading ? "progress_activity" : "rocket_launch"}
        </span>
            </button>

            {/* Permite volver al formulario de login */}
            <div className="text-center pt-1">

                <p className="font-body-md text-body-md text-on-surface-variant">

                    ¿Ya tenés cuenta creada?

                    <button
                        type="button"
                        onClick={goToLogin}
                        className="font-body-md-medium text-body-md-medium text-primary hover:underline ml-1"
                    >
                        Iniciá sesión acá
                    </button>
                </p>
            </div>
        </form>
    )
}

export default RegisterForm
