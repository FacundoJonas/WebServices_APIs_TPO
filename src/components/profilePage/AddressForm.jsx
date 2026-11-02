import { useState } from "react"

/*
 * Tipos de dirección disponibles.
 */
const addressLabels = [
    { id: "Casa", icon: "home" },
    { id: "Trabajo", icon: "work" },
    { id: "Otro", icon: "bookmark" },
]

/*
 * Clases compartidas por los campos del formulario.
 */
const inputClass = "w-full px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"

const emptyForm = {
    etiqueta: "Casa",
    calle: "",
    pisoDepto: "",
    barrio: "",
    ciudad: "CABA",
    indicaciones: "",
}

/**
 * Formulario para agregar una dirección de entrega.
 *
 * Props:
 * @param {boolean} isFirst
 * Si es la primera dirección, siempre queda como predeterminada.
 *
 * @param {Function} onSave
 * Recibe (direccion, esPredeterminada).
 *
 * @param {Function} onCancel
 * Cierra el formulario sin guardar.
 */
function AddressForm({ isFirst, onSave, onCancel }) {

    const [form, setForm] = useState(emptyForm)

    const [isDefault, setIsDefault] = useState(isFirst)

    const [error, setError] = useState("")

    /**
     * Actualiza un campo del formulario.
     */
    function handleChange(e) {
        setForm((current) => ({ ...current, [e.target.name]: e.target.value }))
    }

    /**
     * Valida y guarda la dirección.
     */
    function handleSubmit(e) {
        e.preventDefault()

        if (!form.calle.trim() || !form.barrio.trim()) {
            setError("Completá la calle con altura y el barrio.")
            return
        }

        onSave(
            {
                etiqueta: form.etiqueta,
                calle: form.calle.trim(),
                pisoDepto: form.pisoDepto.trim(),
                barrio: form.barrio.trim(),
                ciudad: form.ciudad,
                indicaciones: form.indicaciones.trim(),
            },
            isFirst || isDefault
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-space-md mb-space-lg p-space-lg rounded-xl bg-surface-container-low/60"
        >

            <h3 className="font-title-md text-title-md text-on-surface">
                Nueva dirección de entrega
            </h3>

            {/* Tipo de dirección */}
            <div>
                <span className="block font-caption-bold text-caption-bold text-on-surface mb-1.5">
                    Tipo de dirección
                </span>

                <div className="flex items-center gap-space-xs flex-wrap">

                    {addressLabels.map((label) => (
                        <button
                            key={label.id}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, etiqueta: label.id }))}
                            aria-pressed={form.etiqueta === label.id}
                            className={`px-space-md py-1.5 rounded-full font-caption-bold text-caption-bold flex items-center gap-1 transition-colors
                                ${form.etiqueta === label.id
                                ? "bg-primary text-on-primary shadow-sm"
                                : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {label.icon}
                            </span>

                            {label.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calle y altura */}
            <div>
                <label htmlFor="address-calle" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                    Calle y altura
                </label>

                <input
                    id="address-calle"
                    name="calle"
                    type="text"
                    placeholder="Av. Santa Fe 3200"
                    value={form.calle}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>

            {/* Piso/depto, barrio y ciudad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">

                <div>
                    <label htmlFor="address-piso" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                        Piso y depto
                    </label>

                    <input
                        id="address-piso"
                        name="pisoDepto"
                        type="text"
                        placeholder="Piso 3 A"
                        value={form.pisoDepto}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="address-barrio" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                        Barrio
                    </label>

                    <input
                        id="address-barrio"
                        name="barrio"
                        type="text"
                        placeholder="Palermo"
                        value={form.barrio}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="address-ciudad" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                        Zona
                    </label>

                    <select
                        id="address-ciudad"
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="CABA">CABA</option>
                        <option value="GBA">GBA</option>
                    </select>
                </div>
            </div>

            {/* Indicaciones */}
            <div>
                <label htmlFor="address-indicaciones" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                    Indicaciones para el repartidor (opcional)
                </label>

                <textarea
                    id="address-indicaciones"
                    name="indicaciones"
                    rows="2"
                    placeholder="Timbre 3A, portón verde"
                    value={form.indicaciones}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* Mensaje de error */}
            {error && (
                <p role="alert" className="font-body-md text-body-md text-error">
                    {error}
                </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-xs">

                {/* La primera dirección siempre es la predeterminada */}
                {!isFirst ? (
                    <label className="flex items-center gap-space-xs cursor-pointer select-none">

                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="w-4 h-4 rounded accent-primary"
                        />

                        <span className="font-body-md text-body-md text-on-surface">
                            Usar como dirección predeterminada
                        </span>
                    </label>
                ) : (
                    <span className="font-caption-sm text-caption-sm text-secondary">
                        Tu primera dirección queda como predeterminada.
                    </span>
                )}

                <div className="flex items-center justify-end gap-space-xs">

                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="px-space-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-body-md-medium text-body-md-medium transition-colors shadow-sm"
                    >
                        Guardar dirección
                    </button>
                </div>
            </div>
        </form>
    )
}

export default AddressForm
