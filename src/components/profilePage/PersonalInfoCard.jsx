import { useState } from "react"

/*
 * Clases compartidas por los campos del formulario.
 */
const inputClass = "w-full px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container"

/**
 * Datos personales del usuario.
 *
 * Tiene dos modos:
 * - Lectura: muestra los datos.
 * - Edición: muestra un formulario para modificarlos.
 *
 * El email no se puede modificar (es el identificador de la cuenta
 * y debe ser único).
 *
 * Props:
 * @param {Object} usuario
 * Usuario logueado: { nombre, apellido, email, telefono }.
 *
 * @param {Function} onSave
 * Recibe { nombre, apellido, telefono } cuando se guardan los cambios.
 */
function PersonalInfoCard({ usuario, onSave }) {

    const [editing, setEditing] = useState(false)

    /*
     * Valores del formulario mientras se edita.
     */
    const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "" })

    const [error, setError] = useState("")

    /**
     * Pasa a modo edición cargando los datos actuales.
     */
    function startEditing() {
        setForm({
            nombre: usuario?.nombre ?? "",
            apellido: usuario?.apellido ?? "",
            telefono: usuario?.telefono ?? "",
        })
        setError("")
        setEditing(true)
    }

    /**
     * Actualiza un campo del formulario.
     */
    function handleChange(e) {
        setForm((current) => ({ ...current, [e.target.name]: e.target.value }))
    }

    /**
     * Valida y guarda los cambios.
     */
    function handleSubmit(e) {
        e.preventDefault()

        if (!form.nombre.trim()) {
            setError("Ingresá tu nombre.")
            return
        }

        onSave({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            telefono: form.telefono.trim(),
        })

        setEditing(false)
    }

    /*
     * Datos que se muestran en modo lectura.
     */
    const fields = [
        { label: "Nombre", value: usuario?.nombre },
        { label: "Apellido", value: usuario?.apellido },
        { label: "Correo electrónico", value: usuario?.email },
        { label: "Teléfono", value: usuario?.telefono },
    ]

    return (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">

            {/* Encabezado */}
            <div className="flex items-center justify-between gap-space-md mb-space-md">

                <div className="flex items-center gap-space-xs">

                    <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">
                            badge
                        </span>
                    </div>

                    <h2 className="font-title-md text-title-md text-on-surface">
                        Datos personales
                    </h2>
                </div>

                {!editing && (
                    <button
                        type="button"
                        onClick={startEditing}
                        className="px-space-md py-space-xs rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors flex items-center gap-space-xs"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            edit
                        </span>

                        Editar
                    </button>
                )}
            </div>

            {editing ? (

                /* Modo edición */
                <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">

                        <div>
                            <label htmlFor="profile-nombre" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                                Nombre
                            </label>

                            <input
                                id="profile-nombre"
                                name="nombre"
                                type="text"
                                value={form.nombre}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-apellido" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                                Apellido
                            </label>

                            <input
                                id="profile-apellido"
                                name="apellido"
                                type="text"
                                value={form.apellido}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-email" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                                Correo electrónico
                            </label>

                            <input
                                id="profile-email"
                                type="email"
                                value={usuario?.email ?? ""}
                                disabled
                                className={`${inputClass} opacity-60 cursor-not-allowed`}
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-telefono" className="block font-caption-bold text-caption-bold text-on-surface mb-1">
                                Teléfono
                            </label>

                            <input
                                id="profile-telefono"
                                name="telefono"
                                type="tel"
                                placeholder="11 5555-1234"
                                value={form.telefono}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <p role="alert" className="font-body-md text-body-md text-error">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-space-xs">

                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="px-space-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-body-md-medium text-body-md-medium transition-colors shadow-sm"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>

            ) : (

                /* Modo lectura */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">

                    {fields.map((field) => (
                        <div
                            key={field.label}
                            className="bg-surface-container-low/70 p-space-sm rounded-lg flex flex-col"
                        >
                            <span className="font-caption-sm text-caption-sm text-secondary">
                                {field.label}
                            </span>

                            <span className="font-body-md-medium text-body-md-medium text-on-surface mt-1 truncate">
                                {field.value || "Sin completar"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PersonalInfoCard
