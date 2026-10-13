/**
 * Formulario para registrar un nuevo usuario.
 *
 * Props:
 * @param {Function} goToLogin
 * Función recibida desde AuthPage que permite regresar
 * al formulario de inicio de sesión.
 *
 * Actualmente el formulario representa la interfaz visual.
 * TODO: Incorporar persistencia y validación de los datos
 */
function RegisterForm({ goToLogin }) {

  return (
    <div className="flex flex-col gap-space-md">

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
            type="text"
            placeholder="Lucas"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
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
            type="text"
            placeholder="Martínez"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
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
          type="email"
          placeholder="tu@correo.com.ar"
          className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>

      {/* Dirección habitual de entrega */}
      <div className="flex flex-col gap-1.5">

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
            type="text"
            placeholder="Av. Santa Fe 3200"
            className="w-full h-11 pl-10 pr-24 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          />

          {/* Indicador visual de la localidad */}
          <span className="absolute right-2 px-2 py-1 rounded bg-surface-container text-on-surface font-caption-bold text-caption-bold">
            CABA
          </span>
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
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
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
              type="tel"
              placeholder="11 5555-1234"
              className="w-full h-11 pl-16 pr-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>
      </div>

      {/* Aceptación de términos y condiciones */}
      <label className="flex items-start gap-3 cursor-pointer select-none pt-1">

        <input
          type="checkbox"
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

      {/* Botón principal de registro */}
      <button
        type="button"
        className="w-full h-12 rounded-lg bg-primary-container hover:bg-surface-tint active:scale-[0.99] text-on-primary font-body-lg-medium text-body-lg-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-1"
      >

        <span>
          Registrarme y empezar
        </span>

        <span className="material-symbols-outlined text-[20px]">
          rocket_launch
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
    </div>
  )
}

export default RegisterForm