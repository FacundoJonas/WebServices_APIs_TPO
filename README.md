# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Prueba de integración entre VMs (Proxmox)

Esta branch (`feature/prueba-integracion-proxmox`) agrega la carpeta [`prueba-integracion/`](prueba-integracion/README.md): dos servicios Java Spring Boot (emisor = Pedidos, receptor = Notificaciones) para probar la comunicación REST entre las máquinas virtuales Debian del Proxmox, con scripts de instalación y diagnóstico. Ver [`prueba-integracion/README.md`](prueba-integracion/README.md).
