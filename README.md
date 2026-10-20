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

| Email | Contraseña | Rol | Nombre que se muestra |
|---|---|---|---|
| `cliente@gmail.com` | `1234` | CLIENTE | Lucas (con dirección en Balvanera) |
| `local@gmail.com` | `1234` | LOCAL | La Birra Bar |
| `admin@gmail.com` | `1234` | ADMIN | Administrador |

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

### Endpoints utilizados

| Método | Endpoint | Servicio | Uso |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `authServicie.js` → `login()` | Inicia sesión. Devuelve `{ token, id, rol }` |
| `GET` | `/api/v1/users/{id}` | `userServicie.js` → `obtenerUsuarioPorId()` | Devuelve nombre, apellido, email y direcciones |

`GET /api/v1/users/{id}` envía el token en el header `Authorization: Bearer <token>`.

### Login

`login()` (en `src/servicies/authServicie.js`):

```
LoginForm → login()
              ├─ POST /api/v1/auth/login   → { token, id, rol }
              ├─ GET  /api/v1/users/{id}   → { nombre, apellido, email, direcciones }
              └─ guarda todo en sessionStorage
           → navigate a /inicio (o a la URL que se quería visitar)
```

1. Envía email y contraseña a `POST /api/v1/auth/login` y recibe el **token JWT** y el **id** del usuario.
2. Guarda el token (el siguiente request lo necesita).
3. Con el id pide los datos del usuario a `GET /api/v1/users/{id}`.
4. Guarda los datos del usuario en `sessionStorage`.

Si el segundo paso falla, se llama a `logout()` para no dejar una sesión a medias (token sin usuario) y se muestra el error en el formulario.

Mientras se hacen las dos llamadas, el botón muestra "Ingresando...". Recién cuando terminan se navega a la app.

### Datos del usuario en sesión

Después del login, `sessionStorage` tiene:

| Clave | Contenido |
|---|---|
| `token` | JWT devuelto por el login |
| `usuario` | `{ id, nombre, apellido, email, rol, direcciones }` |

Estos datos se leen con `obtenerUsuario()` y se usan en:

- **`Header`**: nombre del usuario y calle de su primera dirección.
- **`HomePage`** (posición global): saludo "¡Hola {nombre}!", dirección de entrega y barrio.

Como los datos ya están guardados antes de entrar a la app y `sessionStorage` es sincrónico, estos componentes no necesitan `useEffect` ni `useState` para mostrarlos.

> Si el backend devuelve los campos con otros nombres (por ejemplo `firstName` o `addresses`), alcanza con ajustar el objeto que se guarda en `sessionStorage` dentro de `login()`. El resto del front no cambia.

### Protección de rutas

En `src/routes/` hay dos componentes que envuelven las rutas en `main.jsx`:

- **`ProtectedRoute`**: si no hay token, redirige a `/login`. Guarda la URL que se quería visitar para volver a ella después del login.
- **`PublicRoute`**: si ya hay sesión, redirige a `/inicio` (un usuario logueado no vuelve a ver el login).

Los dos leen el token con `obtenerToken()`. Como `sessionStorage` es sincrónico, la decisión se toma durante el render, sin `useEffect`, y la página protegida nunca llega a mostrarse sin sesión.

### Logout

El botón del `Header`:

1. Llama a `logout()`, que borra el token y el usuario de `sessionStorage`.
2. Redirige a `/login` con `replace`, así el botón "atrás" no vuelve a la página protegida.

### Funciones disponibles

**`authServicie.js`**

| Función | Qué hace |
|---|---|
| `login(username, password)` | Inicia sesión, pide los datos del usuario y guarda todo en `sessionStorage` |
| `obtenerToken()` | Devuelve el token, o `null` si no hay sesión |
| `obtenerUsuario()` | Devuelve los datos del usuario logueado |
| `logout()` | Cierra la sesión |

**`userServicie.js`**

| Función | Qué hace |
|---|---|
| `obtenerUsuarioPorId(id)` | `GET /api/v1/users/{id}`. Devuelve los datos del usuario |

Los mocks están en `mocks/authMock.js` (login) y `mocks/usersMock.js` (datos de usuario).

### Consideraciones

- La sesión dura mientras la pestaña esté abierta (`sessionStorage`). Recargar la página no la cierra, pero abrir otra pestaña pide login de nuevo.
- La protección de rutas es del lado del frontend. La seguridad real la da el backend, que valida el JWT en cada request.
- Los datos del usuario se guardan al momento del login. Si se editan después, hay que actualizar `sessionStorage`.
- Si el login real no devuelve el `id`, se puede leer desde el payload del JWT (la consigna pide que el token identifique al usuario y sus roles).

### Pendientes del módulo Usuarios

- `POST /api/v1/auth/register`: conectar el formulario de registro.
- `PUT /api/v1/users/{id}`: modificar perfil.
- `POST /api/v1/users/{id}/addresses`: administrar direcciones.
- Vaciar el carrito al cerrar sesión (hoy el carrito sobrevive al logout).

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

---

## Prueba de integración entre VMs (Proxmox)

Esta branch (`feature/prueba-integracion-proxmox`) agrega la carpeta [`prueba-integracion/`](prueba-integracion/README.md): dos servicios Java Spring Boot (emisor = Pedidos, receptor = Notificaciones) para probar la comunicación REST entre las máquinas virtuales Debian del Proxmox, con scripts de instalación y diagnóstico. Ver [`prueba-integracion/README.md`](prueba-integracion/README.md).
