/**
 * Filtros rápidos y selector de ordenamiento.
 *
 * Props:
 * @param {Array} filters
 * Filtros rápidos con la forma { id, label, icon, iconClass, filled? }.
 *
 * @param {Array} activeFilters
 * ids de los filtros activos.
 *
 * @param {Function} onToggleFilter
 * Recibe el id del filtro clickeado.
 *
 * @param {Array} sortOptions
 * Opciones de orden con la forma { value, label }.
 *
 * @param {string} sortBy
 * Valor de orden seleccionado.
 *
 * @param {Function} onSortChange
 * Recibe el nuevo valor de orden.
 */
function FilterBar({ filters, activeFilters, onToggleFilter, sortOptions, sortBy, onSortChange }) {

    return (
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-2xs">

            {/* Filtros rápidos (se pueden activar varios a la vez) */}
            <div className="flex flex-wrap items-center gap-space-xs">

                {filters.map((filter) => {

                    const isActive = activeFilters.includes(filter.id)

                    return (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => onToggleFilter(filter.id)}
                            className={`px-space-sm py-1.5 rounded-full text-on-surface font-caption-bold text-caption-bold flex items-center gap-1.5 transition-all
                                ${isActive ? "bg-surface-container-high shadow-md" : "bg-surface-container-lowest hover:bg-surface-container-low shadow-sm"}`}
                        >

                            <span
                                className={`material-symbols-outlined text-[16px] ${filter.iconClass}`}
                                style={filter.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                                {filter.icon}
                            </span>

                            {filter.label}
                        </button>
                    )
                })}
            </div>

            {/* Selector de orden */}
            <div className="flex items-center gap-space-xs">

                <label
                    htmlFor="sort-select"
                    className="font-caption-sm text-caption-sm text-secondary"
                >
                    Ordenar por:
                </label>

                <div className="relative">

                    {/* Select controlado: el valor viene de sortBy */}
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="appearance-none bg-surface-container-lowest pl-space-sm pr-space-xl py-1.5 rounded-xl font-body-md-medium text-body-md-medium text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                    >

                        {sortOptions.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[18px]">
                        expand_more
                    </span>
                </div>
            </div>
        </div>
    )
}

export default FilterBar