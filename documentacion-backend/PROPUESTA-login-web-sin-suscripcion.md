# Propuesta backend: login web sin suscripción

**Estado:** ✅ IMPLEMENTADO en el backend (ver `README.md` sección "Login" → "Header de cliente" y nota "Excepción para el website"). Frontend web ya conectado. Este documento queda como registro de la decisión.

---

## Contexto

- El **registro de cuentas** y la **gestión/compra de suscripción** son exclusivos de la **web**. La app móvil es solo-login (no registra ni gestiona planes).
- Hoy `POST /auth/login` rechaza con `401` — mensaje `"No tienes una suscripción activa. Renueva tu plan en el sitio web."` — a **todo** usuario cuya suscripción más reciente no otorgue acceso, **sin devolver `access_token`**.
  - Estados que bloquean el login: sin ninguna suscripción, `UNPAID`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, y `CANCELED`/`EXPIRED` vencidas.
  - (`documentacion-backend/README.md`, tabla de errores de `/auth/login` y nota "Verificación de suscripción".)

### Problema

Un usuario que se registró en la web pero **todavía no adquirió un plan** no puede entrar a la web para adquirirlo. Queda en un callejón sin salida: el único lugar donde puede comprar la suscripción es justamente el que no lo deja pasar.

---

## Cambio pedido

Permitir que el **login desde la web** tenga éxito (devuelva `access_token`) aunque el usuario no tenga suscripción con acceso.

La web **ya restringe el contenido por su cuenta**: sin suscripción activa, redirige a `/planes`. Ver sección "Lado web" abajo.

**La app móvil debe mantener el comportamiento actual** (bloquear el login sin suscripción), porque desde la app no se puede adquirir plan.

---

## Implementación propuesta

El cliente web ya envía este header en **todos** los requests (incluido `/auth/login`):

```
X-Fitlan-Client: web
```

`POST /auth/login` se comporta según el header:

| Validación | Cliente `web` | Cliente `mobile` / header ausente |
|---|---|---|
| Credenciales incorrectas | `401` | `401` |
| Cuenta no verificada (`active = false`) | `401` | `401` |
| Cuenta suspendida | `401` | `401` |
| Límite de sesiones | igual que hoy | igual que hoy |
| **Sin suscripción con acceso** | **`200` + `access_token`** ← nuevo | `401` ← igual que hoy |

- Si el header **no viene**, se asume `mobile` — comportamiento conservador, no rompe la app actual ni ningún cliente existente.
- El `access_token` emitido es **idéntico** en ambos casos (mismos claims, misma expiración). Lo único que cambia es si se emite o no cuando falta la suscripción.
- `/auth/facebook` **no necesita cambios** (es solo móvil).

### Alternativa (si no quieren usar headers)

Un campo en el body: `{ "client": "web" | "mobile" }`. Mismo comportamiento.

---

## Lado web (ya implementado)

- `src/services/api.js` envía `X-Fitlan-Client: web` en todos los requests.
- `AuthContext` consulta `GET /subscriptions/me` una vez tras el login y expone `hasSubscription`.
- `SubscriptionRoute` protege las rutas de contenido (`/entrenamientos`, `/entrenamiento/*`, `/entrenador/:id`, `/mis-entrenamientos`): si no hay suscripción con acceso → `Navigate` a `/planes`.
- `/cuenta`, `/configuracion`, `/planes` quedan accesibles solo con sesión (sin exigir suscripción).
- `GET /subscriptions/me` puede seguir devolviendo `404` cuando no hay suscripción con acceso — el frontend ya lo trata como "sin acceso", no como error.

Flujo esperado tras el cambio:

1. Usuario sin suscripción hace login en la web → `200` + token.
2. La web lo deja entrar, `hasSubscription = false`.
3. Al intentar ver contenido → redirige a `/planes` para adquirir un plan.

---

## Casos borde a confirmar

1. **Suscripción vencida** (`EXPIRED` / `CANCELED` con `current_period_end` en el pasado) + login web → debería dar `200` + token, contenido bloqueado hasta renovar. ✔️ deseado.
2. **Suscripción que vence durante la sesión web** (token todavía vivo): ¿los endpoints de contenido responden `403` / `401` en ese caso? Confirmar el código y el mensaje para que la web pueda detectar el corte y redirigir a `/planes`.
3. **`ROLE_ADMIN` sin suscripción**: hoy ya está exento de la verificación en el login. Sin cambios.
4. **Rate limiting / auditoría de logins**: si hay métricas que cuentan "logins bloqueados por suscripción", ahora esos serán logins exitosos desde web — ajustar dashboards si aplica.
