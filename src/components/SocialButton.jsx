/**
 * Botón reutilizable para autenticación mediante
 * proveedores externos como Google o Apple.
 *
 * Props:
 * @param {string} image - Imagen o logo del proveedor.
 * @param {string} text - Texto que se muestra en el botón.
 */
function SocialButton({ image, text }) {

  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors shadow-sm"
    >

      {/* Logo del proveedor */}
      <img
        src={image}
        alt=""
        className="w-5 h-5 object-contain"
      />

      {/* Nombre del proveedor */}
      <span>
        {text}
      </span>
    </button>
  )
}

export default SocialButton