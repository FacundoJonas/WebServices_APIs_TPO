# DeliveryGo

Frontend de **DeliveryGo**, una plataforma de pedidos de comida a domicilio para CABA y GBA.
Trabajo Práctico Obligatorio de la materia **Aplicaciones Interactivas / Web Services** (UADE).

---

## Tecnologías

- **React 19** + **Vite**
- **React Router 7** para la navegación
- **Tailwind CSS 4** para los estilos
- Backend: **Spring Boot** (API REST con JWT)

---

## Cómo levantar el proyecto

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Conexión con el backend

La URL del backend se configura con la variable de entorno `VITE_API_URL`.
Si no está definida, se usa `http://localhost:8089`.

Para cambiarla, creá un archivo `.env` en la raíz:

```
VITE_API_URL=http://localhost:8089
```

### Mocks

Mientras el backend no esté disponible, cada servicio de `src/servicies/` tiene un modo mock:

```js
// Cambiar a false cuando quieras utilizar Spring Boot
const USE_MOCK = true;
```

Los datos de prueba están en `src/servicies/mocks/`.

---

## Usuarios de prueba (mock)

| Email | Contraseña | Rol |
|---|---|---|
| `cliente@gmail.com` | `1234` | CLIENTE |
| `local@gmail.com` | `1234` | LOCAL |
| `admin@gmail.com` | `1234` | ADMIN |

---

## Estructura del proyecto

```
src/
├── assets/        → imágenes y logos
├── components/    → componentes visuales, agrupados por pantalla
├── context/       → estado global (carrito)
├── layouts/       → estructura de las páginas (Header, Footer)
├── pages/         → una página por ruta
├── routes/        → control de acceso a las rutas
└── servicies/     → llamadas a la API y sus mocks
```

---

## Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | Login y registro | Solo sin sesión |
| `/inicio` | Home | Requiere sesión |
| `/comercio` | Comercio y productos | Requiere sesión |
| `/carrito` | Carrito | Requiere sesión |
| `/pagar` | Checkout | Requiere sesión |
| `/pedido` | Calificación del pedido | Requiere sesión |
| `/notificaciones` | Notificaciones | Requiere sesión |

---

## Autenticación

### Login

`login()` (en `src/servicies/authServicie.js`):

1. Envía email y contraseña a `POST /v1/auth` y recibe el **token JWT**.
2. Con ese token pide los datos del usuario a la API de usuarios.
3. Guarda el token y los datos del usuario en `sessionStorage`.

Si cualquiera de los dos pasos falla, se limpia la sesión y se muestra el error en el formulario.

### Protección de rutas

En `src/routes/` hay dos componentes que envuelven las rutas en `main.jsx`:

- **`ProtectedRoute`**: si no hay token, redirige a `/login`. Guarda la URL que se quería visitar para volver a ella después del login.
- **`PublicRoute`**: si ya hay sesión, redirige a `/inicio` (un usuario logueado no vuelve a ver el login).

Los dos leen el token con `obtenerToken()`. Como `sessionStorage` es sincrónico, la decisión se toma durante el render, sin `useEffect`, y la página protegida nunca llega a mostrarse sin sesión.

### Logout

El botón del `Header`:

1. Llama a `logout()`, que borra el token y el usuario de `sessionStorage`.
2. Vacía el carrito.
3. Redirige a `/login`.

### Funciones disponibles en `authServicie.js`

| Función | Qué hace |
|---|---|
| `login(username, password)` | Inicia sesión y guarda los datos en `sessionStorage` |
| `obtenerToken()` | Devuelve el token, o `null` si no hay sesión |
| `obtenerUsuario()` | Devuelve los datos del usuario logueado |
| `logout()` | Cierra la sesión |

### Consideraciones

- La sesión dura mientras la pestaña esté abierta (`sessionStorage`). Recargar la página no la cierra, pero abrir otra pestaña pide login de nuevo.
- La protección de rutas es del lado del frontend. La seguridad real la da el backend, que valida el JWT en cada request.
- Los datos del usuario se guardan al momento del login. Si se editan después, hay que actualizar `sessionStorage`.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm run build` | Genera la versión de producción |
| `npm run preview` | Sirve la versión de producción localmente |
| `npm run lint` | Revisa el código con ESLint |

---

## Documentación adicional

- [Carrito y Checkout](docs/carrito-y-checkout.md)