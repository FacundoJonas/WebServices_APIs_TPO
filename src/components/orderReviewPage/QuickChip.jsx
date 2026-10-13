/**
 * Opción rápida seleccionable utilizada para destacar
 * características positivas de una entrega.
 *
 * Props:
 * @param {string} icon
 * Nombre del ícono de Material Symbols.
 *
 * @param {string} label
 * Texto visible dentro del chip.
 *
 * @param {boolean} selected
 * Indica si actualmente se encuentra seleccionado.
 *
 * @param {Function} onClick
 * Función que se ejecuta cuando el usuario hace clic.
 */
function QuickChip({ icon, label, selected, onClick }) {

  return (
    <button
      type="button"
      onClick={onClick}
      className={` flex items-center gap-space-2xs px-space-md py-space-xs rounded-full text-body-md font-body-md transition-all
        ${ selected ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface text-on-surface hover:bg-surface-container" }`}
    >

      {/* El color del ícono también depende de la selección */}
      <span
        className={`
          material-symbols-outlined
          text-[18px]
          ${ selected ? "text-on-primary" : "text-primary-container" }`}
      >
        {icon}
      </span>

      <span>
        {label}
      </span>
    </button>
  )
}

export default QuickChip