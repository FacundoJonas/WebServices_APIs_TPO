import { useState } from "react";
import SocialButton from "../SocialButton";
import appleLogo from "../../assets/apple.png";
import googleLogo from "../../assets/google.png";
import { useAuth } from "../../context/useAuth";
import { useLocation, useNavigate } from "react-router";

/**
 * Formulario de inicio de sesión.
 *
 * Props:
 * @param {Function} goToRegister
 * Función recibida desde AuthPage que permite cambiar
 * del formulario de login al formulario de registro.
 */
function LoginForm({ goToRegister }) {

    const navigate = useNavigate();

    // login del AuthContext: guarda la sesión y actualiza el estado global.
    const { login } = useAuth();

    const location = useLocation();

    // Si el usuario venía de una ruta protegida, se vuelve ahí.
    // Si no, se va al inicio.
    const destino = location.state?.from?.pathname || "/inicio";

    // Controla la visibilidad de la contraseña.
    const [showPassword, setShowPassword] = useState(false);

    // Datos ingresados por el usuario.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Estados de la solicitud.
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * Procesa el inicio de sesión.
     * Invoca el login del AuthContext.
     */
    async function handleLogin(e) {
        e.preventDefault();

        setError("");

        if (!email.trim() || !password) {
            setError("Completá tu correo y contraseña.");
            return;
        }

        setLoading(true);

        try {
            const data = await login(email, password);

            console.log("Login exitoso:", data);
            console.log("Usuario:", data.username);
            console.log("Rol:", data.rol);

            // El AuthContext ya guardó el token y los datos del usuario.
            navigate(destino, { replace: true });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleLogin}
            className="flex flex-col gap-space-md"
        >

            {/* Encabezado del formulario */}
            <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    ¡Hola de nuevo!
                </h2>

                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Ingresá tus datos para continuar con tus pedidos.
                </p>
            </div>

            {/* Opciones de autenticación mediante servicios externos */}
            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">

                <SocialButton
                    image={googleLogo}
                    text="Google"
                />

                <SocialButton
                    image={appleLogo}
                    text="Apple"
                />

            </div>

            {/* Separador */}
            <div className="relative flex items-center justify-center my-1">

                <div className="w-full h-px bg-surface-container-high" />

                <span className="absolute px-3 bg-surface-container-lowest font-caption-sm text-caption-sm text-on-surface-variant">
                    O ingresá con tu correo
                </span>

            </div>

            {/* Campo de correo electrónico */}
            <div className="flex flex-col gap-1.5">

                <label
                    htmlFor="login-email"
                    className="font-label-md text-label-md text-on-surface"
                >
                    Correo electrónico
                </label>

                <div className="relative flex items-center">

                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                        mail
                    </span>

                    <input
                        id="login-email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />

                </div>
            </div>

            {/* Campo de contraseña */}
            <div className="flex flex-col gap-1.5">

                <div className="flex items-center justify-between">

                    <label
                        htmlFor="login-password"
                        className="font-label-md text-label-md text-on-surface"
                    >
                        Contraseña
                    </label>

                    <button
                        type="button"
                        className="font-caption-bold text-caption-bold text-primary hover:underline"
                        onClick={() => alert("Recuperación de contraseña pendiente de implementar.")}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>

                </div>

                <div className="relative flex items-center">

                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                        lock
                    </span>

                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />

                    {/* Mostrar u ocultar contraseña */}
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 flex items-center justify-center p-1 text-on-surface-variant hover:text-on-surface"
                    >

                        <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? "visibility_off" : "visibility"}
                        </span>

                    </button>

                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <p
                    role="alert"
                    className="text-sm text-red-500 text-center"
                >
                    {error}
                </p>
            )}

            {/* Botón principal de inicio de sesión */}
            <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-primary-container hover:bg-surface-tint active:scale-[0.99] text-on-primary font-body-lg-medium text-body-lg-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >

                <span>
                    {loading ? "Ingresando..." : "Ingresar a DeliveryGo"}
                </span>

                <span className="material-symbols-outlined text-[20px]">
                    {loading ? "progress_activity" : "arrow_forward"}
                </span>

            </button>

            {/* Opción para cambiar al formulario de registro */}
            <div className="text-center pt-2">

                <p className="font-body-md text-body-md text-on-surface-variant">

                    ¿No tenés una cuenta todavía?

                    <button
                        type="button"
                        onClick={goToRegister}
                        className="font-body-md-medium text-body-md-medium text-primary hover:underline ml-1"
                    >
                        Creá tu cuenta gratis
                    </button>

                </p>
            </div>

        </form>
    );
}

export default LoginForm;
