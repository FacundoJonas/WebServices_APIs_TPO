import { useState } from "react"
import { Link } from "react-router"

import { useAuth } from "../context/useAuth"

import ProfileSummary from "../components/profilePage/ProfileSummary.jsx"
import PersonalInfoCard from "../components/profilePage/PersonalInfoCard.jsx"
import AddressCard from "../components/profilePage/AddressCard.jsx"
import AddressForm from "../components/profilePage/AddressForm.jsx"

/**
 * Página de perfil del usuario (Módulo Usuarios).
 *
 * Permite:
 * - Ver y modificar los datos personales.
 * - Ver, agregar y eliminar direcciones de entrega.
 * - Elegir la dirección predeterminada.
 *
 * La dirección predeterminada es siempre la primera del arreglo,
 * porque el Header y el inicio usan usuario.direcciones[0].
 *
 * Por ahora no consume servicios: los cambios se guardan en el
 * AuthContext (estado + sessionStorage) mediante actualizarUsuario().
 *
 * TODO: conectar con el Módulo Usuarios cuando esté disponible:
 * - PUT  /api/v1/users/{id}            -> datos personales
 * - POST /api/v1/users/{id}/addresses  -> nueva dirección
 */
function ProfilePage() {

    const { usuario, actualizarUsuario } = useAuth()

    const direcciones = usuario?.direcciones ?? []

    /*
     * Indica si se muestra el formulario de nueva dirección.
     */
    const [showAddressForm, setShowAddressForm] = useState(false)

    /*
     * Mensaje de confirmación después de guardar un cambio.
     */
    const [message, setMessage] = useState("")

    /**
     * Muestra un mensaje de confirmación durante unos segundos.
     */
    function showMessage(text) {
        setMessage(text)
        setTimeout(() => setMessage(""), 3000)
    }

    /**
     * Guarda los datos personales.
     *
     * TODO: llamar a PUT /api/v1/users/{id}.
     */
    function handleSavePersonalInfo(datos) {
        actualizarUsuario(datos)
        showMessage("Tus datos se actualizaron.")
    }

    /**
     * Agrega una dirección nueva.
     * Si se marca como predeterminada, se coloca primera.
     *
     * TODO: llamar a POST /api/v1/users/{id}/addresses
     * y usar el id que devuelva el backend.
     */
    function handleAddAddress(direccion, esPredeterminada) {

        const nueva = { ...direccion, id: Date.now() }

        const lista = esPredeterminada
            ? [nueva, ...direcciones]
            : [...direcciones, nueva]

        actualizarUsuario({ direcciones: lista })
        setShowAddressForm(false)
        showMessage("Dirección agregada.")
    }

    /**
     * Mueve la dirección elegida al primer lugar.
     */
    function handleSetDefault(id) {

        const elegida = direcciones.find((direccion) => direccion.id === id)
        const resto = direcciones.filter((direccion) => direccion.id !== id)

        actualizarUsuario({ direcciones: [elegida, ...resto] })
        showMessage("Dirección predeterminada actualizada.")
    }

    /**
     * Elimina una dirección.
     */
    function handleDeleteAddress(id) {

        actualizarUsuario({
            direcciones: direcciones.filter((direccion) => direccion.id !== id),
        })
        showMessage("Dirección eliminada.")
    }

    return (
        <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

            {/* Contenedor principal de la página */}
            <div className="flex flex-col w-full max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl">

                {/* Breadcrumb */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-space-xs text-secondary font-caption-sm text-caption-sm mb-space-sm"
                >
                    <Link to="/inicio" className="hover:text-primary transition-colors">
                        Inicio
                    </Link>

                    <span className="material-symbols-outlined text-[14px] text-outline">
                        chevron_right
                    </span>

                    <span className="font-body-md-medium text-on-surface">
                        Mi perfil
                    </span>
                </nav>

                {/* Título */}
                <div className="mb-space-xl">

                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                        Mi perfil y direcciones
                    </h1>

                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                        Gestioná tu información personal y las direcciones donde recibís tus pedidos.
                    </p>
                </div>

                {/* Mensaje de confirmación */}
                {message && (
                    <p
                        role="status"
                        className="mb-space-md px-space-md py-space-sm rounded-lg bg-primary-fixed/50 text-primary font-body-md-medium text-body-md-medium flex items-center gap-space-xs"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            check_circle
                        </span>

                        {message}
                    </p>
                )}

                {/* Dos columnas: resumen a la izquierda, contenido a la derecha */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">

                    <aside className="lg:col-span-4 xl:col-span-3">
                        <ProfileSummary
                            usuario={usuario}
                            addressCount={direcciones.length}
                        />
                    </aside>

                    <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-space-xl">

                        {/* Datos personales */}
                        <PersonalInfoCard
                            usuario={usuario}
                            onSave={handleSavePersonalInfo}
                        />

                        {/* Direcciones guardadas */}
                        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-lg">

                                <div>
                                    <div className="flex items-center gap-space-xs">

                                        <div className="w-8 h-8 rounded-lg bg-primary-fixed/50 text-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">
                                                pin_drop
                                            </span>
                                        </div>

                                        <h2 className="font-title-md text-title-md text-on-surface">
                                            Direcciones guardadas
                                        </h2>

                                        <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-caption-bold text-caption-bold">
                                            {direcciones.length}
                                        </span>
                                    </div>

                                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                                        La dirección predeterminada es la que se usa para tus pedidos.
                                    </p>
                                </div>

                                {!showAddressForm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressForm(true)}
                                        className="px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md-medium text-body-md-medium transition-all shadow-sm flex items-center justify-center gap-space-xs shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            add_location_alt
                                        </span>

                                        Agregar dirección
                                    </button>
                                )}
                            </div>

                            {/* Formulario de nueva dirección */}
                            {showAddressForm && (
                                <AddressForm
                                    isFirst={direcciones.length === 0}
                                    onSave={handleAddAddress}
                                    onCancel={() => setShowAddressForm(false)}
                                />
                            )}

                            {/* Lista de direcciones */}
                            {direcciones.length > 0 ? (

                                <div className="grid grid-cols-1 gap-space-md">

                                    {direcciones.map((direccion, index) => (
                                        <AddressCard
                                            key={direccion.id}
                                            direccion={direccion}
                                            isDefault={index === 0}
                                            onSetDefault={() => handleSetDefault(direccion.id)}
                                            onDelete={() => handleDeleteAddress(direccion.id)}
                                        />
                                    ))}
                                </div>

                            ) : !showAddressForm && (

                                /* Sin direcciones guardadas */
                                <div className="flex flex-col items-center text-center py-space-xl rounded-xl bg-surface-container-low">

                                    <span className="material-symbols-outlined text-[40px] text-secondary mb-space-xs">
                                        location_off
                                    </span>

                                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                                        Todavía no agregaste direcciones de entrega.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default ProfilePage
