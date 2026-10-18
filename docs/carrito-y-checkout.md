# Carrito y Checkout: guía detallada del código

> Branch: `feature/facundo`
> Pantallas: **PNT-04 Carrito** (`/carrito`) y **Pagar / Checkout** (`/pagar`)
> Este documento explica, como en una clase, cómo funcionan las dos pantallas, qué hace cada parte del código y qué se corrigió en la revisión.

---

## Índice

1. [Cómo levantar y probar las pantallas](#1-cómo-levantar-y-probar-las-pantallas)
2. [Mapa general: cómo encajan las piezas](#2-mapa-general-cómo-encajan-las-piezas)
3. [Conceptos de React y JavaScript que vas a ver](#3-conceptos-de-react-y-javascript-que-vas-a-ver)
4. [El estado global del carrito (`src/context/`)](#4-el-estado-global-del-carrito-srccontext)
5. [Los servicios y los mocks (`src/servicies/`)](#5-los-servicios-y-los-mocks-srcservicies)
6. [Pantalla Carrito (`src/pages/CartPage.jsx`)](#6-pantalla-carrito-srcpagescartpagejsx)
7. [Componentes del carrito (`src/components/cartPage/`)](#7-componentes-del-carrito-srccomponentscartpage)
8. [Pantalla Checkout (`src/pages/CheckoutPage.jsx`)](#8-pantalla-checkout-srcpagescheckoutpagejsx)
9. [Componentes del checkout (`src/components/checkoutPage/`)](#9-componentes-del-checkout-srccomponentscheckoutpage)
10. [Cambios hechos en la revisión](#10-cambios-hechos-en-la-revisión)
11. [Cómo se verificó](#11-cómo-se-verificó)
12. [Pendientes y recomendaciones](#12-pendientes-y-recomendaciones)
13. [Glosario de códigos (RN, API, DTO, NAV, CMP)](#13-glosario-de-códigos)

---

## 1. Cómo levantar y probar las pantallas

```bash
git checkout feature/facundo
npm install        # instala react, react-router, tailwind, vite, etc.
npm run dev        # levanta Vite en http://localhost:5173
```

**Vista previa al costado en VS Code:** `Ctrl+Shift+P` → **Simple Browser: Show** → `http://localhost:5173/comercio`, y arrastrás la pestaña a la derecha. Vite tiene *hot reload*: cada vez que guardás un archivo la página se actualiza sola.

**Recorrido de prueba completo**

| Paso | Qué hacer | Qué tenés que ver |
|---|---|---|
| 1 | Entrar a `/comercio` y agregar productos | El contador del carrito en el Header sube y muestra el total |
| 2 | Tocar el carrito del Header | Llegás a `/carrito` |
| 3 | Usar `+`, `-` y el tacho | Cambian cantidades, subtotales y total |
| 4 | Cupón `NOEXISTE` | Error "El cupón no existe o está vencido." |
| 5 | Cupón `DELIVERYGO20` | Descuento de $1.500 (requiere subtotal ≥ $5.000) |
| 6 | Escribir en "Aclaraciones" con el cupón aplicado | Aviso "Volvé a aplicar el cupón" |
| 7 | "Continuar al pago" | Llegás a `/pagar` |
| 8 | Pagar con **Visa Débito** | Se rechaza **siempre** (está así a propósito en el mock) |
| 9 | "Probar con otro medio de pago" → Mastercard → 3 cuotas → pagar | Pantalla "¡Pago confirmado!" con el número de pedido |
| 10 | Tocar el carrito del Header | El carrito quedó vacío |

> Ojo: si recargás con F5, el carrito vuelve al inicial. Es normal: el estado vive en memoria (React) y no hay backend todavía.

---

## 2. Mapa general: cómo encajan las piezas

```
main.jsx
└── <CartProvider>                  ← estado global del carrito (Context)
    └── <BrowserRouter>             ← habilita las rutas
        └── <Routes>
            ├── /login  → LoginLayout → AuthPage
            └── MainLayout (Header + <Outlet/> + Footer)
                ├── /inicio          → HomePage
                ├── /comercio        → StorePage      ─┐
                ├── /carrito         → CartPage        ├─ los tres leen el MISMO carrito con useCart()
                ├── /pagar           → CheckoutPage   ─┘
                ├── /pedido          → OrderReviewPage
                └── /notificaciones  → NotificationsPage
```

**Idea central:** antes, el carrito vivía *adentro* de `StorePage` con un `useState`. El problema es que el estado de un componente se pierde cuando salís de esa pantalla y otras pantallas no lo pueden leer. Por eso se movió a un **Context** (`CartProvider`) que envuelve toda la app. Así `StorePage`, `CartPage`, `CheckoutPage` y el `Header` comparten los mismos datos.

**Flujo de datos de una compra**

```
StorePage ──addToCart()──▶ CartProvider (cart)
                                 │
CartPage ──crearPedido()──▶ pedidosServicie ──(mock)──▶ pedido { id, subtotal, total... }
         ──aplicarCupon()─▶ pedidosServicie ──(mock)──▶ pedido con descuento
                                 │ setOrder(pedido)
                                 ▼
CheckoutPage ──procesarPago()──▶ pagosServicie ──(mock)──▶ OK  → confirmación + clearCart()
                                                     └──▶ rechazo { codigo } → banner rojo
```

---

## 3. Conceptos de React y JavaScript que vas a ver

| Concepto | Qué es | Ejemplo en el código |
|---|---|---|
| **Componente** | Una función que devuelve JSX (lo que se dibuja) | `function CartPage() { return (<main>...</main>) }` |
| **JSX** | HTML dentro de JavaScript. Las llaves `{ }` insertan valores JS | `<h2>{store.name}</h2>` |
| **Props** | Parámetros que un componente padre le pasa a un hijo | `<CartItem item={item} onRemove={removeFromCart} />` |
| **`useState`** | Guarda un dato que, al cambiar, vuelve a dibujar el componente. Devuelve `[valor, setValor]` | `const [loading, setLoading] = useState(false)` |
| **`useEffect`** | Ejecuta código *después* de dibujar. Con `[]` corre una sola vez al entrar | `useEffect(() => { window.scrollTo(0, 0) }, [])` |
| **`useRef`** | Guarda un valor que **no** redibuja al cambiar y sobrevive entre renders | `const cartVersion = useRef(0)` |
| **Context** | Un "tanque" de datos accesible desde cualquier componente sin pasar props a mano | `CartContext.Provider value={value}` |
| **Custom hook** | Función propia que empieza con `use` y usa otros hooks | `useCart()` |
| **Render condicional** | Mostrar una cosa u otra según una condición | `{cart.length === 0 ? <EmptyCart /> : (...)}` |
| **`&&` en JSX** | Muestra algo sólo si la condición es verdadera | `{error && <p>{error}</p>}` |
| **Listas y `key`** | `.map()` convierte un array en elementos; `key` identifica cada uno para que React no se confunda | `cart.map((item) => <CartItem key={item.id} ... />)` |
| **Input controlado** | El valor del input sale del estado y `onChange` lo actualiza | `value={notes} onChange={(e) => handleNotesChange(e.target.value)}` |
| **`async` / `await`** | Esperar una operación que tarda (una llamada a la API) sin trabar la página | `const order = await crearPedido(...)` |
| **`try / catch / finally`** | `try` intenta, `catch` atrapa el error, `finally` corre siempre | Se usa para apagar el "cargando" pase lo que pase |
| **Spread `...`** | Copia un objeto o array para crear uno nuevo | `{ ...item, quantity: item.quantity + 1 }` |
| **`?.` (optional chaining)** | Si lo de la izquierda es `null`/`undefined`, devuelve `undefined` en vez de romper | `coupon?.code` |
| **`??` (nullish)** | Valor por defecto si lo de la izquierda es `null`/`undefined` | `data.mensaje ?? 'El pago fue rechazado.'` |
| **Template literal** | Strings con `${ }` adentro | `` `Eliminar ${item.name}` `` |
| **`toLocaleString("es-AR")`** | Formatea números al estilo argentino | `19200` → `19.200` |

**Regla de oro de React (inmutabilidad):** nunca se modifica el estado "a mano" (`cart.push(...)` ❌). Siempre se crea un valor nuevo y se lo pasa al `set...` (`setCart([...cart, nuevo])` ✅). Así React detecta el cambio y redibuja.

**Regla de los hooks:** los hooks (`useState`, `useEffect`, etc.) se llaman siempre **arriba de todo** y **en el mismo orden**, nunca adentro de un `if` ni después de un `return`. Por eso en `CheckoutPage` todos los `useState` están antes de los `return` tempranos.

---

## 4. El estado global del carrito (`src/context/`)

Son tres archivos. Están separados para cumplir una regla del plugin `react-refresh` de Vite: un archivo `.jsx` debería exportar sólo componentes para que el *hot reload* funcione bien.

### 4.1 `CartContext.js`

```js
import { createContext } from "react"
export const CartContext = createContext(null)
```

- `createContext(null)` crea el "canal" por donde viajan los datos. El `null` es el valor por defecto si alguien lo usa fuera del `Provider`.

### 4.2 `useCart.js`

```js
export function useCart() {
    return useContext(CartContext)
}
```

- Es un **custom hook**. En lugar de escribir `useContext(CartContext)` en cada pantalla, se escribe `useCart()`. Es más corto y, si mañana cambia el contexto, se cambia en un solo lugar.

### 4.3 `CartProvider.jsx`, sentencia por sentencia

**Datos fijos (fuera del componente)**

```js
const store = { id: 1, name: "La Birra Bar", area: "Almagro", deliveryTime: "25-35 min", image: productImage }
const address = { id: 1, street: "Av. Corrientes 1450, ...", detail: "...", instructions: "..." }
const initialCart = [ { id: 1, name: "Golden Burger Doble", price: 7800, quantity: 1, ... }, { id: 4, ... } ]
const SHIPPING_COST = 850
const SERVICE_FEE = 350
```

- Están **fuera** de la función para que no se vuelvan a crear en cada render. Son datos de demostración; los `TODO` indican que después vendrán del backend (Catálogo y Usuarios).
- Las constantes en MAYÚSCULAS son una convención para valores que no cambian.

**Estados**

```js
const [cart, setCart] = useState(initialCart)   // productos del carrito
const [notes, setNotes] = useState("")          // aclaraciones para cocina/repartidor
const [coupon, setCoupon] = useState(null)      // { code, discount } o null
const [order, setOrder] = useState(null)        // pedido creado en el backend (DTO-05) o null
const cartVersion = useRef(0)                   // contador de cambios del carrito
```

- `order` es clave: mientras sea `null`, todavía no se creó el pedido. Se crea recién cuando el usuario aplica un cupón o toca "Continuar al pago".
- `cartVersion` es un `useRef` y no un `useState` porque **no** queremos redibujar cuando cambia; sólo lo usamos para comparar (ver 6.4, "condición de carrera").

**`addToCart(product)`**

```js
setCart((currentCart) => {
    const existingItem = currentCart.find((item) => item.id === product.id)
    if (existingItem) {
        return currentCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
    }
    return [...currentCart, { id: product.id, name: product.name, ..., quantity: 1 }]
})
resetOrder()
```

1. `setCart((currentCart) => ...)`: se usa la **forma funcional** del setter, que recibe el valor más reciente. Es la forma segura cuando el nuevo valor depende del anterior.
2. `.find(...)` busca si el producto ya estaba.
3. Si estaba, `.map(...)` recorre todo y sólo a ese producto le suma 1 (copiándolo con `...item`).
4. Si no estaba, `[...currentCart, nuevo]` devuelve un array nuevo con el producto agregado al final.
5. `resetOrder()`: si el carrito cambió, el pedido y el cupón que había ya no corresponden.

**`changeQuantity(id, amount)`**

```js
setCart((currentCart) =>
    currentCart
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
        .filter((item) => item.quantity > 0))
resetOrder()
```

- `amount` vale `1` (sumar) o `-1` (restar).
- El `.filter(... > 0)` hace que si la cantidad llega a 0 el producto desaparezca solo.

**`removeFromCart(id)`**: `.filter((item) => item.id !== id)` se queda con todos menos ese.

**`resetOrder()`**

```js
cartVersion.current += 1
setOrder(null)
setCoupon(null)
```

- Sube la versión del carrito, borra el pedido y el cupón. Es el "invalidador" que llaman todas las funciones que cambian el carrito.

**`updateNotes(text)`** *(agregado en la revisión, ver sección 10)*

```js
setNotes(text)
if (order) resetOrder()
```

- Las notas viajan **dentro** del pedido. Si el pedido ya se creó, hay que invalidarlo para que se cree de nuevo con las notas nuevas.

**`clearCart()`**: vacía carrito y notas, y resetea el pedido. Se usa después de pagar.

**Valores calculados (derivados)**

```js
const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
```

- `.reduce` "acumula" un array en un solo valor. Arranca en `0` y va sumando.
- No se guardan en `useState` porque se pueden **calcular** a partir de `cart`. Regla: si un dato se puede calcular, no se guarda como estado (así nunca queda desincronizado).

**`amounts`: de dónde salen los importes**

```js
const amounts = order
    ? { subtotal: order.subtotal, shipping: order.envio, serviceFee: order.tarifaServicio, discount: order.descuento, total: order.total }
    : { subtotal, shipping: cart.length > 0 ? SHIPPING_COST : 0, ..., discount: 0, total: subtotal + ... }
```

- Operador ternario `condición ? A : B`.
- Si **hay pedido**, se muestran los importes que devolvió el backend (la fuente de verdad, por ejemplo con el descuento del cupón).
- Si **no hay pedido**, se muestra una estimación local.
- También traduce los nombres en castellano del backend (`envio`, `tarifaServicio`) a los nombres que usa la interfaz (`shipping`, `serviceFee`).

**El `value` y el `Provider`**

```js
const value = { store, address, cart, notes, updateNotes, coupon, setCoupon, order, setOrder,
                addToCart, changeQuantity, removeFromCart, clearCart, itemCount, amounts,
                getCartVersion: () => cartVersion.current }
return <CartContext.Provider value={value}>{children}</CartContext.Provider>
```

- Todo lo que está en `value` es lo que cualquier componente obtiene con `useCart()`.
- `children` es lo que va "adentro" de `<CartProvider>` en `main.jsx`: toda la app.
- `getCartVersion` es una función (y no el número directo) para leer **siempre** el valor actual del `ref`, incluso dentro de una función `async` que empezó antes.

---

## 5. Los servicios y los mocks (`src/servicies/`)

### 5.1 ¿Por qué separar "servicios"?

Las pantallas no hacen `fetch` directamente: llaman a funciones como `crearPedido(...)`. Así, cuando el backend esté listo, se cambia **sólo** el servicio y las pantallas ni se enteran.

### 5.2 `api.js`

```js
export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8089';
```

- `import.meta.env.VITE_API_URL` lee una variable de entorno de Vite (por ejemplo de un archivo `.env`). Si no existe, usa `localhost:8089` (el Spring Boot).

### 5.3 El interruptor `USE_MOCK`

```js
// Cambiar a false cuando el Módulo Pedidos esté disponible
const USE_MOCK = true;
```

- Con `true` se usan respuestas simuladas (`mocks/`). Con `false` se llama al backend real con `fetch`.

### 5.4 `pedidosServicie.js`

```js
function headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${obtenerToken()}` };
}
```

- `Content-Type` le avisa al backend que mandamos JSON.
- `Authorization: Bearer <token>` manda el token que guardó el login en `sessionStorage`.

**`crearPedido(pedidoRequest)`** → `POST /pedidos` (API-04)

```js
if (USE_MOCK) return crearPedidoMock(pedidoRequest);
const r = await fetch(API, { method: 'POST', headers: headers(), body: JSON.stringify(pedidoRequest) });
if (!r.ok) throw new Error('No se pudo crear el pedido. Intentá nuevamente.');
return r.json();
```

- `JSON.stringify` convierte el objeto JS en texto JSON.
- `r.ok` es `true` si el status HTTP es 200–299.
- `throw new Error(...)` lanza un error que después atrapa el `catch` de la pantalla y lo muestra.

**`aplicarCupon(pedidoId, codigoCupon)`** → `POST /pedidos/{id}/cupon` (API-09). Igual que el anterior.

### 5.5 `pagosServicie.js`

La diferencia importante es **cómo se clasifican los errores**, porque la pantalla reacciona distinto:

```js
try { r = await fetch(url, {...}) }
catch { throw new Error('No pudimos comunicarnos con el servicio de pagos...') }   // sin internet

if (r.status >= 500) throw new Error('El servicio de pagos no está disponible...')  // falla del servidor

if (!r.ok) {                                            // 4xx: el medio de pago fue RECHAZADO
    const data = await r.json().catch(() => ({}));
    const error = new Error(data.mensaje ?? 'El pago fue rechazado.');
    error.codigo = data.codigo ?? `HTTP_${r.status}`;  // ← sólo los rechazos llevan "codigo"
    throw error;
}
```

| Tipo de error | ¿Tiene `codigo`? | Qué muestra la pantalla |
|---|---|---|
| Sin conexión | No | Mensaje gris con ícono `wifi_off`, se puede reintentar con el mismo medio |
| Servidor caído (5xx) | No | Igual que arriba |
| Rechazo del medio (4xx) | **Sí** | Banner rojo "Pago rechazado" y el medio queda bloqueado |

- `await r.json().catch(() => ({}))`: si el cuerpo no es JSON válido, en vez de romper usa un objeto vacío.
- `procesarPago` (API-05) se usa en el primer intento; `reintentarPago` (API-10) en los siguientes, para **no crear un pedido nuevo** (DM-03).

### 5.6 Los mocks

**`mocks/pedidosMock.js`**

```js
const cuponesMock = [
    { codigo: "DELIVERYGO20", descuento: 1500, montoMinimo: 5000 },
    { codigo: "BIRRAFEST",    descuento: 1500, montoMinimo: 10000 },
]
const pedidosMock = []   // "base de datos" en memoria
function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
```

- `esperar(600)` simula la demora de la red, para poder ver los estados "Creando pedido..." y "Aplicando...".
- `crearPedidoMock`: valida que haya ítems, calcula el subtotal con `.reduce`, arma el pedido con estado `PENDIENTE_PAGO` y un `id` incremental (1001, 1002…), lo guarda y devuelve **una copia** (`{ ...pedido }`) para que React no comparta el mismo objeto con el mock.
- `aplicarCuponMock`: busca el pedido, busca el cupón (sin importar mayúsculas, gracias a `.toUpperCase()`), valida el monto mínimo (RN-02) y recalcula el total.

**`mocks/pagosMock.js`**

```js
const rechazosMock = { "visa-4821": "ERR_INSUFFICIENT_FUNDS_704" }
```

- Cualquier pago con la Visa Débito devuelve un error **con `codigo`**, para poder mostrar el caso de rechazo (RN-05). Los demás medios se aprueban con estado `CONFIRMADO`.

---

## 6. Pantalla Carrito (`src/pages/CartPage.jsx`)

### 6.1 Imports

```js
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
```

- `Link` es un `<a>` que cambia de ruta **sin recargar** la página (mantiene el estado del carrito).
- `useNavigate()` devuelve una función para navegar desde código (por ejemplo, después de crear el pedido).

### 6.2 Lectura del contexto

```js
const { store, address, cart, notes, updateNotes, coupon, setCoupon, order, setOrder,
        changeQuantity, removeFromCart, itemCount, amounts, getCartVersion } = useCart()
```

- **Desestructuración**: saca del objeto `value` del provider sólo lo que esta pantalla usa.

### 6.3 Efecto de scroll y estados locales

```js
useEffect(() => { window.scrollTo(0, 0) }, [])

const [couponLoading, setCouponLoading] = useState(false)  // ¿se está validando el cupón?
const [couponError, setCouponError] = useState("")         // mensaje de error del cupón
const [loading, setLoading] = useState(false)              // ¿se está creando el pedido?
const [error, setError] = useState("")                     // error general
const busy = loading || couponLoading
```

- El `useEffect` con `[]` corre una vez al entrar: React Router no resetea el scroll entre rutas, entonces lo hacemos a mano.
- Estos estados son **locales** (sólo le importan a esta pantalla), por eso no van al contexto.
- `busy` es un valor derivado: si hay *cualquier* llamada en curso, se bloquean botones e inputs para evitar pedidos duplicados.

### 6.4 `getOrCreateOrder()`: crear el pedido una sola vez

```js
if (order) return order
const usuario = obtenerUsuario()
const newOrder = await crearPedido({
    usuarioId: usuario?.username,
    comercioId: store.id,
    items: cart.map((item) => ({ productoId: item.id, cantidad: item.quantity, precioUnitario: item.price })),
    notas: notes,
    direccionEntregaId: address.id,
})
return newOrder
```

- Si ya existe un pedido, lo reutiliza (no crea otro).
- Si no, arma el **DTO-04 CrearPedidoRequest**. El `.map` traduce cada ítem del carrito (en inglés, el formato de la interfaz) al formato que espera el backend (en castellano).
- `usuario?.username`: si no hay sesión, no rompe; manda `undefined`.

### 6.5 `handleApplyCoupon(code)` y la "condición de carrera"

```js
setCouponError("")
setCouponLoading(true)
const version = getCartVersion()          // 1) foto de la versión ANTES de esperar
try {
    const currentOrder = await getOrCreateOrder()
    if (getCartVersion() !== version) {   // 2) ¿cambió el carrito mientras esperábamos?
        setCouponError("Tu carrito cambió. Volvé a aplicar el cupón.")
        return
    }
    setOrder(currentOrder)
    const updatedOrder = await aplicarCupon(currentOrder.id, code)
    if (getCartVersion() !== version) { ...; return }
    setOrder(updatedOrder)
    setCoupon({ code: code.toUpperCase(), discount: updatedOrder.descuento })
} catch (err) {
    setCouponError(err.message)          // por ej. "El cupón no existe o está vencido."
} finally {
    setCouponLoading(false)              // siempre se apaga el "Aplicando..."
}
```

**¿Qué es una condición de carrera?** Mientras esperamos la respuesta (el `await`), el usuario podría tocar `+` y cambiar el carrito. Si después guardáramos la respuesta vieja, el pedido no coincidiría con el carrito. La solución:

1. Antes del `await` se guarda la versión del carrito.
2. Después del `await` se compara. Si es distinta, se **descarta** la respuesta.

Además, como `busy` bloquea los botones, en la práctica es difícil que pase, pero el código queda protegido igual.

### 6.6 `handleRemoveCoupon()`

```js
setCoupon(null)
setOrder(null)
```

- El descuento está guardado en el pedido del backend, así que para "sacarlo" se descarta el pedido y se creará uno nuevo sin cupón al continuar.

### 6.7 `handleNotesChange(text)` *(agregado en la revisión)*

```js
if (coupon) setCouponError("Modificaste las aclaraciones. Volvé a aplicar el cupón.")
updateNotes(text)
```

- Avisa al usuario **antes** de que el cupón se pierda, y delega en el provider la invalidación del pedido.

### 6.8 `handleContinue()`

```js
setError(""); setLoading(true)
const version = getCartVersion()
try {
    const currentOrder = await getOrCreateOrder()
    if (getCartVersion() !== version) { setError("Tu carrito cambió..."); return }
    setOrder(currentOrder)
    navigate("/pagar")
} catch (err) { setError(err.message) }
finally { setLoading(false) }
```

- Mismo patrón que el cupón: crea (o reutiliza) el pedido, lo guarda en el contexto y navega a `/pagar`. **CheckoutPage necesita que `order` exista**; por eso se crea acá.

### 6.9 El JSX (lo que se dibuja)

- **Encabezado**: link "Volver" a `/comercio`, título y la etiqueta `{itemCount} ítems`.
- `{cart.length === 0 ? <EmptyCart /> : (...)}`: si no hay productos se muestra el estado vacío (RN-01); si hay, la grilla.
- **Grilla** `grid-cols-1 lg:grid-cols-12`: en el celular es una columna; en pantallas grandes, 8 columnas a la izquierda y 4 a la derecha (`lg:col-span-8` / `lg:col-span-4`).
- **Tarjeta del comercio**: imagen, nombre, zona y tiempo de entrega (`whitespace-nowrap` para que "25-35 min" no se parta). El botón "Agregar más" en el celular muestra sólo el ícono (`hidden sm:inline` en el texto).
- **Lista de productos**: `cart.map(...)` dibuja un `<CartItem>` por producto, con `key={item.id}`.
- **Aclaraciones**: `<textarea>` controlado, máximo 200 caracteres, deshabilitado mientras `busy`.
- **Cupón**: `<CouponInput>` recibe todo por props.
- **Columna derecha** (`lg:sticky lg:top-24`: se queda fija al hacer scroll en desktop): `<PurchaseSummary>`, el error general y el botón "Continuar al pago", deshabilitado si el carrito está vacío o hay algo en curso.

---

## 7. Componentes del carrito (`src/components/cartPage/`)

Son **componentes de presentación**: no tienen lógica de negocio, sólo reciben datos y funciones por props y dibujan. Esto los hace fáciles de reutilizar y de probar.

### 7.1 `CartItem.jsx` (CMP-13)

```js
function CartItem({ item, onIncrease, onDecrease, onRemove, disabled = false })
```

- `disabled = false` es un **parámetro por defecto**: si el padre no lo manda, vale `false`.
- `{item.description ?? \`$ ${item.price...} c/u\`}`: si el producto no tiene descripción, muestra el precio unitario.
- `onClick={() => onRemove(item.id)}`: se usa una **función flecha** para pasar el `id`. Si se escribiera `onClick={onRemove(item.id)}`, se ejecutaría al dibujar, no al hacer clic.
- `aria-label`: texto para lectores de pantalla (accesibilidad). Los botones `-` y `+` no tienen texto descriptivo, entonces se les agrega.
- `truncate`: si el nombre es largo, lo corta con "…".

### 7.2 `CouponInput.jsx` (CMP-07)

```js
const [code, setCode] = useState("")
function handleSubmit(e) {
    e.preventDefault()                     // evita que el <form> recargue la página
    if (!code.trim() || disabled) return   // no manda vacíos ni mientras hay otra llamada
    onApply(code.trim())
}
```

- Tiene **su propio estado** (`code`) porque lo que se está tipeando sólo le importa a él.
- Usar `<form onSubmit>` permite aplicar el cupón con Enter.
- Dos estados visuales con ternario: **cupón aplicado** (verde, con "Quitar") o **formulario**.
- `aria-invalid` y `aria-describedby="coupon-error"` vinculan el error con el input para accesibilidad.
- La clase `uppercase` sólo cambia cómo **se ve**; el valor real se pasa a mayúsculas en el mock o en `CartPage` con `toUpperCase()`.

### 7.3 `PurchaseSummary.jsx` (CMP-14)

```js
function PriceRow({ label, value, highlight = false }) {
    ... {value < 0 ? "-" : ""}$ {Math.abs(value).toLocaleString("es-AR")}
}
```

- `PriceRow` es un **subcomponente interno** para no repetir el mismo bloque 4 veces.
- El descuento se pasa como número negativo; `Math.abs` lo muestra sin signo y se antepone el `-` a mano, para que quede `-$ 1.500` y no `$ -1.500`.
- `{amounts.discount > 0 && (...)}`: la fila del descuento aparece sólo si hay descuento.
- Se **reutiliza** en Carrito y en Checkout.

### 7.4 `EmptyCart.jsx`

- Estado vacío con un link a `/inicio` ("Explorar comercios"). No recibe props.

---

## 8. Pantalla Checkout (`src/pages/CheckoutPage.jsx`)

### 8.1 Medios de pago de ejemplo

```js
const paymentMethods = [
  { id: "visa-4821",   name: "Visa Débito •••• 4821", type: "debito", ... },
  { id: "master-9012", name: "Mastercard Crédito •••• 9012", type: "credito", badge: "Recomendado", ... },
  { id: "saldo",       name: "Dinero en cuenta DeliveryGo Pagos", type: "saldo", ... },
]
```

- Fuera del componente porque son fijos. El `id` es lo que se manda como `metodoPagoId`. El `type` decide si se muestran cuotas (sólo `credito`).

### 8.2 `PaymentSuccess` *(agregado en la revisión)*

```js
function PaymentSuccess({ order }) {
  return ( ... <CheckoutSteps current={3} /> ... ¡Pago confirmado! ... #{order.id} ... <Link to="/inicio"> ... )
}
```

- Pantalla de confirmación: marca el paso 3 "En preparación", muestra el número de pedido y el total, y ofrece volver al inicio.
- `role="status"` le avisa a los lectores de pantalla que es un mensaje de resultado.

### 8.3 Estados y efecto

```js
const { store, address, cart, coupon, order, itemCount, amounts, clearCart } = useCart()
useEffect(() => { window.scrollTo(0, 0) }, [])
const [selectedMethodId, setSelectedMethodId] = useState(null) // medio elegido
const [installments, setInstallments] = useState(1)            // cuotas
const [loading, setLoading] = useState(false)                  // "Procesando pago..."
const [rejection, setRejection] = useState(null)               // último rechazo { code, message }
const [rejections, setRejections] = useState({})               // { [metodoId]: codigo } todos los rechazados
const [paymentError, setPaymentError] = useState("")           // error técnico (red/servidor)
const [paidOrder, setPaidOrder] = useState(null)               // { id, total } si ya se pagó
```

- Se distingue `rejection` (el **último**, para el banner) de `rejections` (**todos**, para marcar cada medio como "Rechazada" y bloquearlo).

### 8.4 Los `return` tempranos (guardas)

```js
if (paidOrder) return <PaymentSuccess order={paidOrder} />
if (!order) return <Navigate to="/carrito" replace />
```

- **Orden importante:**
  1. Primero se pregunta si ya se pagó, porque después de pagar `clearCart()` deja `order` en `null`. Si el orden fuera al revés, te mandaría al carrito en vez de mostrar la confirmación.
  2. Si alguien entra a `/pagar` escribiendo la URL sin haber creado un pedido, `<Navigate>` lo redirige al carrito. `replace` reemplaza la entrada del historial, para que "Atrás" no lo devuelva a `/pagar`.
- Están **después** de todos los hooks (regla de los hooks, sección 3).

### 8.5 `handleSelectMethod(id)`

```js
setSelectedMethodId(id)
setInstallments(1)
```

- Al cambiar de medio, las cuotas vuelven a 1 (las cuotas de una tarjeta no aplican a otra).

### 8.6 `handlePay()`, paso a paso

```js
setLoading(true); setRejection(null); setPaymentError("")
const pagoRequest = { pedidoId: order.id, metodoPagoId: selectedMethodId, cuotas: installments }   // DTO-06
try {
  if (Object.keys(rejections).length > 0) await reintentarPago(pagoRequest)   // API-10
  else await procesarPago(pagoRequest)                                       // API-05
  setPaidOrder({ id: order.id, total: amounts.total })   // 1) guardar datos ANTES de vaciar
  clearCart()                                            // 2) vaciar carrito
  window.scrollTo(0, 0)
} catch (err) {
  if (err.codigo) {                                      // rechazo del medio (RN-05)
    setRejection({ code: err.codigo, message: err.message })
    setRejections((current) => ({ ...current, [selectedMethodId]: err.codigo }))
    setSelectedMethodId(null)                            // obliga a elegir otro
    window.scrollTo({ top: 0, behavior: "smooth" })      // sube para ver el banner
  } else {
    setPaymentError(err.message)                         // error técnico: puede reintentar igual
  }
} finally {
  setLoading(false)
}
```

- `Object.keys(rejections).length > 0`: "¿hubo algún rechazo antes?". Si sí, se usa el endpoint de **reintento**.
- `{ ...current, [selectedMethodId]: err.codigo }`: las **claves computadas** `[ ]` usan el valor de la variable como nombre de la propiedad. Por ejemplo: `{ "visa-4821": "ERR_INSUFFICIENT_FUNDS_704" }`.
- Se guarda `paidOrder` **antes** de `clearCart()` porque después `order` y `amounts` cambian.

### 8.7 `handleRetry()`

```js
setRejection(null)
setSelectedMethodId(null)
document.getElementById("payment-methods")?.scrollIntoView({ behavior: "smooth" })
```

- Cierra el banner y lleva al usuario a la lista de medios de pago. El `?.` evita un error si el elemento no existiera.

### 8.8 El JSX

- `{rejection && <PaymentRejectedBanner ... />}`: el banner aparece sólo si hubo rechazo.
- Link "Volver al carrito" y `<CheckoutSteps current={2} />`.
- **Izquierda** (`lg:col-span-7`): `<DeliveryAddress>` y `<PaymentMethodSelector>`.
- **Derecha** (`lg:col-span-5`, `sticky`): comercio, lista de ítems (`{item.quantity}x`), `<PurchaseSummary>` y el botón "Confirmar y pagar $ ...", deshabilitado si no hay medio elegido o se está procesando.
- Mensajes condicionales: error técnico (`paymentError`) y la ayuda "Elegí un medio de pago para continuar."

---

## 9. Componentes del checkout (`src/components/checkoutPage/`)

### 9.1 `CheckoutSteps.jsx`

```js
const done = step.id < current     // pasos anteriores: tilde verde
const active = step.id === current // paso actual: círculo relleno
```

- `{index < steps.length - 1 && <span ... />}`: dibuja la línea separadora entre pasos, pero no después del último.
- `hidden sm:inline`: en el celular se ven sólo los números; en pantallas más grandes, también los nombres.

### 9.2 `DeliveryAddress.jsx`

- Componente de presentación: muestra calle, detalle, instrucciones y el tiempo de entrega que recibe por props.

### 9.3 `PaymentMethodSelector.jsx` (CMP-08)

**`rejectionReason(code)`**

```js
return code.includes("INSUFFICIENT_FUNDS") ? "Fondos insuficientes" : "Rechazada por el emisor"
```

- Traduce el código técnico a un texto entendible.

**`PaymentOption`**

```js
const rejected = Boolean(rejectionCode)
<label className={`... ${rejected ? "opacity-60 cursor-not-allowed" : selected ? "ring-2 ..." : "hover:..."}`}>
  <input type="radio" name="payment-method" checked={selected} disabled={rejected}
         onChange={() => onSelect(method.id)} />
```

- `Boolean(...)` convierte el código (o `undefined`) en `true`/`false`.
- Envolver todo en `<label>` hace que clickear en cualquier parte de la tarjeta seleccione el radio.
- Todos los radios comparten `name="payment-method"`: el navegador permite sólo uno marcado.
- `disabled={rejected}` *(revisión)*: un medio rechazado ya no se puede elegir.
- Clases condicionales con ternarios anidados: rechazado → gris; seleccionado → borde verde; normal → hover.

**`PaymentMethodSelector`**

```js
const selectedMethod = methods.find((method) => method.id === selectedId)
{selectedMethod?.type === "credito" && ( <select ...> ... </select> )}
```

- Las cuotas aparecen **sólo** para tarjetas de crédito.
- `onChange={(e) => onInstallmentsChange(Number(e.target.value))}`: el `<select>` siempre devuelve texto; `Number(...)` lo pasa a número.
- `(total / option).toLocaleString("es-AR", { maximumFractionDigits: 2 })`: valor de cada cuota con hasta 2 decimales.
- `id="payment-methods"` y `scroll-mt-24`: destino del scroll de `handleRetry` (con margen para que el Header fijo no lo tape).

### 9.4 `PaymentRejectedBanner.jsx` (CMP-09)

- Banner rojo con `role="alert"` (los lectores de pantalla lo anuncian enseguida), el código de respuesta, el mensaje y el botón "Probar con otro medio de pago", que ejecuta `onRetry`.

---

## 10. Cambios hechos en la revisión

Todos los cambios se hicieron **sólo** en `feature/facundo`. No se modificó ninguna otra branch.

### 10.1 Header: el carrito mostraba datos fijos y no navegaba

**Archivo:** `src/components/Header.jsx`

| Antes | Después |
|---|---|
| `<a href="#">` con "2" y "$8.450" escritos a mano | `<Link to="/carrito">` con `{itemCount}` y `{amounts.total}` del contexto |

```js
import { Link } from "react-router"
import { useCart } from "../context/useCart"
...
const { itemCount, amounts } = useCart()
...
<Link to="/carrito" aria-label={`Ver carrito: ${itemCount} productos`}>
```

**Por qué:** el usuario no tenía cómo llegar al carrito desde el Header, y el número no coincidía con el carrito real.

### 10.2 Notas desactualizadas en el pedido

**Archivos:** `src/context/CartProvider.jsx`, `src/pages/CartPage.jsx`

**Problema:** aplicabas el cupón (eso crea el pedido con las notas de ese momento), después escribías una aclaración y continuabas. `getOrCreateOrder()` reutilizaba el pedido viejo, entonces **las notas nuevas nunca llegaban al backend**.

**Solución:**
- En el provider se reemplazó `setNotes` por `updateNotes`, que invalida el pedido si ya existía.
- En la pantalla, `handleNotesChange` avisa que hay que volver a aplicar el cupón.
- El `<textarea>` se deshabilita mientras hay una llamada en curso.

### 10.3 Se podía volver a pagar con la tarjeta rechazada

**Archivos:** `src/components/checkoutPage/PaymentMethodSelector.jsx`, `src/pages/CheckoutPage.jsx`

**Problema:** después del rechazo, la Visa seguía seleccionada y el botón "Confirmar y pagar" seguía habilitado.

**Solución:**
- En el `catch` de `handlePay`: `setSelectedMethodId(null)`, así el botón se deshabilita.
- En `PaymentOption`: `disabled={rejected}` en el radio y estilo gris con `cursor-not-allowed`.

### 10.4 Al pagar no había confirmación

**Archivo:** `src/pages/CheckoutPage.jsx`

| Antes | Después |
|---|---|
| `setPaid(true); navigate("/inicio"); clearCart()`: te llevaba al inicio sin aviso | `setPaidOrder({ id, total }); clearCart()`: se muestra `<PaymentSuccess>` con el paso 3 activo |

- Se eliminó `useNavigate` (ya no se usa en esta pantalla) y el estado `paid` se reemplazó por `paidOrder`.

### 10.5 Diseño en el celular

**Archivo:** `src/pages/CartPage.jsx`

- `whitespace-nowrap` en el tiempo de entrega: "25-35 min" ya no se parte en tres renglones.
- "Agregar más" muestra sólo el ícono en pantallas chicas (`hidden sm:inline`) y tiene `aria-label`.

### 10.6 Scroll al entrar a la pantalla

**Archivos:** `src/pages/CartPage.jsx`, `src/pages/CheckoutPage.jsx`

- React Router (con `BrowserRouter`) **no** resetea el scroll entre rutas. Se agregó `useEffect(() => window.scrollTo(0, 0), [])` en las dos pantallas, y también al confirmar el pago, para que el Header fijo no tape el título.

### 10.7 Comentario desactualizado

- En `handlePay` el comentario decía "se vuelve al Home"; ahora dice "se muestra la confirmación".

---

## 11. Cómo se verificó

1. **Linter:** `npx eslint .` sin errores ni advertencias.
2. **Compilación:** `npx vite build` sin errores.
3. **Prueba en navegador automatizada** (Playwright + el Chromium instalado en el sistema), con este resultado:

| # | Caso | Resultado |
|---|---|---|
| 1 | Entrar a `/pagar` sin pedido | Redirige a `/carrito` ✅ |
| 2 | Header muestra cantidad y total reales | `2 · $ 12.900` ✅ |
| 3 | Sumar una unidad | 3 ítems, $ 20.700 ✅ |
| 4 | Cupón inexistente | "El cupón no existe o está vencido." ✅ |
| 5 | Cupón `deliverygo20` (en minúsculas) | Aplicado, total $ 19.200 ✅ |
| 6 | Editar notas con el cupón aplicado | Cupón quitado + aviso ✅ |
| 7 | Continuar al pago | Navega a `/pagar` ✅ |
| 8 | Pagar con Visa | Banner de rechazo; botón deshabilitado; Visa bloqueada ✅ |
| 9 | Mastercard en 3 cuotas | "3 cuotas de $ 6.400"; "¡Pago confirmado! Tu pedido #1002…" ✅ |
| 10 | Volver al carrito | Vacío ✅ |
| 11 | Celular (390 px) | Sin scroll horizontal ✅ |
| — | Errores en la consola del navegador | Ninguno ✅ |

---

## 12. Pendientes y recomendaciones

1. **Unir con `main`:** tu branch no tiene el historial de `main` (copia los archivos de Nico a mano), entonces el merge da conflictos en `src/main.jsx`, `src/pages/HomePage.jsx` y `src/pages/NotificationsPage.jsx`. En los tres casos tu versión es la correcta.
2. **Imports con mayúsculas en `main`:** ahí se importa `components/homePage/...` y `components/notificationsPage/...`, pero las carpetas se llaman `HomePage/` y `NotificationsPage/`. En Linux eso **no compila**; en Windows o Mac sí, por eso puede no haberse notado. En tu branch ya está corregido.
3. **`Header.jsx` es compartido:** si otro compañero lo modifica, puede haber un conflicto al unir.
4. **Rutas sin protección:** `/carrito`, `/pagar`, etc. se pueden abrir sin loguearse. A futuro conviene un componente que verifique `obtenerToken()` y redirija a `/login`.
5. **Persistencia:** con F5 se pierde el carrito. Si se quisiera mantener, se podría guardar en `sessionStorage` desde el provider.
6. **Backend:** cuando estén los módulos de Pedidos y Pagos, cambiar `USE_MOCK = false` en `pedidosServicie.js` y `pagosServicie.js`, y acordar el formato de error `{ codigo, mensaje }`.
7. **Commit vacío:** el commit `1598bae` ("2 pantallas mas") no tiene cambios; todo está en `eae0972`.

---

## 13. Glosario de códigos

Los comentarios del código usan códigos de la especificación del TP. El significado de esta tabla está deducido del código y sus comentarios; si la especificación oficial dice otra cosa, vale la especificación:

| Código | Significado en este código |
|---|---|
| **PNT-04** | Pantalla Carrito |
| **CU-03** | Caso de uso: armar y confirmar la compra |
| **RN-01** | No se puede continuar con el carrito vacío / sin medio de pago |
| **RN-02** | Validación de cupón (existencia y monto mínimo) |
| **RN-05** | Manejo del pago rechazado |
| **DM-01** | El carrito es un estado compartido (Context) |
| **DM-03** | Un rechazo no crea un pedido nuevo: se reintenta sobre el mismo |
| **API-04** | `POST /pedidos`: crear pedido |
| **API-05** | `POST /pagos`: procesar pago |
| **API-09** | `POST /pedidos/{id}/cupon`: aplicar cupón |
| **API-10** | `POST /pagos/reintentar`: reintentar pago |
| **DTO-04** | `CrearPedidoRequest` (lo que se manda para crear el pedido) |
| **DTO-05** | `PedidoResponse` (el pedido que devuelve el backend) |
| **DTO-06** | `PagoRequest` (`pedidoId`, `metodoPagoId`, `cuotas`) |
| **DTO-08** | `AplicarCuponRequest` |
| **NAV-03** | Navegar al carrito |
| **NAV-04** | Navegar del carrito a pagar |
| **NAV-05** | "Probar con otro medio de pago" |
| **NAV-06** | Qué pasa después de pagar |
| **CMP-07 / 08 / 09 / 13 / 14** | Componentes: Cupón / Selector de pago / Banner de rechazo / Ítem del carrito / Resumen |
