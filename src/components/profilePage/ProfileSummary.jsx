/*
 * Texto a mostrar para cada rol.
 */
const roleLabels = {
    CLIENTE: "Cliente",
    LOCAL: "Comercio",
    ADMIN: "Administrador",
}

/**
 * Tarjeta de resumen del usuario (columna izquierda del perfil).
 *
 * Props:
 * @param {Object} usuario
 * Usuario logueado: { nombre, apellido, email, telefono, rol }.
 *
 * @param {number} addressCount
 * Cantidad de direcciones guardadas.
 */
function ProfileSummary({ usuario, addressCount }) {

    const fullName = `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim()

    /*
     * Iniciales para el avatar. Ejemplo: "Lucas Martínez" -> "LM".
     */
    const initials = `${usuario?.nombre?.[0] ?? ""}${usuario?.apellido?.[0] ?? ""}`.toUpperCase()

    return (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden">

            {/* Franja decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-primary-fixed/60" />

            {/* Avatar con iniciales */}
            <div className="relative mt-4 mb-space-sm w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-headline-md shadow-md">
                {initials || "?"}
            </div>

            <h2 className="font-title-md text-title-md text-on-surface">
                {fullName || "Mi perfil"}
            </h2>

            {/* Rol del usuario */}
            <span className="inline-flex items-center gap-1.5 px-space-sm py-1 bg-surface-container rounded-full mt-space-2xs mb-space-md font-caption-bold text-caption-bold text-primary">

                <span className="material-symbols-outlined text-[16px]">
                    verified_user
                </span>

                {roleLabels[usuario?.rol] ?? "Usuario"}
            </span>

            {/* Datos de contacto */}
            <div className="w-full flex flex-col gap-space-xs text-left bg-surface-container-low p-space-sm rounded-lg">

                <div className="flex items-center gap-space-xs text-on-surface-variant font-caption-sm text-caption-sm">

                    <span className="material-symbols-outlined text-[16px] text-outline">
                        mail
                    </span>

                    <span className="truncate">
                        {usuario?.email}
                    </span>
                </div>

                <div className="flex items-center gap-space-xs text-on-surface-variant font-caption-sm text-caption-sm">

                    <span className="material-symbols-outlined text-[16px] text-outline">
                        call
                    </span>

                    <span>
                        {usuario?.telefono || "Sin teléfono"}
                    </span>
                </div>

                <div className="flex items-center gap-space-xs text-on-surface-variant font-caption-sm text-caption-sm">

                    <span className="material-symbols-outlined text-[16px] text-outline">
                        location_on
                    </span>

                    <span>
                        {addressCount === 1 ? "1 dirección guardada" : `${addressCount} direcciones guardadas`}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ProfileSummary
