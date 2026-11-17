/**
 * Modal que informa al usuario que su reseña
 * fue enviada correctamente.
 *
 * Props:
 * @param {boolean} isOpen
 * Determina si el modal debe mostrarse.
 *
 * @param {Function} onClose
 * Función ejecutada cuando el usuario desea cerrar
 * el modal.
 */
function SuccessModal({ isOpen, onClose }) {

  /*
   * Renderizado condicional.
   *
   * Si isOpen es false el componente no renderiza ningún elemento en el DOM.
   */
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md">

      {/* Contenido central del modal */}
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-xl text-center space-y-space-md shadow-xl">

        {/* Ícono de confirmación */}
        <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mx-auto">

          <span className="material-symbols-outlined text-[36px]">
            check_circle
          </span>
        </div>

        {/* Mensaje de confirmación */}
        <div className="space-y-space-2xs">

          <h3 className="font-headline-md text-headline-md text-on-surface">
            ¡Muchas gracias por tu opinión!
          </h3>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Tu reseña fue publicada con éxito y ayuda a La Birra Bar
            y a Matías G. a seguir mejorando cada entrega.
          </p>
        </div>

        {/* Botón para cerrar el modal */}
        <div className="pt-space-sm">

          <button
            type="button"
            onClick={onClose}
            className="w-full py-space-sm bg-primary-container text-on-primary rounded-lg font-title-md text-title-md hover:bg-primary transition-colors shadow-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal
