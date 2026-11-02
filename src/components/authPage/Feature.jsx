/**
 * Componente reutilizable que muestra una característica
 * o beneficio de DeliveryGo.
 *
 * Props:
 * @param {string} icon - Nombre del ícono de Material Symbols.
 * @param {string} title - Título de la característica.
 * @param {string} description - Descripción breve de la característica.
 */
function Feature({ icon, title, description }) {

  return (
    <div className="flex items-start gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm">

      {/* Ícono representativo de la característica */}
      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 mt-0.5">

        <span className="material-symbols-outlined text-[18px]">
          {icon}
        </span>
      </div>

      {/* Información textual */}
      <div className="flex flex-col">

        <span className="font-body-md-medium text-body-md-medium text-on-surface">
          {title}
        </span>

        <span className="font-caption-sm text-caption-sm text-on-surface-variant">
          {description}
        </span>
      </div>
    </div>
  )
}

export default Feature