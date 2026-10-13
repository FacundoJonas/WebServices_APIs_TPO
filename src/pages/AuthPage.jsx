import { useState } from "react"

import Feature from "../components/AuthPage/Feature"
import LoginForm from "../components/AuthPage/LoginForm"
import RegisterForm from "../components/AuthPage/RegisterForm"

/**
 * Página de autenticación de DeliveryGo.
 *
 * Permite alternar entre:
 * - Inicio de sesión.
 * - Registro de un nuevo usuario.
 *
 * La página está dividida visualmente en dos paneles:
 * - Panel izquierdo: información institucional y características de la plataforma.
 * - Panel derecho: formularios de autenticación.
 */
function AuthPage() {

  /*
   * Estado que determina qué formulario se encuentra visible.
   *
   * Valores posibles:
   * "login"    -> muestra LoginForm.
   * "register" -> muestra RegisterForm.
   */
  const [activeForm, setActiveForm] = useState("login")

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-space-md">

      {/* Contenedor principal que limita el ancho máximo de la página */}
      <div className="flex flex-col w-full max-w-[1180px] mx-auto py-space-md lg:py-space-xl px-space-xs sm:px-space-md">

        {/* Grilla responsive que divide la pantalla en los dos paneles principales */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-stretch">

          {/* Información visual y características de DeliveryGo */}
          <section className="lg:col-span-5 flex flex-col justify-between relative overflow-hidden rounded-xl bg-surface-container p-space-lg lg:p-space-xl shadow-sm">

            {/* Elementos decorativos de fondo */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />

            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />

            {/* Contenido principal del panel izquierdo */}
            <div className="relative z-10 flex flex-col gap-space-lg">

              {/* Logo de DeliveryGo */}
              <div className="flex items-center gap-space-xs">

                <div className="w-11 h-11 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">

                  <span
                    className="material-symbols-outlined text-[28px]"
                    style={{fontVariationSettings: "'FILL' 1"}}
                  >
                    shopping_bag
                  </span>
                </div>

                <div className="flex items-baseline gap-0.5">

                  <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
                    Delivery
                  </span>

                  <span className="font-headline-md text-headline-md tracking-tight text-primary-container">
                    Go
                  </span>
                </div>
              </div>

              {/* Mensaje principal */}
              <div className="flex flex-col gap-space-xs mt-space-sm">

                <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-primary">
                  Buenos Aires al instante
                </span>

                <h1 className="font-headline-lg text-headline-lg text-on-surface">
                  Tus comidas favoritas en la puerta de tu casa en minutos
                </h1>

                <p className="font-body-md text-body-md text-on-surface-variant">
                  Pedí desde las mejores pizzerías de Corrientes,
                  bodegones de Palermo y cafeterías de especialidad
                  con entrega ultra rápida.
                </p>
              </div>

              {/* Imagen promocional */}
              <div className="relative rounded-xl overflow-hidden shadow-md my-space-xs group">

                <img
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  src=""
                  alt="Repartidor realizando una entrega"
                />

                {/* Texto sobre la imagen */}
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent flex items-end p-space-md">

                  <div className="flex items-center gap-space-xs text-on-primary">

                    {/* Indicador visual animado */}
                    <span className="flex h-2.5 w-2.5 rounded-full bg-primary-fixed-dim animate-pulse" />

                    <span className="font-caption-bold text-caption-bold">
                      Más de 2.400 locales activos en CABA y GBA
                    </span>
                  </div>
                </div>
              </div>

              {/* Características principales de la plataforma */}
              <div className="flex flex-col gap-space-sm">

                <Feature
                  icon="near_me"
                  title="Seguimiento en tiempo real"
                  description="Mirá el recorrido exacto del repartidor desde el despacho hasta tu timbre."
                />

                <Feature
                  icon="payments"
                  title="Pagos protegidos en pesos"
                  description="Tarjetas de débito, crédito en cuotas, Mercado Pago y efectivo contra entrega."
                />

                <Feature
                  icon="support_agent"
                  title="Soporte 24/7 en vivo"
                  description="Equipo dedicado por chat directo para resolver cualquier duda o demora al instante."
                />
              </div>
            </div>

            {/* Información al pie del panel */}
            <div className="relative z-10 pt-space-md mt-space-md flex items-center justify-between">

              <div className="flex items-center gap-1.5 text-on-surface-variant font-caption-bold text-caption-bold">

                <span
                  className="material-symbols-outlined text-[18px] text-primary"
                  style={{fontVariationSettings: "'FILL' 1"}}
                >
                  verified
                </span>

                <span>
                  Plataforma Oficial Verificada
                </span>
              </div>

              <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                v2.4 Argentina
              </span>
            </div>
          </section>

          {/* Formularios de login y registro */}

          <section className="lg:col-span-7 flex flex-col justify-center bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-md relative">

            {/* Selector entre Login y Registro */}
            <div className="flex p-1 bg-surface-container-low rounded-xl mb-space-lg relative">

              {/* Botón que activa el formulario de login */}
              <button
                type="button"
                onClick={() => setActiveForm("login")}
                className={`flex-1 py-2.5 rounded-lg font-body-md-medium text-body-md-medium transition-all duration-200 flex items-center justify-center gap-1.5
                  ${activeForm === "login" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >

                <span className="material-symbols-outlined text-[18px]">
                  login
                </span>

                <span>
                  Iniciar sesión
                </span>
              </button>

              {/* Botón que activa el formulario de registro */}
              <button
                type="button"
                onClick={() => setActiveForm("register")}
                className={`flex-1 py-2.5 rounded-lg font-body-md-medium text-body-md-medium transition-all duration-200 flex items-center justify-center gap-1.5
                  ${activeForm === "register" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
              >

                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>

                <span>
                  Registrarse
                </span>
              </button>
            </div>

            {/* Renderizado condicional del formulario.
             *
             * Se envía una función como prop para permitir que los
             * formularios puedan cambiar de pantalla sin manejar
             * directamente el estado de AuthPage.
             */}
            {activeForm === "login" ? (
              <LoginForm
                goToRegister={() => setActiveForm("register")}
              />
            ) : (
              <RegisterForm
                goToLogin={() => setActiveForm("login")}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default AuthPage