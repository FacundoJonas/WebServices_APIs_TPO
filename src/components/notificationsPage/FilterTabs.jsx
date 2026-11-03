/**
 * Barra de filtros por tipo de notificación.
 *
 * Props:
 * @param {Array} filters
 * Lista de filtros con la forma { id, label }.
 *
 * @param {string} active
 * id del filtro seleccionado.
 *
 * @param {Function} onChange
 * Recibe el id del filtro clickeado.
 */
function FilterTabs({ filters, active, onChange }) {

    return (
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-2xs sm:pb-0">

            {filters.map((filter) => (
                <button
                    key={filter.id}
                    type="button"
                    onClick={() => onChange(filter.id)}
                    className={`px-space-md py-1.5 rounded-full font-body-md-medium text-body-md-medium transition-all whitespace-nowrap
            ${active === filter.id ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    )
}

export default FilterTabs