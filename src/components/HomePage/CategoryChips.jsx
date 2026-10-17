/**
 * Scroll horizontal de categorías gastronómicas.
 *
 * Props:
 * @param {Array} categories
 * Lista de categorías con la forma { id, label, icon }.
 *
 * @param {string} active
 * id de la categoría seleccionada.
 *
 * @param {Function} onChange
 * Recibe el id de la categoría clickeada.
 */
function CategoryChips({ categories, active, onChange }) {

    return (
        <div className="flex items-center gap-space-xs overflow-x-auto py-1 pr-8 w-full scroll-smooth">

            {categories.map((category) => {

                const isActive = active === category.id

                return (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => onChange(category.id)}
                        className={`shrink-0 h-10 px-space-md rounded-full font-body-md-medium text-body-md-medium flex items-center gap-space-xs shadow-sm transition-all
                            ${isActive ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"}`}
                    >

                        <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-on-primary" : "text-on-surface-variant"}`}>
                            {category.icon}
                        </span>

                        {category.label}
                    </button>
                )
            })}
        </div>
    )
}

export default CategoryChips