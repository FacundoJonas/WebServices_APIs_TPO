/**
 * Notificación temporal utilizada para informar
 * acciones realizadas correctamente.
 *
 * Props:
 * @param {string} message
 * Texto que se mostrará dentro de la notificación.
 *
 * Si message está vacío, el componente no se renderiza.
 */
function Toast({ message }) {

  /*
   * Renderizado condicional.
   *
   * Si no existe un mensaje, no se agrega al DOM.
   */
  if (!message) return null

  return (
    <div className="fixed top-24 right-4 z-50 bg-on-surface text-inverse-on-surface px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">

      {/* Ícono de confirmación */}
      <span className="material-symbols-outlined text-primary-fixed text-[20px]">
        check_circle
      </span>

      {/* Mensaje recibido desde el componente padre */}
      <span className="font-body-md-medium text-body-md-medium">
        {message}
      </span>
    </div>
  )
}

export default Toast