/*
 * Página web del receptor (Módulo Notificaciones).
 *
 * Todo se comunica con la API del MISMO receptor (rutas relativas "api/v1/...").
 * Desde acá se modifica lo que es responsabilidad de Notificaciones:
 * plantillas, reintentos y (sólo para la prueba) el estado de los canales.
 *
 * Los datos se muestran siempre con textContent (nunca con innerHTML),
 * porque el texto de las plantillas y los mensajes lo escribe un usuario.
 */

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------
const $ = (id) => document.getElementById(id)

const hora = (iso) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

/** Crea un elemento con texto y clases sin usar innerHTML. */
function el(tag, { texto, clase, atributos } = {}, hijos = []) {
  const nodo = document.createElement(tag)
  if (texto !== undefined && texto !== null) nodo.textContent = texto
  if (clase) nodo.className = clase
  if (atributos) Object.entries(atributos).forEach(([k, v]) => nodo.setAttribute(k, v))
  hijos.forEach((h) => h && nodo.append(h))
  return nodo
}

/**
 * fetch a la API del receptor. Si la respuesta es un error normalizado
 * {code, message, correlationId}, lo lanza como Error con esos datos.
 */
async function api(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(ruta, opciones)
  } catch {
    throw Object.assign(new Error("No se pudo conectar con el receptor. ¿Está levantado el servicio?"), { code: "SIN_CONEXION" })
  }

  const cuerpo = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const error = new Error(cuerpo?.message ?? `Error HTTP ${respuesta.status}`)
    error.code = cuerpo?.code ?? `HTTP_${respuesta.status}`
    throw error
  }
  return cuerpo
}

const jsonPut = (cuerpo) => ({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
const jsonPost = (cuerpo) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })

function mostrarAviso(mensaje) {
  const aviso = $("aviso")
  aviso.textContent = mensaje
  aviso.hidden = false
  clearTimeout(mostrarAviso.timer)
  mostrarAviso.timer = setTimeout(() => (aviso.hidden = true), 8000)
}

// ------------------------------------------------------------------
// Encabezado: datos del receptor y canales simulados
// ------------------------------------------------------------------
async function cargarInfoReceptor() {
  try {
    const ping = await api("api/v1/ping")
    $("info-receptor").textContent = `Receptor · ${ping.hostname} · ${ping.ips.join(", ")}:${ping.port}`
  } catch (e) {
    $("info-receptor").textContent = "Receptor · " + e.message
  }
}

async function cargarCanales() {
  let canales
  try {
    canales = await api("api/v1/channels")
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
    return
  }

  $("canales").replaceChildren(...canales.map((c) => {
    const boton = el("button", {
      clase: "estado-receptor " + (c.available ? "ok" : "error"),
      atributos: { type: "button", "aria-pressed": String(!c.available) },
    }, [
      el("span", { clase: "punto", atributos: { "aria-hidden": "true" } }),
      el("span", { texto: `${c.channel}: ${c.available ? "operativo" : "caído"}` }),
    ])
    boton.addEventListener("click", async () => {
      boton.disabled = true
      try {
        await api(`api/v1/channels/${c.channel}`, jsonPut({ available: !c.available }))
      } catch (e) {
        mostrarAviso(`${e.code}: ${e.message}`)
      }
      await cargarCanales()
    })
    return boton
  }))
}

// ------------------------------------------------------------------
// Plantillas: crear y editar
// ------------------------------------------------------------------
let editando = null // código de la plantilla en edición, o null si se crea una nueva

/** Mismo criterio que el servidor: los {clave} del título y del texto. */
function datosDe(titulo, texto) {
  const claves = [...`${titulo} ${texto}`.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1])
  return [...new Set(claves)]
}

function actualizarDatosDetectados() {
  const datos = datosDe($("title").value, $("text").value)
  $("datos-detectados").textContent = "Datos que va a exigir: " + (datos.length ? datos.join(", ") : "ninguno") + "."
}

function modoCrear() {
  editando = null
  $("formulario").reset()
  $("code").disabled = false
  $("titulo-form").textContent = "Nueva plantilla"
  $("boton-guardar").textContent = "Crear plantilla"
  $("boton-cancelar").hidden = true
  $("fila-activa").hidden = true
  actualizarDatosDetectados()
}

function modoEditar(p) {
  editando = p.code
  $("code").value = p.code
  $("code").disabled = true
  $("type").value = p.type
  $("title").value = p.title
  $("text").value = p.text
  $("action").value = p.action ?? ""
  $("active").checked = p.active
  $("titulo-form").textContent = "Editar " + p.code
  $("boton-guardar").textContent = "Guardar cambios"
  $("boton-cancelar").hidden = false
  $("fila-activa").hidden = false
  actualizarDatosDetectados()
  $("title").focus()
}

$("title").addEventListener("input", actualizarDatosDetectados)
$("text").addEventListener("input", actualizarDatosDetectados)
$("boton-cancelar").addEventListener("click", modoCrear)

$("formulario").addEventListener("submit", async (evento) => {
  evento.preventDefault()
  const boton = $("boton-guardar")
  boton.disabled = true

  const cuerpo = {
    type: $("type").value,
    title: $("title").value.trim(),
    text: $("text").value.trim(),
    action: $("action").value.trim() || null,
  }

  try {
    if (editando) {
      await api(`api/v1/templates/${encodeURIComponent(editando)}`, jsonPut({ ...cuerpo, active: $("active").checked }))
    } else {
      await api("api/v1/templates", jsonPost({ ...cuerpo, code: $("code").value.trim().toUpperCase() }))
    }
    modoCrear()
    await cargarPlantillas()
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
  } finally {
    boton.disabled = false
  }
})

async function cargarPlantillas() {
  let plantillas
  try {
    plantillas = await api("api/v1/templates")
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
    return
  }

  $("lista-plantillas").replaceChildren(...plantillas.map((p) => {
    const editar = el("button", { texto: "Editar", clase: "boton secundario chico", atributos: { type: "button" } })
    editar.addEventListener("click", () => modoEditar(p))

    const fila = el("tr", {}, [
      el("td", { texto: p.code }),
      el("td", { texto: p.type }),
      el("td", { clase: "texto-largo", texto: p.title }),
      el("td", { texto: p.requiredData.length ? p.requiredData.join(", ") : "—" }),
      el("td", {}, [el("span", { clase: "etiqueta " + (p.active ? "ENVIADA" : "inactiva"), texto: p.active ? "Activa" : "Inactiva" })]),
      el("td", {}, [editar]),
    ])
    fila.title = p.text
    return fila
  }))
}

// ------------------------------------------------------------------
// Notificaciones recibidas (de cualquier módulo)
// ------------------------------------------------------------------
async function cargarNotificaciones() {
  let notificaciones
  try {
    notificaciones = await api("api/v1/notifications")
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
    return
  }

  $("vacio").hidden = notificaciones.length > 0
  $("lista-notificaciones").replaceChildren(...notificaciones.map((n) => {
    // El botón va junto al estado para que se vea sin desplazar la tabla
    const estado = el("td", {}, [el("span", { clase: "etiqueta " + n.status, texto: n.status })])
    if (n.failureReason) estado.title = n.failureReason
    if (n.status === "FALLIDA") {
      const reintentar = el("button", { texto: "Reintentar", clase: "boton secundario chico", atributos: { type: "button" } })
      reintentar.addEventListener("click", () => reintentarNotificacion(n, reintentar))
      estado.append(" ", reintentar)
    }

    return el("tr", {}, [
      el("td", { clase: "numero", texto: String(n.id) }),
      el("td", { clase: "numero", texto: hora(n.receivedAt) }),
      el("td", { clase: "texto-corto", texto: n.recipientId }),
      el("td", { texto: n.template }),
      el("td", { clase: "texto-largo", texto: n.message }),
      estado,
      el("td", { clase: "numero", texto: String(n.attempts) }),
      el("td", { texto: `${n.originIp ?? "?"} (${n.sourceModule ?? "?"})` }),
    ])
  }))
}

async function reintentarNotificacion(n, boton) {
  boton.disabled = true
  boton.textContent = "Reintentando…"
  try {
    const r = await api(`api/v1/notifications/${n.id}/retry`, { method: "POST" })
    if (r.status === "FALLIDA") mostrarAviso(`Notificación #${n.id}: sigue fallando (intento ${r.attempts}). ${r.failureReason}`)
  } catch (e) {
    mostrarAviso(`Notificación #${n.id}: ${e.code}: ${e.message}`)
  }
  await cargarNotificaciones()
}

// ------------------------------------------------------------------
// Vista del Portal
// ------------------------------------------------------------------
const ICONO = { PEDIDO: "🛵", PROMOCION: "🏷️", SISTEMA: "🛡️" }

function haceCuanto(iso) {
  const minutos = Math.round((Date.now() - new Date(iso)) / 60000)
  if (minutos < 1) return "Recién"
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  return horas < 24 ? `Hace ${horas} h` : new Date(iso).toLocaleDateString("es-AR")
}

async function verComoPortal() {
  const usuario = $("usuario").value.trim()
  if (!usuario) return

  let notificaciones
  try {
    notificaciones = await api(`api/v1/users/${encodeURIComponent(usuario)}/notifications`)
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
    return
  }

  $("json-portal").textContent = JSON.stringify(notificaciones, null, 2)
  $("vacio-portal").hidden = notificaciones.length > 0
  $("tarjetas").replaceChildren(...notificaciones.map((n) =>
    el("article", { clase: "tarjeta" }, [
      el("div", { clase: "izquierda" }, [
        el("span", { clase: "icono", texto: ICONO[n.type] ?? "🔔", atributos: { "aria-hidden": "true" } }),
        el("div", {}, [
          el("div", { clase: "linea" }, [
            el("span", { clase: "etiqueta " + n.status, texto: n.status }),
            el("span", { texto: haceCuanto(n.receivedAt) }),
            el("span", { texto: n.type ?? "sin tipo" }),
          ]),
          el("h3", { texto: n.title ?? n.template }),
          el("p", { texto: n.message }),
        ]),
      ]),
      n.action ? el("span", { clase: "boton secundario chico", texto: n.action }) : null,
    ])
  ))
}

$("form-portal").addEventListener("submit", (evento) => {
  evento.preventDefault()
  verComoPortal()
})

// ------------------------------------------------------------------
// Arranque y actualización automática
// ------------------------------------------------------------------
modoCrear()
cargarInfoReceptor()
cargarCanales()
cargarPlantillas()
cargarNotificaciones()
verComoPortal()

setInterval(() => {
  if ($("auto").checked) {
    cargarNotificaciones()
    verComoPortal()
  }
}, 5000)
