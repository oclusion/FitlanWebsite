# Fitlán Academy — Website

Sitio web de Fitlán: landing pública + área de usuario logueado (feed de entrenamientos, detalle, steps con video, perfil de coach, cuenta). React + Vite (SPA), a diferencia de la app móvil (`rn-starter`, React Native/Expo) que solo permite login — acá **sí se puede registrar una cuenta nueva**.

Basado en las maquetas de `../maquetas` (HTML/PHP + Bootstrap) y en los mismos servicios/endpoints que ya usa la app móvil (`../src/services/*.js`) — mismo backend, mismo contrato de API, solo cambia el storage del token (`localStorage` acá, `expo-secure-store` en la app) y el routing (`react-router-dom` acá, React Navigation en la app).

## Comandos

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción a dist/
npm run preview   # sirve el build de dist/ localmente
```

Copiar `.env.example` a `.env` para configurar `VITE_API_BASE_URL` (ya apunta al backend de producción por default).

## Estructura

- `src/services/` — capa de API, casi 1:1 con `../src/services/` de la app móvil (mismos endpoints). `api.js` es el único que cambia de verdad (token en `localStorage`, no en SecureStore).
- `src/context/AuthContext.jsx` + `src/components/ProtectedRoute.jsx` — sesión y rutas protegidas.
- `src/pages/` — una página por ruta. `Landing`, `Login`, `Register`, `VerifyEmail`, `ForgotPassword`, `ResetPassword` son públicas; el resto requiere sesión.
- `src/assets/css/styles.css` — CSS de la maqueta original (`maquetas/assets/css/styles.css`), copiado tal cual. `src/assets/css/app-extra.css` tiene los estilos de las pantallas que no estaban en la maqueta (login, registro, ajustes, mis entrenamientos, planes, FAQs).

## Pendiente / conocido

- **No hay flujo de pago/checkout real** — el backend todavía no expone un endpoint de suscripción con pago (solo `GET /subscriptions/plans` y `/subscriptions/me`, de lectura). La página de Planes y el botón "Solicitar entrenamiento personalizado" son honestos al respecto: llevan a contactar por email, no simulan un pago que no existe.
- **`/restablecer-password`** es el primer frontend real de `POST /auth/reset-password` — el README del backend marcaba esa página como "pendiente de implementar".
- Los SVG de fondo de la landing (`fitlan-color.svg`, `back-landing-fitlan.svg`, `mobile-back-landing-fitlan.svg`) pesan varios MB cada uno — valdría la pena pedirle al diseñador una versión optimizada, no es algo que se arregle desde el código.
