/*
 * Página web del emisor (Módulo Pedidos).
 *
 * Todo se comunica con la API del MISMO emisor (rutas relativas "api/v1/...").
 * Para verificar en el receptor se usa GET api/v1/orders/{id}/verificacion:
 * el emisor le pregunta al receptor por la red y devuelve lo que este guardó.
 * Así la página funciona aunque el navegador sólo llegue a la CT del emisor.
 *
 * Los datos que escribe el usuario se muestran siempre con textContent
 * (nunca con innerHTML), para no permitir inyección de HTML.
 */

// ------------------------------------------------------------------
// Catálogo de demostración (en el TPO real lo da el Módulo Catálogo)
// ------------------------------------------------------------------
const COMERCIOS = [
  {
    id: "m-1", nombre: "La Birra Bar",
    productos: [
      { id: "p-1", nombre: "Golden Burger Doble", precio: 7800 },
      { id: "p-2", nombre: "Royale Burger", precio: 8500 },
      { id: "p-4", nombre: "Papas con Cheddar y Panceta", precio: 3900 },
      { id: "p-5", nombre: "Limonada", precio: 2200 },
    ],
  },
  {
    id: "m-2", nombre: "Pizzería Corrientes",
    productos: [
      { id: "z-1", nombre: "Muzzarella grande", precio: 9500 },
      { id: "z-2", nombre: "Fugazzeta rellena", precio: 11200 },
      { id: "z-3", nombre: "Fainá", precio: 1800 },
    ],
  },
  {
    id: "m-3", nombre: "Café de Palermo",
    productos: [
      { id: "c-1", nombre: "Café con leche", precio: 2600 },
      { id: "c-2", nombre: "Medialunas x3", precio: 2400 },
      { id: "c-3", nombre: "Tostado de jamón y queso", precio: 4800 },
    ],
  },
]

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------
const $ = (id) => document.getElementById(id)

const pesos = (n) => "$ " + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 })

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

/** Un id único por operación, para encontrarla en los logs de las dos CTs. */
function nuevoCorrelationId() {
  return "web-" + new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 6)
}

/**
 * fetch a la API del emisor. Si la respuesta es un error normalizado
 * {code, message, correlationId}, lo lanza como Error con esos datos.
 */
async function api(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(ruta, opciones)
  } catch {
    throw Object.assign(new Error("No se pudo conectar con el emisor. ¿Está levantado el servicio?"), { code: "SIN_CONEXION" })
  }

  const cuerpo = await respuesta.json().catch(() => null)

  if (!respuesta.ok && !(ruta.includes("diagnostico") && cuerpo)) {
    const error = new Error(cuerpo?.message ?? `Error HTTP ${respuesta.status}`)
    error.code = cuerpo?.code ?? `HTTP_${respuesta.status}`
    error.correlationId = cuerpo?.correlationId
    throw error
  }
  return cuerpo
}

function mostrarAviso(mensaje) {
  const aviso = $("aviso")
  aviso.textContent = mensaje
  aviso.hidden = false
  clearTimeout(mostrarAviso.timer)
  mostrarAviso.timer = setTimeout(() => (aviso.hidden = true), 8000)
}

// ------------------------------------------------------------------
// Encabezado: datos del emisor y estado del receptor
// ------------------------------------------------------------------
async function cargarInfoEmisor() {
  try {
    const ping = await api("api/v1/ping")
    $("info-emisor").textContent = `Emisor · ${ping.hostname} · ${ping.ips.join(", ")}:${ping.port}`
  } catch (e) {
    $("info-emisor").textContent = "Emisor · " + e.message
  }
}

/**
 * completo = true  -> los 5 pasos (el paso 5 escribe una notificación de prueba en el receptor)
 * completo = false -> 4 pasos, sin escribir nada (es el chequeo automático cada 15 s)
 */
async function cargarDiagnostico(completo = false) {
  const boton = $("estado-receptor")
  const texto = $("estado-receptor-texto")
  try {
    const diag = await api("api/v1/diagnostico" + (completo ? "" : "?contrato=false"))
    const fallido = diag.pasos.find((p) => !p.ok)

    boton.className = "estado-receptor " + (diag.ok ? "ok" : "error")
    texto.textContent = diag.ok
      ? "Receptor conectado"
      : `Receptor con problemas: ${fallido ? fallido.nombre : "revisar"}`

    $("diagnostico-url").textContent = "RECEPTOR_URL = " + diag.receptorUrl
    const lista = $("diagnostico-pasos")
    lista.replaceChildren(...diag.pasos.map((p) =>
      el("li", { clase: p.ok ? "ok" : "error" }, [
        el("div", { clase: "nombre-paso", texto: `${p.ok ? "✔" : "✘"} ${p.nombre} (${p.ms} ms)` }),
        el("div", { clase: "detalle", texto: p.detalle }),
        p.sugerencia ? el("div", { clase: "sugerencia", texto: "Sugerencia: " + p.sugerencia }) : null,
      ])
    ))
  } catch (e) {
    boton.className = "estado-receptor error"
    texto.textContent = "No se pudo diagnosticar"
  }
}

$("estado-receptor").addEventListener("click", () => {
  const panel = $("panel-diagnostico")
  panel.hidden = !panel.hidden
  $("estado-receptor").setAttribute("aria-expanded", String(!panel.hidden))
})
$("boton-diagnostico").addEventListener("click", () => cargarDiagnostico(true))

// ------------------------------------------------------------------
// Formulario del cliente
// ------------------------------------------------------------------
const cantidades = new Map() // productoId -> cantidad

function comercioActual() {
  return COMERCIOS.find((c) => c.id === $("comercio").value)
}

function dibujarProductos() {
  cantidades.clear()
  const lista = $("productos")
  lista.replaceChildren(...comercioActual().productos.map((p) => {
    const salida = el("output", { texto: "0", atributos: { "aria-live": "polite", id: "cant-" + p.id } })
    const menos = el("button", { texto: "−", atributos: { type: "button", "aria-label": "Quitar " + p.nombre } })
    const mas = el("button", { texto: "+", atributos: { type: "button", "aria-label": "Agregar " + p.nombre } })

    const cambiar = (delta) => {
      const nueva = Math.max(0, Math.min(99, (cantidades.get(p.id) ?? 0) + delta))
      nueva === 0 ? cantidades.delete(p.id) : cantidades.set(p.id, nueva)
      salida.textContent = String(nueva)
      actualizarTotal()
    }
    menos.addEventListener("click", () => cambiar(-1))
    mas.addEventListener("click", () => cambiar(1))

    return el("li", {}, [
      el("span", { clase: "nombre" }, [el("div", { texto: p.nombre }), el("div", { clase: "precio", texto: pesos(p.precio) })]),
      el("span", { clase: "cantidad" }, [menos, salida, mas]),
    ])
  }))
  actualizarTotal()
}

function itemsSeleccionados() {
  return comercioActual().productos
    .filter((p) => cantidades.has(p.id))
    .map((p) => ({ productId: p.id, quantity: cantidades.get(p.id), unitPrice: p.precio }))
}

function actualizarTotal() {
  const total = itemsSeleccionados().reduce((t, i) => t + i.quantity * i.unitPrice, 0)
  $("total").textContent = pesos(total)
  $("boton-confirmar").disabled = total === 0 || $("cliente").value.trim() === ""
}

$("comercio").replaceChildren(...COMERCIOS.map((c) => el("option", { texto: c.nombre, atributos: { value: c.id } })))
$("comercio").addEventListener("change", dibujarProductos)
$("cliente").addEventListener("input", actualizarTotal)

$("formulario").addEventListener("submit", async (evento) => {
  evento.preventDefault()
  const boton = $("boton-confirmar")
  boton.disabled = true
  boton.textContent = "Enviando…"

  const correlationId = nuevoCorrelationId()
  try {
    const pedido = await api("api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Correlation-Id": correlationId },
      body: JSON.stringify({
        userId: $("cliente").value.trim(),
        merchantId: $("comercio").value,
        deliveryAddressId: "d-1",
        items: itemsSeleccionados(),
      }),
    })
    mostrarResultado(pedido, correlationId)
    dibujarProductos()
    await cargarPedidos()
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
  } finally {
    boton.textContent = "Confirmar pedido"
    actualizarTotal()
  }
})

function mostrarResultado(pedido, correlationId) {
  const n = pedido.notification
  const caja = $("resultado")
  caja.className = "resultado " + (n.status === "ENVIADA" ? "ok" : "error")
  // replaceChildren convierte null en el texto "null": por eso se filtran los vacíos
  caja.replaceChildren(...[
    el("p", {}, [el("strong", { texto: `Pedido #${pedido.id} creado · ${pesos(pedido.total)}` })]),
    el("p", {
      texto: n.status === "ENVIADA"
        ? `✔ El receptor lo recibió (notificación #${n.notificationId}).`
        : `✘ El pedido se guardó, pero el receptor no lo recibió.`,
    }),
    n.lastError ? el("p", { clase: "ayuda", texto: n.lastError }) : null,
    el("p", { clase: "ayuda", texto: "Correlation-Id: " + correlationId }),
  ].filter(Boolean))
  caja.hidden = false
}

// ------------------------------------------------------------------
// Lista de pedidos
// ------------------------------------------------------------------
async function cargarPedidos() {
  let pedidos
  try {
    pedidos = await api("api/v1/orders")
  } catch (e) {
    mostrarAviso(`${e.code}: ${e.message}`)
    return
  }

  $("vacio").hidden = pedidos.length > 0
  $("lista").replaceChildren(...pedidos.map((p) => {
    const n = p.notification
    const acciones = el("td")

    if (n.status === "ENVIADA") {
      const verificar = el("button", { texto: "Verificar en receptor", clase: "boton secundario chico", atributos: { type: "button" } })
      verificar.addEventListener("click", () => verificarEnReceptor(p, verificar))
      acciones.append(verificar)
    } else {
      const reintentar = el("button", { texto: "Reintentar", clase: "boton secundario chico", atributos: { type: "button" } })
      reintentar.addEventListener("click", () => reintentarNotificacion(p, reintentar))
      acciones.append(reintentar)
    }

    const estado = el("td", {}, [el("span", { clase: "etiqueta " + n.status, texto: n.status })])
    if (n.lastError) estado.title = n.lastError

    return el("tr", {}, [
      el("td", { clase: "numero", texto: String(p.id) }),
      el("td", { texto: p.userId }),
      el("td", { clase: "numero", texto: pesos(p.total) }),
      el("td", { clase: "numero", texto: hora(p.createdAt) }),
      estado,
      acciones,
    ])
  }))
}

async function reintentarNotificacion(pedido, boton) {
  boton.disabled = true
  boton.textContent = "Reintentando…"
  try {
    await api(`api/v1/orders/${pedido.id}/notify`, { method: "POST" })
  } catch (e) {
    mostrarAviso(`Pedido #${pedido.id}: ${e.code}: ${e.message}`)
  }
  await cargarPedidos()
}

// ------------------------------------------------------------------
// Verificación: lo que el RECEPTOR tiene guardado
// ------------------------------------------------------------------
async function verificarEnReceptor(pedido, boton) {
  boton.disabled = true
  const contenido = $("dialogo-contenido")
  try {
    const v = await api(`api/v1/orders/${pedido.id}/verificacion`)

    const chequeos = [
      [v.recipientId === pedido.userId, `El destinatario coincide con el cliente (${pedido.userId})`],
      [v.message?.includes(`#${pedido.id}`), `El mensaje menciona el pedido #${pedido.id}`],
      [v.status === "ENVIADA", "El receptor la tiene como ENVIADA"],
    ]

    contenido.replaceChildren(
      el("p", { texto: `Datos leídos de la base del receptor (${v.receptorUrl}):` }),
      el("dl", { clase: "datos" }, [
        el("dt", { texto: "Notificación" }), el("dd", { texto: "#" + v.notificationId }),
        el("dt", { texto: "Mensaje" }), el("dd", { texto: v.message }),
        el("dt", { texto: "Destinatario" }), el("dd", { texto: v.recipientId }),
        el("dt", { texto: "Llegó desde la IP" }), el("dd", { texto: v.originIp }),
        el("dt", { texto: "Recibida" }), el("dd", { texto: new Date(v.receivedAt).toLocaleString("es-AR") }),
        el("dt", { texto: "Correlation-Id" }), el("dd", { texto: v.correlationId }),
      ]),
      el("ul", { clase: "chequeos" }, chequeos.map(([ok, texto]) => el("li", { texto: `${ok ? "✔" : "✘"} ${texto}` }))),
    )
  } catch (e) {
    contenido.replaceChildren(
      el("p", { texto: "No se pudo verificar en el receptor:" }),
      el("p", { clase: "detalle", texto: `${e.code}: ${e.message}` }),
    )
  } finally {
    boton.disabled = false
  }
  $("dialogo").showModal()
}

// ------------------------------------------------------------------
// Arranque y actualización automática
// ------------------------------------------------------------------
dibujarProductos()
cargarInfoEmisor()
cargarDiagnostico()
cargarPedidos()

setInterval(() => { if ($("auto").checked) cargarPedidos() }, 5000)
setInterval(() => cargarDiagnostico(false), 15000)
