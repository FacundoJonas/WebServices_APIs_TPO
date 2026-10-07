import { useState } from "react"

import googleLogo from "../assets/google.png"
import appleLogo from "../assets/apple.png"

import SocialButton from "./SocialButton"

function LoginForm({ goToRegister }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col gap-space-md">

      {/* Encabezado */}
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">¡Hola de nuevo!</h2>

        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Ingresá tus datos para continuar con tus pedidos.</p>
      </div>

      {/* Login social */}
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

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="font-label-md text-label-md text-on-surface">Correo electrónico</label>

        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
            mail
          </span>

          <input
            id="login-email"
            type="email"
            placeholder="tu@correo.com"
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="font-label-md text-label-md text-on-surface">Contraseña</label>

          <button type="button" className="font-caption-bold text-caption-bold text-primary hover:underline">¿Olvidaste tu contraseña?</button>
        </div>

        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
            lock
          </span>

          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Tu contraseña"
            className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 flex items-center justify-center p-1 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>

          </button>
        </div>
      </div>

      {/* Botón login */}
      <button
        type="button"
        className="w-full h-12 rounded-lg bg-primary-container hover:bg-surface-tint active:scale-[0.99] text-on-primary font-body-lg-medium text-body-lg-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-1"
      >

        <span>
          Ingresar a DeliveryGo
        </span>

        <span className="material-symbols-outlined text-[20px]">
          arrow_forward
        </span>

      </button>

      {/* Ir a registro */}
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

    </div>
  )
}

export default LoginForm