/**
 * Barra lateral de navegación por categorías.
 *
 * Se muestra en pantallas grandes y permite desplazarse
 * directamente hacia las distintas secciones del catálogo
 * mediante anclas HTML.
 *
 * Props:
 * @param {Array} categories
 * Categorías del comercio: [{ id, name, count }].
 */
function CategorySidebar({ categories }) {

    return (
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-surface-container-lowest rounded-xl p-space-md shadow-sm">

            {/* Encabezado */}
            <div className="flex items-center justify-between pb-space-sm mb-space-xs">

        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
          Categorías
        </span>

                <span className="material-symbols-outlined text-outline text-[18px]">
          menu_book
        </span>
            </div>

            {/* Navegación generada a partir del arreglo categories */}
            <nav className="flex flex-col space-y-1">

                {categories.map((category, index) => (

                    <a
                        key={category.id}
                        href={`#${category.id}`}

                        /* Primer opción recibe estilo destacado para simular la categoría activa inicialmente */
                        className={` flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors
              ${ index === 0 ? "font-body-md-medium text-body-md-medium text-primary-container bg-surface-container-low" :
                            "font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low" }`}
                    >

            <span className="flex items-center gap-2">

              {/* El ícono se muestra únicamente si la categoría lo posee */}
                {category.icon && (

                    <span className="material-symbols-outlined text-[18px]">
                  {category.icon}
                </span>

                )}

                {category.name}
            </span>

                        {/* Cantidad de productos */}
                        <span className="font-caption-sm text-caption-sm text-secondary">
              {category.count}
            </span>
                    </a>
                ))}
            </nav>

            {/* Información adicional de garantía */}
            <div className="mt-space-lg p-space-sm bg-surface-container-low rounded-lg flex items-start gap-space-xs">

        <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0">
          verified_user
        </span>

                <div>

                    <p className="font-caption-bold text-caption-bold text-on-surface">
                        Envío Garantizado
                    </p>

                    <p className="font-caption-sm text-caption-sm text-secondary">
                        Si tu pedido llega frío, te devolvemos el valor en saldo al instante.
                    </p>
                </div>
            </div>
        </aside>
    )
}

export default CategorySidebar