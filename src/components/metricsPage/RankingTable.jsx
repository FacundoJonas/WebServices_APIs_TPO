/**
 * Tabla de ranking (top comercios o top repartidores).
 *
 * Props:
 * @param {Array} columns
 * Columnas con la forma { key, label, align, render }.
 * "render" es opcional y recibe la fila completa.
 *
 * @param {Array} rows
 * Filas. Cada una necesita un "id".
 */
function RankingTable({ columns, rows }) {

    const alignClass = { left: "text-left", center: "text-center", right: "text-right" }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">

                <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-caption-bold text-caption-bold uppercase tracking-wider">
                        <th className="py-2.5 px-space-sm text-left rounded-l-lg">#</th>

                        {columns.map((col, i) => (
                            <th
                                key={col.key}
                                className={`py-2.5 px-space-sm ${alignClass[col.align ?? "left"]} ${i === columns.length - 1 ? "rounded-r-lg" : ""}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-surface-container-high font-body-md text-body-md text-on-surface">
                    {rows.map((row, posicion) => (
                        <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">

                            <td className="py-3 px-space-sm font-body-md-medium text-body-md-medium text-on-surface-variant">
                                {posicion + 1}
                            </td>

                            {columns.map((col) => (
                                <td key={col.key} className={`py-3 px-space-sm ${alignClass[col.align ?? "left"]}`}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default RankingTable
