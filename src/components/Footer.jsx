import deliveryGoLogo from "../assets/deliverygo_logo.png"

/**
 * Pie de página principal de DeliveryGo.
 *
 * Contiene información institucional, enlaces informativos
 * y medios de pago admitidos.
 *
 * Por alcance los enlaces son solo visuales
 */
function Footer() {

  return (
    <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-space-3xl">

      {/* Contenedor principal del footer */}
      <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl">

        {/* Información organizada en cuatro columnas en pantallas medianas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl pb-space-2xl">

          {/* Información de marca */}
          <div className="space-y-space-sm">

            <div className="flex items-center gap-space-xs">

              <img
                src={deliveryGoLogo}
                alt="DeliveryGo Logo"
                className="h-7 w-auto object-contain"
              />

              <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">
                Delivery
                <span className="text-primary-container">
                  Go
                </span>
              </span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              La plataforma urbana de entregas ultrarrápidas pensada
              para todo el país. Pedí lo que quieras, cuando quieras.
            </p>
          </div>

          {/* Enlaces relacionados con la compañía */}
          <div className="flex flex-col gap-space-xs">

            <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
              MATERIA
            </span>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Aplicaciones Interactivas
            </a>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              2° Cuatrimestre 2026
            </a>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              UADE - FAIN
            </a>
          </div>

          {/* Enlaces legales */}
          <div className="flex flex-col gap-space-xs">

            <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
              GRUPO 8
            </span>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Szlukier Ezequiel
            </a>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Jonas Facundo
            </a>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Graeff Dieguez Nicolas
            </a>

            <a
              href="#"
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Botta Guido
            </a>
          </div>

          {/* Información sobre medios de pago */}
          <div className="flex flex-col gap-space-xs">

            <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
              Pagos Seguros
            </span>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Aceptamos todas las tarjetas de crédito, débito y dinero
              en cuenta con liquidación ARS inmediata.
            </p>

            {/* Representación visual de los medios de pago */}
            <div className="flex items-center gap-space-xs text-secondary mt-space-xs">

              <span className="material-symbols-outlined text-[24px]">
                credit_card
              </span>

              <span className="material-symbols-outlined text-[24px]">
                account_balance_wallet
              </span>

              <span className="material-symbols-outlined text-[24px]">
                qr_code_scanner
              </span>
            </div>
          </div>
        </div>

        {/* Información legal e institucional inferior */}
        <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container-lowest text-center sm:text-left">

          <p className="font-caption-sm text-caption-sm text-on-surface-variant">
            © 2026 Docente: Foglino Alejandro.
          </p>

          <span className="font-caption-sm text-caption-sm text-secondary">
            UADE, Montserrat, Buenos Aires, Argentina
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer