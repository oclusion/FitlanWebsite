# Fitlan API

API REST para gestión de entrenamientos, sesiones, pasos, categorías, coaches y usuarios.

**Base URL:** `http://localhost:8080/api/v1`

**Autenticación:** JWT — incluir en el header de cada request protegido:
```
Authorization: Bearer <token>
```

---

## Roles

| Rol | Acceso |
|---|---|
| `ROLE_ADMIN` | Lectura y escritura completa, gestión de usuarios y roles |
| `ROLE_COACH` | Siempre se asigna junto a `ROLE_USER` — tiene todos los permisos de usuario más perfil público con imagen y banner, asociable a trainings |
| `ROLE_USER` | Lectura de contenido, inscripciones y progreso |

---

## Auth

### Login
```
POST /auth/login
```
**Body:**
```json
{
  "identifier": "admin",
  "password": "admin1234"
}
```
> `identifier` acepta tanto el **username** como el **email** del usuario.

**Response `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "user_id": 2,
  "username": "coach1",
  "roles": ["ROLE_USER", "ROLE_COACH"]
}
```

**Header de cliente (distingue app móvil de website):**

| Header | Valor | Quién lo envía |
|---|---|---|
| `X-Fitlan-Client` | `web` | Website — permite login sin suscripción |
| `X-Fitlan-Client` | `mobile` / ausente | App móvil — comportamiento actual |

**Errores posibles:**

| Código | Mensaje | Causa |
|---|---|---|
| `401` | `"Credenciales incorrectas."` | Usuario o contraseña inválidos |
| `401` | `"Cuenta no verificada. Revisa tu email."` | El usuario existe pero no verificó su email |
| `401` | `"La cuenta está suspendida."` | El usuario fue suspendido por un admin |
| `401` | `"No tienes una suscripción activa. Renueva tu plan en el sitio web."` | Usuario sin suscripción — **solo cuando el cliente es móvil** |
| `401` | `"La sesión ha expirado. Por favor inicia sesión nuevamente."` | Token expirado |
| `401` | `"El token es inválido."` | Token malformado o con firma incorrecta |
| `401` | `"No autorizado. Se requiere autenticación."` | Request sin token |
| `401` | `"No autorizado. Se requiere autenticación."` | Token válido pero sesión cerrada o desplazada |

> **Verificación de suscripción:** en cada login se evalúa la suscripción **más reciente** del usuario. Tiene acceso si su estado es `ACTIVE`, `TRIALING`, `PAST_DUE`, o `CANCELED` con `current_period_end` en el futuro. `UNPAID`, `INCOMPLETE` e `INCOMPLETE_EXPIRED` bloquean el login con `401`. Sin ninguna suscripción → `401`. Los usuarios con `ROLE_ADMIN` no están sujetos a esta verificación.
>
> **Excepción para el website:** si el request incluye `X-Fitlan-Client: web`, el check de suscripción se omite y se emite el token igualmente. El website luego llama a `GET /subscriptions/me` para verificar el estado y redirigir al usuario a la pantalla de planes si no tiene suscripción activa.

> **Límite de sesiones:** cada usuario puede tener hasta **2 sesiones activas** simultáneamente (configurable con `app.auth.max-sessions`). Al hacer login en un 3° dispositivo, la sesión más antigua se elimina automáticamente y el token de ese dispositivo queda inválido en el próximo request.

---

### Login con Facebook
```
POST /auth/facebook
```
**Body:**
```json
{ "access_token": "<token que devuelve el SDK de Facebook en el dispositivo>" }
```

**Response `200`** (mismo shape que `/auth/login`):
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "user_id": 2,
  "username": "juanito",
  "roles": ["ROLE_USER"]
}
```

**Flujo interno:**
1. Valida el token contra `https://graph.facebook.com/me?fields=id,name,email`
2. Si el FB ID ya está vinculado a una cuenta → login directo
3. Si no está vinculado pero el email de Facebook coincide con una cuenta `active` → vincula el FB ID y loguea
4. Si no existe cuenta con ese email → `401`

> La creación de cuentas no está disponible desde la app. Solo usuarios que se registraron en el sitio web y adquirieron suscripción pueden ingresar.

**Errores posibles:**

| Código | Mensaje | Causa |
|---|---|---|
| `400` | `"access_token es requerido."` | Body vacío o sin el campo |
| `401` | `"Token de Facebook inválido o expirado."` | El SDK envió un token malo |
| `401` | `"No tienes una cuenta activa. Regístrate en el sitio web..."` | Email de Facebook no registrado en el sistema |
| `401` | `"Tu cuenta no está activa. Contacta al soporte."` | Cuenta existe pero `active=false` |
| `401` | `"No tienes una suscripción activa. Renueva tu plan en el sitio web."` | Cuenta activa pero sin suscripción vigente — **solo cliente móvil** |
| `401` | `"Facebook no pudo compartir tu email..."` | Usuario no concedió permiso de email en Facebook |

> **Nota:** el sistema soporta la tabla `user_social_accounts` preparada para Google y Apple (`provider`: `FACEBOOK` \| `GOOGLE` \| `APPLE`).

**Requisitos del lado de la app (Facebook Developers):**
1. Crear una app en [developers.facebook.com](https://developers.facebook.com) con el producto **Facebook Login**
2. Agregar las plataformas iOS y/o Android con el bundle ID / package name de la app
3. Solicitar los permisos `public_profile` y **`email`** — sin `email` el backend devuelve `401`
4. El SDK devuelve un `access_token` que se envía directamente a este endpoint

> El backend no necesita ninguna API key ni secret de Facebook — valida el token llamando a la Graph API pública con el token del propio usuario.

> **Modo desarrollo de Facebook:** mientras la app esté en modo desarrollo en `developers.facebook.com`, **solo los usuarios añadidos como Testers o Developers** en el panel de la app pueden autenticarse. Intentar con cualquier otro usuario devolverá error 190 `"Cannot parse access token"`. Para habilitar el acceso general, la app debe pasar la revisión de Facebook y publicarse.

---

### Login con Apple
```
POST /auth/apple
```
**Body:**
```json
{
  "identity_token": "<JWT que devuelve el SDK de Apple en el dispositivo>",
  "full_name": "Ricardo García Rodríguez"
}
```
> `full_name` es opcional — Apple solo lo comparte la primera vez que el usuario autoriza la app. En logins siguientes no viene; se puede omitir o enviar `null`.

**Response `200`** (mismo shape que `/auth/login`):
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "user_id": 2,
  "username": "juanito",
  "roles": ["ROLE_USER"]
}
```

**Flujo interno:**
1. Decodifica el header del JWT para obtener el `kid`
2. Descarga las claves públicas de Apple desde `https://appleid.apple.com/auth/keys` (JWKS, RS256) — se cachean 1 hora
3. Verifica la firma, `iss == "https://appleid.apple.com"`, `aud == "com.oclusion.fitlan"` y que no esté expirado
4. Extrae `sub` (identificador estable de Apple) y `email` del payload
5. Busca en `user_social_accounts` un registro `provider=APPLE` con ese `sub`:
   - Si existe → login directo
   - Si no existe y el JWT trae `email` → busca cuenta `active` con ese email → si coincide, vincula el `sub` y loguea
   - Si no existe y el JWT **no** trae `email` (ya se agotó la única vez que Apple lo comparte y nunca se vinculó) → `401`
   - Si el email no coincide con ninguna cuenta activa → `401`

> La creación de cuentas no está disponible desde la app. Solo usuarios registrados en el sitio web con suscripción activa pueden ingresar.

**Errores posibles:**

| Código | Mensaje | Causa |
|---|---|---|
| `400` | `"identity_token es requerido."` | Body sin el campo |
| `401` | `"Token de Apple inválido."` | `iss` o `aud` del JWT no coinciden con los valores esperados (`https://appleid.apple.com` / `com.oclusion.fitlan`) |
| `401` | `"Token de Apple inválido o expirado."` | Firma RS256 inválida, JWT vencido, o `kid` no encontrado en las JWKS de Apple |
| `401` | `"Token de Apple malformado."` | JWT con estructura incorrecta (no tiene los tres segmentos base64url) |
| `401` | `"No pudimos identificar tu cuenta de Apple. Inicia sesión..."` | Apple no incluyó `email` en el JWT y no hay vínculo `sub` previo |
| `401` | `"No tienes una cuenta activa. Regístrate en el sitio web..."` | Email de Apple no registrado en el sistema |
| `401` | `"Tu cuenta no está activa. Contacta al soporte."` | Cuenta existe pero `active=false` |
| `401` | `"No tienes una suscripción activa. Renueva tu plan en el sitio web."` | Cuenta activa pero sin suscripción vigente — **solo cliente móvil** |

**Requisitos del lado de la app:**
1. Agregar la capability **Sign In with Apple** en el target de Xcode
2. El `aud` que valida el backend es `com.oclusion.fitlan` — debe coincidir con el bundle ID configurado en Apple Developer
3. Solicitar siempre el scope `email` para que el JWT lo incluya en el primer login
4. El SDK devuelve `identityToken` (Data / String) — enviarlo directamente a este endpoint

> El backend no necesita ninguna API key, secret ni credencial de Apple — valida el JWT descargando las claves públicas de Apple desde su endpoint JWKS.

---

### Logout
```
POST /auth/logout
Authorization: Bearer <token>
```
**Response `200`:**
```json
{ "message": "Sesión cerrada correctamente." }
```
Invalida la sesión del token enviado. El token deja de ser aceptado de inmediato aunque criptográficamente siga siendo válido. Si no se envía token, la respuesta es `200` igualmente (no-op).

---

### Registro
```
POST /auth/register
```
**Body:**
```json
{
  "username": "juanito",
  "password": "12345678",
  "email": "juanito@mail.com",
  "name": "Juan"
}
```
> El rol asignado siempre es `ROLE_USER`. No es posible registrarse con `ROLE_ADMIN` ni `ROLE_COACH`.

**Response `201`:**
```json
{ "message": "Registro exitoso. Revisa tu email para activar tu cuenta." }
```

> La cuenta queda con `active = false` hasta que el usuario verifique su email. No se puede hacer login hasta verificar. Si el email ya existe pero la cuenta no está activa, se actualizan los datos y se reenvía el email de verificación.

---

### Verificar email
```
GET /auth/verify-email?token=<uuid>
```

El usuario recibe este link por email tras registrarse. Al hacer clic activa su cuenta y es redirigido al frontend.

**Response `302 Redirect`:**
```
Location: {APP_FRONTEND_URL}/login?verified=true
```

Si el token es inválido, ya fue usado o expiró:
```
Location: {APP_FRONTEND_URL}/login?verified=error
```

> El frontend debe leer el query param `verified` en `/login`:
> - `true` → mostrar mensaje de cuenta activada
> - `error` → mostrar mensaje de enlace inválido o expirado

---

### Recuperar contraseña
```
POST /auth/forgot-password
```
**Body:**
```json
{ "email": "juanito@mail.com" }
```

> Siempre responde `200` aunque el email no exista — para no revelar qué emails están registrados. Si el email existe, se envía un link válido por 1 hora. El envío es **asíncrono** — la respuesta HTTP no espera a que el correo salga.

**Response `200`:**
```json
{ "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña." }
```

---

### Restablecer contraseña
El link del email lleva al usuario a `{APP_FRONTEND_URL}/reset-password?token=<uuid>`. Esa página muestra un formulario y llama a este endpoint con el token y la nueva contraseña.

```
POST /auth/reset-password
```
**Body:**
```json
{
  "token": "<uuid del email>",
  "new_password": "nuevapass123"
}
```

**Response `200`:**
```json
{ "message": "Contraseña restablecida correctamente." }
```

| Código | Causa |
|---|---|
| `404` | Token inválido, ya usado o expirado |
| `400` | `new_password` menor a 8 caracteres |

---

## Archivos (S3)

Los archivos (imágenes y videos) se almacenan en un bucket privado de AWS S3. El acceso se hace exclusivamente mediante **URLs presignadas** con expiración de 7 días, generadas en el momento de cada request. La base de datos nunca guarda la URL firmada — solo el key (`uploads/uuid.ext`).

**Flujo para subir y usar un archivo:**
1. `POST /files/upload` → sube el archivo y recibe `{ key, url }`
2. Guardar el `key` al crear/editar el recurso (training, session, step, user, etc.)
3. El backend genera y devuelve la URL firmada automáticamente en cada GET

| Método | Endpoint | Rol requerido |
|---|---|---|
| POST | `/files/upload` | USER, ADMIN |
| GET | `/files/url?key=...` | USER, ADMIN |

### Subir archivo

```
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form field:** `file` — imagen o video

**Response `200`:**
```json
{
  "key": "uploads/7fb48222-bebb-453d-bb6a-556fe2eb7e67.jpg",
  "url": "https://fitlan.s3.us-east-1.amazonaws.com/uploads/7fb48222-...jpg?X-Amz-Expires=604800&..."
}
```

> `key` es el identificador permanente — enviarlo en el campo `image_url` / `video_url` / `profile_image_url` al crear/actualizar el recurso.
> `url` es la URL firmada lista para mostrar (válida 7 días).

---

### Obtener URL firmada de un key existente

Útil cuando la app necesita refrescar una URL vencida sin volver a subir el archivo.

```
GET /files/url?key=uploads/7fb48222-bebb-453d-bb6a-556fe2eb7e67.jpg
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "url": "https://fitlan.s3.us-east-1.amazonaws.com/uploads/7fb48222-...jpg?X-Amz-Expires=604800&..."
}
```

---

### Campos `*_key` y `*_url` en respuestas

Cada recurso que tenga imagen o video devuelve dos campos:
- `*_url` — URL firmada lista para usar directamente (válida 7 días)
- `*_key` — key crudo del archivo en S3 (ej. `uploads/uuid.jpg`)

El `*_key` es el valor que debes reenviar al backend al editar el recurso — **no** la URL firmada.

| Campo URL | Campo key |
|---|---|
| `profile_image_url` | `profile_image_key` |
| `banner_image_url` | `banner_image_key` |
| `image_url` | `image_key` |
| `video_url` | `video_key` |

---

### Seguridad

- El bucket S3 es **privado** — ningún archivo es accesible sin URL firmada.
- Las URLs firmadas expiran a los **7 días** (máximo permitido con credenciales IAM).
- Las URLs se generan al vuelo en cada request; la BD solo almacena el key.
- URLs de recursos externos (YouTube, etc.) se almacenan y devuelven tal cual — el backend detecta que no son keys de S3 y no las intenta firmar.

---

## Usuarios

| Método | Endpoint | Rol requerido |
|---|---|---|
| POST | `/users` | ADMIN |
| GET | `/users` | ADMIN |
| GET | `/users/coaches` | USER, ADMIN |
| GET | `/users/coaches/{id}` | USER, ADMIN |
| POST | `/users/coaches/{id}/follow` | USER, ADMIN |
| DELETE | `/users/coaches/{id}/follow` | USER, ADMIN |
| GET | `/users/me` | USER, ADMIN |
| PUT | `/users/me` | USER, ADMIN |
| PUT | `/users/{id}` | ADMIN |
| PUT | `/users/{id}/suspend` | ADMIN |
| PUT | `/users/{id}/activate` | ADMIN |

### Crear usuario (admin)
El admin puede crear usuarios directamente asignando el rol deseado. A diferencia del registro público, permite asignar `ROLE_COACH`.

```
POST /users
Authorization: Bearer <token de admin>
```
**Body:**
```json
{
  "username": "coach2",
  "password": "coach1234",
  "email": "coach2@mail.com",
  "name": "Coach Dos",
  "profile_image_url": "https://...",
  "instagram_url": "https://instagram.com/coach2",
  "facebook_url": "https://facebook.com/coach2",
  "tiktok_url": "https://tiktok.com/@coach2",
  "roles": ["ROLE_USER", "ROLE_COACH"]
}
```
> `roles`, `profile_image_url`, `instagram_url`, `facebook_url` y `tiktok_url` son opcionales. Si `roles` se omite se asigna `ROLE_USER`. No se puede asignar `ROLE_ADMIN`.

**Response `201`:** objeto del usuario creado.

---

### Suspender usuario (admin)
Bloquea el acceso de un usuario. Cualquier token JWT existente queda rechazado inmediatamente con `401`. No se puede suspender a un administrador.

```
PUT /users/5/suspend
Authorization: Bearer <token de admin>
```

**Response `200`:** el objeto del usuario con `active: false`.

> Para reactivar: `PUT /users/5/activate` — el usuario vuelve a poder autenticarse.

---

### Listar todos los usuarios (admin)
Devuelve todos los usuarios registrados en el sistema, independientemente de su rol.

```
GET /users
Authorization: Bearer <token de admin>
```

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Administrador",
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["ROLE_ADMIN"],
    "active": true
  },
  {
    "id": 2,
    "name": "Coach Uno",
    "username": "coach1",
    "email": "coach1@mail.com",
    "roles": ["ROLE_USER", "ROLE_COACH"],
    "active": true
  }
]
```

---

### Listar todos los coaches
Devuelve todos los usuarios con `ROLE_COACH` junto con sus trainings asociados.

```
GET /users/coaches
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": 5,
    "name": "Juan Pérez",
    "description": "Entrenador especializado en yoga.",
    "profile_image_url": "https://...",
    "profile_image_key": "uploads/abc123-avatar.jpg",
    "banner_image_url": "https://...",
    "banner_image_key": "uploads/def456-banner.jpg",
    "instagram_url": "https://instagram.com/juanperez",
    "facebook_url": "https://facebook.com/juanperez",
    "tiktok_url": "https://tiktok.com/@juanperez",
    "is_following": true,
    "trainings": [
      {
        "id": 1,
        "title": "Yoga Vinyasa Nivel 1"
      }
    ]
  }
]
```

> `is_following` indica si el usuario autenticado ya sigue a ese coach.

---

### Obtener perfil de un coach
Devuelve el perfil completo de un coach con sus trainings. Si el `id` no corresponde a un usuario con `ROLE_COACH` devuelve `404`.

```
GET /users/coaches/5
Authorization: Bearer <token>
```

**Response `200`:** misma estructura que el listado pero para un solo coach, incluyendo `is_following`.

---

### Seguir un coach
```
POST /users/coaches/5/follow
Authorization: Bearer <token>
```
**Response `200`:** sin body.

> Si el usuario ya sigue al coach, la operación no tiene efecto. Si el `id` no corresponde a un usuario con `ROLE_COACH` devuelve `404`.
> Tras hacer follow, `GET /users/coaches`, `GET /users/coaches/{id}`, `GET /training`, `GET /training/{id}` y `GET /enrollments/me/recent` devolverán `is_following: true` para ese entrenador.

---

### Dejar de seguir un coach
```
DELETE /users/coaches/5/follow
Authorization: Bearer <token>
```
**Response `204`:** sin body.

> Si el usuario no seguía al coach, la operación no tiene efecto.
> Tras hacer unfollow, todos los endpoints anteriores devolverán `is_following: false` para ese coach.

---

### Obtener perfil propio

```
GET /users/me
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": 2,
  "name": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@mail.com",
  "description": "Entrenador especializado en yoga.",
  "profile_image_url": "https://...",
  "banner_image_url": "https://...",
  "instagram_url": "https://instagram.com/juanperez",
  "facebook_url": "https://facebook.com/juanperez",
  "tiktok_url": "https://tiktok.com/@juanperez",
  "roles": ["ROLE_USER"],
  "active": true
}
```

---

### Actualizar perfil propio
Cualquier usuario autenticado puede editar sus propios datos. Solo se actualizan los campos que se incluyan en el body. `email` y `password` no se pueden cambiar por este endpoint. Para borrar las redes sociales envía el campo con valor `null`.

```
PUT /users/me
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "Juan Pérez",
  "username": "juanperez",
  "description": "Entrenador especializado en yoga.",
  "profile_image_url": "https://...",
  "banner_image_url": "https://...",
  "instagram_url": "https://instagram.com/juanperez",
  "facebook_url": "https://facebook.com/juanperez",
  "tiktok_url": "https://tiktok.com/@juanperez"
}
```

**Response `200`:**
```json
{
  "id": 2,
  "name": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@mail.com",
  "description": "Entrenador especializado en yoga.",
  "profile_image_url": "https://...",
  "banner_image_url": "https://...",
  "instagram_url": "https://instagram.com/juanperez",
  "facebook_url": "https://facebook.com/juanperez",
  "tiktok_url": "https://tiktok.com/@juanperez",
  "roles": ["ROLE_USER"],
  "active": true
}
```

---

### Actualizar usuario por id (admin)
El admin puede editar nombre, username, descripción, imágenes, redes sociales y roles de cualquier usuario. El email no es modificable — se cambiará únicamente mediante verificación por correo.

```
PUT /users/5
Authorization: Bearer <token de admin>
```
**Body:**
```json
{
  "name": "Juan Pérez",
  "username": "juanperez",
  "description": "Entrenador especializado en yoga.",
  "profile_image_url": "https://...",
  "banner_image_url": "https://...",
  "instagram_url": "https://instagram.com/juanperez",
  "facebook_url": "https://facebook.com/juanperez",
  "tiktok_url": "https://tiktok.com/@juanperez",
  "roles": ["ROLE_USER", "ROLE_COACH"]
}
```

> Todos los campos son opcionales — solo se actualizan los que se incluyan. `username` debe ser único. No se puede asignar `ROLE_ADMIN` mediante este endpoint.
> `profile_image_url`, `instagram_url`, `facebook_url` y `tiktok_url` siempre se sobreescriben con el valor enviado — envía `null` para borrarlos.

**Response `200` (ambos endpoints):**
```json
{
  "id": 5,
  "name": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@mail.com",
  "description": "Entrenador especializado en yoga.",
  "profile_image_url": "https://...",
  "banner_image_url": "https://...",
  "instagram_url": "https://instagram.com/juanperez",
  "facebook_url": "https://facebook.com/juanperez",
  "tiktok_url": "https://tiktok.com/@juanperez",
  "roles": ["ROLE_USER", "ROLE_COACH"],
  "active": true
}
```

---

## Categorías

| Método | Endpoint | Rol requerido |
|---|---|---|
| GET | `/category` | USER, ADMIN |
| GET | `/category/{id}` | USER, ADMIN |
| GET | `/category/{id}/trainings` | USER, ADMIN |
| POST | `/category` | ADMIN |
| PUT | `/category/{id}` | ADMIN |
| DELETE | `/category/{id}` | ADMIN |

### Crear / Editar categoría
**Body:**
```json
{
  "name": "Yoga",
  "description": "Disciplina de movimiento y respiración.",
  "image_url": "https://...",
  "icon_url": "https://..."
}
```

> `image_url` e `icon_url` son opcionales.

### Categorías precargadas
Al iniciar el servidor se insertan automáticamente:
`Box`, `Yoga`, `Karate`, `Artes Marciales`, `Atletismo`, `Running`,
`Entrenamiento Funcional`, `Crossfit`, `Fuerza`, `Gimnasio`,
`Movilidad`, `Estiramiento`, `Meditación`, `Bienestar`, `Calistenia`

> No se puede eliminar una categoría que tenga trainings asociados.

---

## Trainings

| Método | Endpoint | Rol requerido |
|---|---|---|
| GET | `/training` | USER, ADMIN |
| GET | `/training?status=PUBLISHED` | USER, ADMIN |
| GET | `/training?category_ids=1,2,3` | USER, ADMIN |
| GET | `/training?category_ids=1,2&status=PUBLISHED` | USER, ADMIN |
| GET | `/training?search=yoga` | USER, ADMIN |
| GET | `/training/{id}` | USER, ADMIN |
| POST | `/training` | ADMIN |
| PUT | `/training/{id}` | ADMIN |
| DELETE | `/training/{id}` | ADMIN |

### Paginación (opcional)

`GET /training` soporta paginación opcional. Si se omite `page`, el endpoint devuelve el array plano completo (comportamiento original).

```
GET /training?page=0&page_size=20
GET /training?page=0&page_size=20&status=PUBLISHED
GET /training?page=0&page_size=20&category_ids=1,2&status=PUBLISHED
```

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int | — | Número de página, **base 0**. Si se omite → respuesta sin paginar. |
| `page_size` | int | `20` | Elementos por página. Solo aplica si `page` está presente. |

**Response paginada:**
```json
{
  "items": [ ... ],
  "page": 0,
  "page_size": 20,
  "total_items": 134,
  "total_pages": 7
}
```

**Ordenamiento:** los resultados se ordenan por **relevancia descendente**:

| Prioridad | Criterio |
|---|---|
| 1° | Número de inscritos (enrollments) |
| 2° | Número de sesiones completadas por los inscritos |
| 3° | `id` ascendente (desempate de estabilidad) |

Los trainings con más inscritos y mayor consumo aparecen primero. Todos los filtros existentes (`status`, `category_ids`) son combinables con la paginación.

---

### Búsqueda por texto (opcional)

El param `search` filtra por título, descripción o tags de forma **case-insensitive** (`LIKE %texto%`). Cuando está presente, la respuesta es **siempre paginada** (si se omite `page`, se asume `page=0`).

```
GET /training?search=yoga
GET /training?search=yoga&page=0&page_size=20
GET /training?search=yoga&status=PUBLISHED
GET /training?search=yoga&status=PUBLISHED&category_ids=1,2
```

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `search` | string | — | Texto libre. Matchea contra `title`, `description` y `tags`. Si se omite → sin filtro de texto. |

- Es combinable con `status`, `category_ids` y `page`/`page_size`.
- El ordenamiento por relevancia (inscritos y sesiones completadas) aplica igual sobre los resultados filtrados.
- Espacios en blanco son ignorados (el valor se hace `trim()` antes del LIKE).

---

### Crear / Editar training
**Body:**
```json
{
  "title": "Yoga Vinyasa Nivel 1",
  "description": "Entrenamiento de flujo dinámico para principiantes.",
  "image_url": "https://...",
  "video_url": "https://...",
  "price": 9.99,
  "difficulty_level": "BEGINNER",
  "premium": false,
  "publish_status": "DRAFT",
  "coach_id": 5,
  "category_ids": [1, 2],
  "tags": ["yoga", "principiantes", "flexibilidad"]
}
```

**Query params opcionales (GET /training):**

| Param | Valores | Descripción |
|---|---|---|
| `status` | `DRAFT`, `PUBLISHED` | Filtra por estado de publicación |
| `category_ids` | `1,2,3` | Filtra por una o varias categorías (OR) |
| `search` | texto libre | Busca en título y descripción (case-insensitive). Fuerza respuesta paginada. |
| `page` | entero base-0 | Activa paginación |
| `page_size` | entero | Tamaño de página (default `20`) |

Se pueden combinar: `/training?search=yoga&status=PUBLISHED&category_ids=1,2&page=0&page_size=20`

**Valores válidos en el body:**

`difficulty_level`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED`

`publish_status`: `DRAFT` | `PUBLISHED`

> `description`, `image_url`, `video_url`, `price`, `coach_id` y `tags` son opcionales. Si se envía `description`, debe tener al menos 3 caracteres. `price` debe ser mayor o igual a 0. `coach_id` debe corresponder a un usuario con `ROLE_COACH`. `tags` es un array de strings; si se omite el training queda sin tags.

**Response — objeto `coach` dentro de cada training:**
```json
{
  "id": 3,
  "name": "Coach Uno",
  "description": "Entrenador especializado.",
  "profile_image_url": "https://fitlan.s3.us-east-1.amazonaws.com/uploads/abc123...?X-Amz-Expires=604800&...",
  "profile_image_key": "uploads/abc123-coach-avatar.jpg",
  "banner_image_url": "https://fitlan.s3.us-east-1.amazonaws.com/uploads/def456...?X-Amz-Expires=604800&...",
  "banner_image_key": "uploads/def456-coach-banner.jpg",
  "instagram_url": null,
  "facebook_url": null,
  "tiktok_url": null,
  "is_following": true
}
```

> `is_following` indica si el usuario autenticado ya sigue a ese coach. Es `null` si el training no tiene coach asignado.
> `profile_image_key` / `banner_image_key` son los identificadores permanentes en S3 — úsalos como cache key en el cliente. `profile_image_url` / `banner_image_url` son URLs firmadas (válidas 7 días).

---

## Sesiones

| Método | Endpoint | Rol requerido |
|---|---|---|
| GET | `/session` | USER, ADMIN |
| GET | `/session/{id}` | USER, ADMIN |
| POST | `/session` | ADMIN |
| PUT | `/session/{id}` | ADMIN |
| DELETE | `/session/{id}` | ADMIN |

### Crear / Editar sesión
**Body:**
```json
{
  "title": "Saludo al sol",
  "description": "Secuencia de apertura de 15 minutos.",
  "image_url": "https://...",
  "video_url": "https://...",
  "display_order": 1,
  "duration_seconds": 900,
  "training_id": 1
}
```

> `training_id` debe corresponder a un training existente. `description`, `image_url` y `video_url` son opcionales.

---

## Steps (ejercicios)

| Método | Endpoint | Rol requerido |
|---|---|---|
| GET | `/step` | USER, ADMIN |
| GET | `/step/{id}` | USER, ADMIN |
| GET | `/step/session/{sessionId}` | USER, ADMIN |
| POST | `/step` | ADMIN |
| PUT | `/step/{id}` | ADMIN |
| DELETE | `/step/{id}` | ADMIN |

### Crear / Editar step
**Body:**
```json
{
  "title": "Postura del perro boca abajo",
  "description": "Mantén la posición 30 segundos.",
  "exercises": [
    "4 veces - Posición de piernas en L con piernas flexionadas a 60 grados",
    "2 veces - Extensión de columna con respiración"
  ],
  "image_url": "https://...",
  "video_url": "https://...",
  "duration_seconds": 30,
  "display_order": 1,
  "session_id": 1
}
```

> `session_id` debe corresponder a una sesión existente. `description`, `exercises`, `image_url` y `video_url` son opcionales. `exercises` es un array de strings de texto libre.

---

## Inscripciones y Progreso

| Método | Endpoint | Rol requerido |
|---|---|---|
| POST | `/enrollments/training/{trainingId}` | USER, COACH, ADMIN |
| PUT | `/enrollments/training/{trainingId}/session/{sessionId}/complete` | USER, COACH, ADMIN |
| GET | `/enrollments/me` | USER, COACH, ADMIN |
| GET | `/enrollments/me/recent` | USER, COACH, ADMIN |
| GET | `/enrollments/training/{trainingId}/metrics` | ADMIN |
| GET | `/enrollments/coach/{coachId}/metrics` | ADMIN |
| GET | `/enrollments/coaches/metrics` | ADMIN |

### Inscribirse a un training
Cuando el usuario abre la pantalla de un curso queda inscrito. Si ya estaba inscrito devuelve la inscripción existente sin crear un duplicado.

```
POST /enrollments/training/1
Authorization: Bearer <token>
```

**Response `201`:**
```json
{
  "id": 1,
  "training_id": 1,
  "training_title": "Yoga Vinyasa Nivel 1",
  "enrolled_at": "2026-05-29T10:00:00",
  "sessions_completed": 0,
  "sessions_total": 3,
  "progress_percentage": 0.0,
  "completion_logs": []
}
```

---

### Completar una sesión
Registra una completación de sesión. Cada llamada genera un nuevo registro — si el usuario repite la sesión se acumula en el historial. `sessions_completed` en el enrollment cuenta sesiones distintas completadas (no repeticiones).

```
PUT /enrollments/training/1/session/1/complete
Authorization: Bearer <token>
```
**Body (opcional):**
```json
{
  "watched_seconds": 845
}
```

> `watched_seconds` es opcional — útil para medir consumo de video. Requiere estar inscrito en el training y que la sesión pertenezca a ese training; si no, devuelve `404`.

**Response `200`:**
```json
{
  "id": 1,
  "session_id": 1,
  "session_title": "Saludo al sol",
  "completed_at": "2026-05-29T10:20:00",
  "watched_seconds": 845
}
```

---

### Mis inscripciones
Devuelve todas las inscripciones del usuario autenticado con su progreso e historial de completaciones.

```
GET /enrollments/me
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": 1,
    "training_id": 1,
    "training_title": "Yoga Vinyasa Nivel 1",
    "enrolled_at": "2026-05-29T10:00:00",
    "sessions_completed": 1,
    "sessions_total": 3,
    "progress_percentage": 33.33,
    "completion_logs": [
      {
        "id": 1,
        "session_id": 1,
        "session_title": "Saludo al sol",
        "completed_at": "2026-05-29T10:20:00",
        "watched_seconds": 845
      },
      {
        "id": 2,
        "session_id": 1,
        "session_title": "Saludo al sol",
        "completed_at": "2026-05-30T08:10:00",
        "watched_seconds": 900
      }
    ]
  }
]
```

> `sessions_completed` cuenta sesiones distintas — aunque el usuario repita la misma sesión 10 veces, sigue contando como 1.

---

### Trainings recientes con actividad

Devuelve los últimos 5 trainings donde el usuario ha tenido actividad, ordenados por la fecha de actividad más reciente.

- Si completó sesiones: ordena por la última completación (`completed_at`)
- Si nunca completó sesiones: ordena por fecha de inscripción (`enrolled_at`)

```
GET /enrollments/me/recent
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": 2,
    "title": "Box Avanzado",
    "description": "...",
    "difficulty_level": "ADVANCED",
    "premium": true,
    "price": 19.99,
    "publish_status": "PUBLISHED",
    "coach": {
      "id": 3,
      "name": "Coach Uno",
      "description": "...",
      "profile_image_url": null,
      "banner_image_url": null,
      "is_following": true
    },
    "categories": [ ... ],
    "sessions": [ ... ]
  }
]
```

> Devuelve máximo 5 resultados. El objeto `coach` incluye `is_following` indicando si el usuario autenticado ya sigue a ese coach.

---

### Métricas de un training (admin)
Devuelve estadísticas de consumo y revenue de un training específico.

```
GET /enrollments/training/1/metrics
Authorization: Bearer <token de admin>
```

**Response `200`:**
```json
{
  "training_id": 1,
  "training_title": "Yoga Vinyasa Nivel 1",
  "price": 9.99,
  "total_enrollments": 42,
  "total_revenue": 419.58,
  "total_sessions": 3,
  "average_sessions_completed": 1.8,
  "average_progress_percentage": 60.0,
  "total_completions": 210,
  "total_watched_seconds": 177450
}
```

> `total_completions` suma todas las completaciones incluyendo repeticiones — mide el engagement real con el contenido. `total_watched_seconds` suma los segundos de video vistos por todos los usuarios en ese training.

---

### Métricas de un coach (admin)
Agrega las métricas de todos los trainings de un coach para calcular su impacto y remuneración.

```
GET /enrollments/coach/3/metrics
Authorization: Bearer <token de admin>
```

**Response `200`:**
```json
{
  "coach_id": 3,
  "coach_name": "Coach Uno",
  "total_trainings": 2,
  "total_enrollments": 85,
  "total_revenue": 1249.15,
  "average_progress_percentage": 55.0,
  "total_followers": 120,
  "trainings": [
    {
      "training_id": 1,
      "training_title": "Yoga Vinyasa Nivel 1",
      "price": 9.99,
      "total_enrollments": 42,
      "total_revenue": 419.58,
      "total_sessions": 3,
      "average_sessions_completed": 1.8,
      "average_progress_percentage": 60.0,
      "total_completions": 210,
      "total_watched_seconds": 177450
    }
  ]
}
```

---

### Métricas de todos los coaches (admin)
Devuelve el mismo objeto de métricas para cada coach con `ROLE_COACH` en una sola llamada.

```
GET /enrollments/coaches/metrics
Authorization: Bearer <token de admin>
```

**Response `200`:** array con la misma estructura que el endpoint individual por coach.

```json
[
  {
    "coach_id": 3,
    "coach_name": "Coach Uno",
    "total_trainings": 2,
    "total_enrollments": 85,
    "total_revenue": 1249.15,
    "average_progress_percentage": 55.0,
    "total_followers": 120,
    "trainings": [...]
  },
  {
    "coach_id": 5,
    "coach_name": "Coach Dos",
    ...
  }
]
```

---

## Mensajería en tiempo real

Sistema de chat entre usuarios y entrenadores usando WebSocket (STOMP sobre SockJS).

**Reglas de negocio:**
- Un usuario (`ROLE_USER`) puede hablar con un entrenador (`ROLE_COACH`) y viceversa.
- Dos entrenadores **no** pueden iniciar una conversación entre sí → `400`.
- Dos usuarios sin rol de coach **no** pueden iniciar una conversación → `400`.
- Solo los participantes de una conversación pueden leer su historial o enviar mensajes.

---

### REST — Conversaciones

| Método | Endpoint | Rol requerido |
|---|---|---|
| `POST` | `/conversations` | USER, COACH |
| `GET` | `/conversations` | USER, COACH |
| `GET` | `/conversations/{id}/messages` | USER, COACH |
| `PUT` | `/conversations/{cid}/messages/{mid}/read` | USER, COACH |

#### Iniciar o retomar conversación
Si ya existe una conversación entre los dos usuarios, devuelve la existente sin crear un duplicado.

```
POST /conversations
Authorization: Bearer <token>
```
**Body:**
```json
{ "other_user_id": 3 }
```

**Response `200`:**
```json
{
  "id": 1,
  "other_user_id": 3,
  "other_username": "coach1",
  "other_name": "Coach Uno",
  "other_profile_image_url": "https://fitlan.s3.us-east-1.amazonaws.com/uploads/94fd881a-...?X-Amz-Expires=604800&...",
  "other_profile_image_key": "uploads/94fd881a-coach-avatar.jpg",
  "last_message": "Hola, ¿tienes clases disponibles?",
  "last_message_at": "2026-07-13T10:30:00",
  "created_at": "2026-07-13T09:00:00",
  "unread_count": 1
}
```

#### Listar mis conversaciones
```
GET /conversations
Authorization: Bearer <token>
```
**Response `200`:** array de conversaciones, ordenadas por actividad más reciente. Cada elemento tiene la misma forma que el response de `POST /conversations`. `other_profile_image_url` es URL firmada de S3 (válida 7 días); `other_profile_image_key` es el identificador permanente — úsalo como cache key en el cliente.

#### Historial de mensajes (paginación por cursor)

```
GET /conversations/1/messages
GET /conversations/1/messages?limit=50
GET /conversations/1/messages?before=123&limit=50
Authorization: Bearer <token>
```

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `before` | Long | — | ID del mensaje más viejo que tenés en pantalla. Carga los N mensajes anteriores a él. |
| `limit` | int | `50` | Cantidad de mensajes a traer. Máximo `100`. |

**Flujo de paginación:**

1. **Primer load** — omitir `before`: devuelve los últimos `limit` mensajes cronológicamente.
2. **Scroll hacia arriba** — pasar el `id` del mensaje más viejo de la lista como `before`: devuelve los `limit` anteriores.
3. **¿Llegué al inicio?** — si la respuesta trae menos de `limit` elementos, no hay más historial.

**Response `200`** (siempre en orden cronológico, el más viejo primero):
```json
[
  {
    "id": 1,
    "conversation_id": 1,
    "sender_id": 2,
    "sender_username": "user1",
    "content": "Hola, ¿tienes clases disponibles?",
    "sent_at": "2026-07-13T10:30:00",
    "read": true
  },
  {
    "id": 2,
    "conversation_id": 1,
    "sender_id": 3,
    "sender_username": "coach1",
    "content": "¡Claro! El martes a las 7pm.",
    "sent_at": "2026-07-13T10:31:00",
    "read": false
  }
]
```

> El cursor usa `id` (no timestamp) para evitar duplicados si dos mensajes tienen el mismo `sent_at`.

#### Marcar mensaje como leído
```
PUT /conversations/1/messages/2/read
Authorization: Bearer <token>
```
**Response `204`:** sin body. Solo el destinatario puede marcarlo como leído (el remitente no puede marcar su propio mensaje).

---

### WebSocket — Mensajería en tiempo real

El servidor expone **dos endpoints** según el cliente:

| Cliente | Protocolo | URL |
|---|---|---|
| Web (browser) | STOMP sobre SockJS | `http://localhost:8080/ws` |
| React Native / mobile | STOMP sobre WebSocket nativo | `ws://TU_IP:8080/ws-native` |

> SockJS usa rutas dinámicas del tipo `/ws/{server_id}/{session_id}/websocket` — no existe un path fijo `/ws/websocket`. Para React Native usar siempre `/ws-native`.

#### Payloads exactos

**Enviar mensaje** — destination: `/app/chat.send/{conversationId}`
```json
{ "content": "Hola!" }
```

**Mensaje recibido** — subscription: `/user/queue/messages`
```json
{
  "id": 5,
  "conversation_id": 1,
  "sender_id": 2,
  "sender_username": "user1",
  "content": "Hola!",
  "sent_at": "2026-07-13T10:35:22.123",
  "read": false
}
```

> El remitente también recibe el eco de su propio mensaje en `/user/queue/messages` para que la UI confirme entrega sin necesidad de actualizaciones adicionales.

---

#### Push notifications de chat

Cada vez que se guarda un mensaje, el servidor envía automáticamente una **push notification al destinatario** (comportamiento tipo WhatsApp). No requiere ninguna configuración adicional.

| Campo | Valor |
|---|---|
| `title` | Nombre del remitente |
| `body` | Preview del mensaje (máximo 100 caracteres) |
| `sound` | `"default"` |
| `data.screen` | `"conversation"` |
| `data.conversation_id` | ID de la conversación |

**Ejemplo del payload Expo:**
```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "Carlos García",
  "body": "Hola, ¿tienes clases disponibles?",
  "sound": "default",
  "data": {
    "screen": "conversation",
    "conversation_id": 1
  }
}
```

**Comportamiento esperado en la app:**
- Si la app está en background → mostrar la notificación y al tocarla abrir esa conversación.
- Si la app está en foreground y el usuario **ya está viendo esa conversación** → no navegar (la UI ya tiene el mensaje en tiempo real vía WebSocket).
- Si la app está en foreground pero el usuario está en otra pantalla → mostrar el banner y al tocarlo navegar a la conversación.
- Si el usuario está viendo un video → no navegar al tocar (misma regla que el resto del centro de notificaciones).

> ⚠ Estos mensajes **no se guardan** en el historial de notificaciones (`notifications` table). Son transitorios.

---

#### Flujo completo de conexión

**1. Obtener el `conversationId` vía REST** (antes de conectar al WebSocket):
```
POST /api/v1/conversations
{ "other_user_id": 3 }
→ { "id": 1, "other_username": "coach1", ... }
```

**2. Conectar enviando el JWT en el header STOMP `Authorization`:**
```
CONNECT
Authorization: Bearer <token>
```

**3. Suscribirse para recibir mensajes entrantes:**
```
SUBSCRIBE /user/queue/messages
```

**4. Enviar un mensaje a la conversación:**
```
SEND /app/chat.send/1
{ "content": "Hola!" }
```

---

#### Ejemplo — React Native (`@stomp/stompjs` sin sockjs-client)

```js
import { Client } from '@stomp/stompjs';

// RN ya tiene WebSocket nativo global — no se necesita sockjs-client
const client = new Client({
  brokerURL: 'ws://10.0.0.x:8080/ws-native', // IP de la máquina, no localhost
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  onConnect: () => {
    // Recibir mensajes
    client.subscribe('/user/queue/messages', (frame) => {
      const msg = JSON.parse(frame.body);
      // msg.id, msg.conversation_id, msg.sender_id, msg.sender_username,
      // msg.content, msg.sent_at, msg.read
    });

    // Enviar mensaje a conversación con id=1
    client.publish({
      destination: '/app/chat.send/1',
      body: JSON.stringify({ content: 'Hola!' }),
    });
  },
  onDisconnect: () => console.log('WS desconectado'),
  onStompError: (frame) => console.error('STOMP error', frame),
});

client.activate();

// Al cerrar el chat:
// client.deactivate();
```

**Dependencia:**
```
npm install @stomp/stompjs
```

---

#### Ejemplo — Web / browser (`sockjs-client` + `@stomp/stompjs`)

```js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  onConnect: () => {
    client.subscribe('/user/queue/messages', (frame) => {
      const msg = JSON.parse(frame.body);
      // msg.id, msg.conversation_id, msg.sender_id, msg.sender_username,
      // msg.content, msg.sent_at, msg.read
    });

    client.publish({
      destination: '/app/chat.send/1',
      body: JSON.stringify({ content: 'Hola!' }),
    });
  },
});

client.activate();
```

**Dependencias:**
```
npm install @stomp/stompjs sockjs-client
```

---

## Push Notifications

El sistema usa **Expo Push Notifications**. El backend almacena los Expo tokens de cada dispositivo y llama a la API de Expo para enviarlas.

### Registro y desregistro de token (app móvil)

**Registrar — llamar después de cada login exitoso:**
```
POST /api/v1/notifications/device-token
Authorization: Bearer <user_token o coach_token>
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
→ 200
```

**Desregistrar — llamar en logout:**
```
DELETE /api/v1/notifications/device-token
Authorization: Bearer <user_token o coach_token>
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
→ 204
```

Solo borra la asociación del token con el usuario autenticado. Si el token no existe o pertenece a otro usuario, no hace nada (idempotente y seguro). Si el usuario tiene sesión abierta en varios dispositivos, solo se desregistra el dispositivo que cierra sesión.

Si el usuario tiene varios dispositivos, cada uno registra su propio token. Un mismo token reasignado a otro usuario se actualiza automáticamente.

---

### Preferencias de notificación (app móvil)

El usuario puede activar o desactivar grupos de notificaciones desde la pantalla de ajustes de la app.

**Obtener preferencias actuales:**
```
GET /api/v1/users/me/notification-preferences
Authorization: Bearer <user_token o coach_token>
```

**Response `200`:**
```json
{
  "actividad_enabled": true,
  "novedades_enabled": true,
  "cuenta_enabled": false
}
```

> Si el usuario nunca modificó sus preferencias, el endpoint las crea con todos los grupos habilitados y las devuelve.

**Actualizar preferencias:**
```
PUT /api/v1/users/me/notification-preferences
Authorization: Bearer <user_token o coach_token>
Content-Type: application/json
```
```json
{
  "actividad_enabled": true,
  "novedades_enabled": false,
  "cuenta_enabled": true
}
```

**Response `200`:** misma forma que el GET con los valores actualizados.

> Los tres campos son obligatorios en el PUT — enviar el estado completo, no solo el campo que cambia.
> Las notificaciones de tipo `CUSTOM` (broadcasts manuales del admin) no pertenecen a ningún grupo y **siempre** se envían independientemente de las preferencias.

---

### Tipos de notificación y grupos de preferencia

Cada notificación pertenece a un **grupo** que el usuario puede activar o desactivar desde la app. Las notificaciones `CUSTOM` no tienen grupo y siempre se envían.

| Grupo | Tipo | Label |
|---|---|---|
| **Actividad** | `DAILY_REMINDER` | Recordatorio diario |
| **Actividad** | `WEEKLY_ACHIEVEMENT` | Logro semanal |
| **Actividad** | `STREAK` | Racha activa |
| **Novedades** | `NEW_TRAINING` | Nuevo entrenamiento |
| **Novedades** | `NEW_CATEGORY` | Nueva categoría |
| **Cuenta** | `SUBSCRIPTION_EXPIRING` | Suscripción por vencer |
| *(sin grupo)* | `CUSTOM` / `null` | Personalizada — siempre se envía |

El campo `type` es opcional en el request. Si se omite, la notificación se guarda sin tipo (personalizada).

---

### Endpoints de administración (solo `ROLE_ADMIN`)

#### Listar templates disponibles

```
GET /api/v1/admin/notifications/templates
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
[
  {
    "type": "NEW_TRAINING",
    "label": "Nuevo entrenamiento",
    "default_title": "Nuevo entrenamiento disponible",
    "default_body": "Tenemos un nuevo entrenamiento para ti. ¡Entra a verlo!",
    "default_screen": "training_detail"
  },
  {
    "type": "DAILY_REMINDER",
    "label": "Recordatorio diario",
    "default_title": "No olvides tu rutina de hoy",
    "default_body": "Es hora de entrenar. ¡Tu cuerpo te lo va a agradecer!",
    "default_screen": "home"
  },
  {
    "type": "WEEKLY_ACHIEVEMENT",
    "label": "Logro semanal",
    "default_screen": null
  }
]
```

El campo `default_screen` indica a qué pantalla debe navegar la app al tocar la notificación:

| Tipo | `default_screen` | Acción en la app |
|---|---|---|
| `NEW_TRAINING` | `"training_detail"` | Abre el entrenamiento (requiere `extra_data.training_id`) |
| `DAILY_REMINDER` | `"home"` | Abre la pantalla principal |
| `WEEKLY_ACHIEVEMENT` | `null` | Solo abre la app |
| `NEW_CATEGORY` | `null` | Solo abre la app |
| `STREAK` | `null` | Solo abre la app |
| `SUBSCRIPTION_EXPIRING` | `"subscription"` | Abre la pantalla de suscripción |
| `CUSTOM` | `null` | Solo abre la app |

#### Listar usuarios con estado de token

```
GET /api/v1/admin/notifications/users
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
[
  { "id": 2, "username": "user1", "name": "Juan",   "has_token": true,  "token_count": 2 },
  { "id": 3, "username": "coach1","name": "Carlos", "has_token": true,  "token_count": 1 },
  { "id": 5, "username": "user3", "name": "María",  "has_token": false, "token_count": 0 }
]
```

> Usuarios con `has_token: false` nunca abrieron la app o no otorgaron permiso de notificaciones.
> La lista viene ordenada: primero los que tienen token.

---

#### Enviar notificación

```
POST /api/v1/admin/notifications/send
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Con tipo `NEW_TRAINING` (incluir `extra_data.training_id`):**
```json
{
  "type": "NEW_TRAINING",
  "title": "Nuevo entrenamiento disponible",
  "body": "Tenemos un nuevo entrenamiento para ti. ¡Entra a verlo!",
  "target_type": "ALL",
  "extra_data": { "training_id": 42 }
}
```
→ La app recibe `data: { "screen": "training_detail", "training_id": 42 }` y abre ese entrenamiento.

> **CMS:** el formulario muestra un dropdown con los entrenamientos publicados (`GET /api/v1/training?status=PUBLISHED`). El admin elige el entrenamiento por nombre y el `training_id` se incluye automáticamente en `extra_data`.

**Con tipo `DAILY_REMINDER`:**
```json
{
  "type": "DAILY_REMINDER",
  "title": "No olvides tu rutina de hoy",
  "body": "Es hora de entrenar. ¡Tu cuerpo te lo va a agradecer!",
  "target_type": "ALL"
}
```
→ **Cron automático:** incluye el `training_id` del entrenamiento más reciente del usuario (últimos **3 días**). Si el usuario no tuvo actividad en los últimos 3 días, **no se envía ninguna notificación**.

| Caso | Comportamiento |
|---|---|
| Con actividad en los últimos 3 días | Envía `{ screen: "training_detail", training_id: X }` del training más reciente |
| Sin actividad reciente | No se envía notificación |

→ **Envío manual desde CMS:** el formulario muestra el mismo selector de entrenamientos publicados que `NEW_TRAINING`. Al elegir uno, el payload incluye `extra_data: { screen: "training_detail", training_id: X }` y la app abre ese entrenamiento. Si se envía sin seleccionar entrenamiento, la app navega al home.

**Personalizada (sin tipo, sin deep link):**
```json
{
  "title": "Mensaje especial",
  "body": "Contenido personalizado.",
  "target_type": "SELECTED",
  "user_ids": [2, 5, 8]
}
```

#### Campo `extra_data`

Cualquier tipo puede recibir datos adicionales que se pasan a la app:

```json
{ "extra_data": { "training_id": 42 } }
```

El backend los mezcla con el `screen` del tipo y los envía como campo `data` en el payload de Expo. La app los recibe en `notification.request.content.data`.

**Response `200`:**
```json
{
  "total": 10,
  "sent": 9,
  "failed": 1,
  "errors": ["The device cannot receive push notifications"]
}
```

| Campo | Descripción |
|---|---|
| `total` | Tokens encontrados para el target |
| `sent` | Notificaciones enviadas con éxito |
| `failed` | Fallos (token vencido, dispositivo sin conexión, etc.) |
| `errors` | Mensajes de error de Expo por cada fallo |

> El historial se guarda para **todos** los usuarios destinatarios, tengan o no token push. Los usuarios sin token no reciben la notificación push pero sí la ven en su centro de notificaciones dentro de la app.
> Los tokens que Expo reporta como `DeviceNotRegistered` (app desinstalada) se eliminan automáticamente de la base de datos.
> El envío se realiza en lotes de 100 tokens (límite de la API de Expo).

---

### Historial de notificaciones (endpoints de usuario)

```
GET    /api/v1/notifications              → lista el historial del usuario (más nueva primero)
GET    /api/v1/notifications/unread-count → { "unread_count": 3 } (útil para badge)
PATCH  /api/v1/notifications/{id}/read    → marca una notificación como leída → 204
PATCH  /api/v1/notifications/read-all    → marca todas como leídas → 204
DELETE /api/v1/notifications/{id}         → elimina una notificación → 204
DELETE /api/v1/notifications             → elimina todo el historial → 204
```

**Response de `GET /api/v1/notifications`:**
```json
[
  {
    "id": 12,
    "type": "NEW_TRAINING",
    "title": "Nuevo entrenamiento disponible",
    "body": "Tenemos un nuevo entrenamiento para ti. ¡Entra a verlo!",
    "read": false,
    "created_at": "2026-08-08T10:30:00",
    "action_data": { "training_id": 42 }
  },
  {
    "id": 11,
    "type": "DAILY_REMINDER",
    "title": "No olvides tu rutina de hoy",
    "body": "Es hora de entrenar. ¡Tu cuerpo te lo va a agradecer!",
    "read": false,
    "created_at": "2026-08-08T08:00:00",
    "action_data": null
  },
  {
    "id": 10,
    "type": "STREAK",
    "title": "¡Racha de 7 días!",
    "body": "Llevas 7 días consecutivos entrenando. ¡No pares ahora!",
    "read": true,
    "created_at": "2026-08-07T08:00:00",
    "action_data": null
  }
]
```

#### Navegación desde el centro de notificaciones

El campo `action_data` + `type` indica a la app qué hacer al tocar la notificación:

| `type` | `action_data` | Pantalla destino |
|---|---|---|
| `NEW_TRAINING` | `{ "training_id": 42 }` | Detalle del entrenamiento |
| `DAILY_REMINDER` | `{ "training_id": 42 }` del training más reciente | Detalle del entrenamiento más reciente (si no tuvo actividad en 3 días, el cron no envía la notificación) |
| `SUBSCRIPTION_EXPIRING` | `null` | Navegar a pantalla de suscripción |
| Resto | `null` | Sin navegación (solo marcar como leída) |

**Excepción — pantalla de video:** si el usuario está reproduciendo un video, el tap a cualquier notificación (push o desde el centro) no debe interrumpir la reproducción. Sin navegación.

```js
// Ejemplo en React Native
const VIDEO_SCREENS = ['TrainingVideo', 'VideoPlayer']; // ajustar al nombre real de la pantalla

function handleNotificationTap(notification) {
  const currentRoute = navigation.getCurrentRoute()?.name;

  // Si el usuario está viendo un video, ignorar cualquier navegación
  if (VIDEO_SCREENS.includes(currentRoute)) return;

  switch (notification.type) {
    case 'NEW_TRAINING':
      navigation.navigate('TrainingDetail', { trainingId: notification.action_data.training_id });
      break;
    case 'DAILY_REMINDER':
      if (notification.action_data?.training_id) {
        navigation.navigate('TrainingDetail', { trainingId: notification.action_data.training_id });
      } else {
        navigation.navigate('Home');
      }
      break;
    // otros tipos: sin navegación
  }
}
```

> **Regla:** si el usuario está en la pantalla de reproducción de video, el tap a cualquier notificación (tanto push como desde el centro) no debe interrumpir la reproducción. La app verifica la pantalla activa antes de navegar.

Todos los endpoints de historial requieren `Authorization: Bearer <user_token o coach_token>`. Un usuario solo puede ver y borrar sus propias notificaciones.

---

### Notificaciones programadas (automáticas)

Cuatro tareas cron que corren en zona horaria **America/Mexico_City (CDMX)**:

| Tarea | `task` | Horario predeterminado | Tipo | Criterio | `data` en la app |
|---|---|---|---|---|---|
| Recordatorio diario | `DAILY_REMINDER` | Todos los días 8:00 AM | `DAILY_REMINDER` | Usuarios con actividad en los últimos 3 días (sin actividad reciente → no se envía nada) | `{ screen: "training_detail", training_id: X }` del training más reciente |
| Logro semanal | `WEEKLY_ACHIEVEMENT` | Lunes 9:00 AM | `WEEKLY_ACHIEVEMENT` | Completaron ≥ 5 sesiones distintas en los últimos 7 días | _(ninguno)_ |
| Racha activa | `STREAK` | Todos los días 8:00 AM | `STREAK` | Racha exacta en hito (3, 7, 14 o 30 días consecutivos) | _(ninguno)_ |
| Suscripción por vencer | `SUBSCRIPTION_EXPIRY` | Todos los días 10:00 AM | `SUBSCRIPTION_EXPIRING` | Suscripciones `ACTIVE`/`TRIALING` que vencen en exactamente 7 días **o** en menos de 24 h — se envían dos notificaciones con copy distinto | `{ screen: "subscription" }` |

Los horarios son **configurables desde el CMS** (pestaña "Horarios") y se aplican inmediatamente sin reiniciar el servidor. La configuración se persiste en la tabla `notification_schedule_configs`.

#### Endpoints de configuración de horarios

```
GET  /api/v1/admin/notifications/schedule
PUT  /api/v1/admin/notifications/schedule/{task}
```

`{task}`: `DAILY_REMINDER` | `WEEKLY_ACHIEVEMENT` | `STREAK` | `SUBSCRIPTION_EXPIRY`

**Response GET:**
```json
[
  {
    "task": "DAILY_REMINDER",
    "label": "Recordatorio diario",
    "frequency": "Lun–Dom",
    "hour": 8,
    "minute": 0,
    "enabled": true
  }
]
```

**Body PUT:**
```json
{
  "hour": 9,
  "minute": 30,
  "enabled": true
}
```

Con `enabled: false` la tarea se pausa sin perder la configuración de hora. La pausa **solo afecta el envío automático** — el envío manual desde el CMS (`POST /admin/notifications/send`) funciona independientemente del estado `enabled` de la tarea.

El umbral de logro semanal es configurable en `application.properties`:
```properties
app.notifications.weekly-achievement-threshold=5
```

Las rachas se notifican **solo en hitos exactos** (no todos los días) y el mensaje incluye el número de días exacto: *"Llevás 7 días consecutivos entrenando"*. Una racha es válida si el último entrenamiento fue hoy o ayer.

Cada tarea guarda el historial en la tabla `notifications` y envía push a los dispositivos registrados, igual que el envío manual desde el CMS.

#### Envío manual vs automático

| | Envío manual (`POST /admin/notifications/send`) | Envío automático (cron) |
|---|---|---|
| Requiere `enabled: true` en el horario | No | Sí |
| Respeta la zona horaria CDMX | N/A | Sí |
| Guarda historial en la app | Sí | Sí |
| Envía push a dispositivos | Sí (si tienen token) | Sí (si tienen token) |

Pausar una tarea en el CMS ("Horarios" → toggle "Pausada") **solo detiene el cron**. El admin puede seguir enviando ese mismo tipo de notificación manualmente en cualquier momento.

---

### Integración en la app móvil (Expo)

```js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async function registerPushToken(jwtToken) {
  if (!Device.isDevice) return; // no funciona en simulador

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  await fetch('http://TU_IP:8080/api/v1/notifications/device-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
}
```

**Dependencia:**
```
npx expo install expo-notifications expo-device
```

---

### Configuración iOS — APNs credentials (obligatorio para iOS)

Las notificaciones en iOS requieren credenciales APNs (Apple Push Notification service) asociadas al bundle ID de la app. Sin esto, Expo no puede entregar notificaciones en dispositivos Apple.

**Setup una sola vez** (requiere Apple Developer account):

```bash
# 1. Instalar EAS CLI si no está
npm install -g eas-cli

# 2. Login con la cuenta Expo
eas login

# 3. Inicializar EAS en el proyecto (genera eas.json)
cd tu-proyecto-rn
eas build:configure

# 4. Configurar credenciales APNs — EAS las genera automáticamente
eas credentials
# Seleccionar: iOS → Push Notifications → Set up Push Notifications Key
```

EAS genera una APNs Key desde tu cuenta de Apple Developer y la almacena en sus servidores para usarla en cada build. No se necesita tocar el backend.

> Una APNs Key sirve para todos los bundle IDs de tu cuenta de Apple (máximo 2 keys activas por cuenta).
> Android no requiere este paso — FCM es manejado automáticamente por Expo.

**Diagnóstico: error "Could not find APNs credentials" en runtime**

Si este error aparece en el resultado del envío desde el CMS (campo `errors[]`), significa que el backend llama correctamente a Expo pero Expo no puede reenviar a Apple. Causas y soluciones:

| Causa | Solución |
|---|---|
| `eas credentials` no se completó | Correr `eas build:configure` y luego `eas credentials` → iOS → Push Notifications → Set up Push Notifications Key |
| App corriendo en **Expo Go** | Expo Go no soporta push notifications. Usar un development build (`eas build --platform ios --profile development`) |
| Token registrado desde Expo Go | El token es inválido para producción. Reinstalar el development build y volver a loguear para registrar un token válido |

```bash
# Si el error persiste, reconstruir con EAS:
eas build --platform ios --profile development
```

---

### Autenticación con Expo — free vs. EAS

El backend llama a `https://exp.host/--/api/v2/push/send` **sin API key**. La API pública de Expo es accesible sin autenticación por diseño: la seguridad está en el token del dispositivo (string opaco que solo puede obtener la app instalada en ese dispositivo).

| | Free tier (implementación actual) | EAS con access token |
|---|---|---|
| Autenticación backend | Ninguna | `Authorization: Bearer <expo-token>` |
| Rate limit | ~600 notif/min por IP | Sin límite |
| Prioridad entrega | Normal | Alta (puede despertar app en background) |
| Costo | Gratis | Plan pago Expo |

Si en el futuro se necesita el tier pago, el único cambio en el backend es:

1. Agregar en `application.properties`:
```properties
expo.access-token=tu_token_de_eas
```

2. Inyectar el valor en `PushNotificationService` y agregarlo al header del `RestClient`:
```java
@Value("${expo.access-token:}")
private String expoAccessToken;

// En el RestClient call, antes de .body():
.header("Authorization", "Bearer " + expoAccessToken)
```

> Lo que sí requiere configuración de build (en `app.json` de Expo, no en el servidor) son las credenciales de FCM para Android y APNS para iOS. Expo las gestiona automáticamente si usás EAS Build.

---

## Contenido estático (CMS)

Endpoints para las pantallas de Privacidad, Ayuda, FAQs y Acerca de. El contenido se almacena en BD y es editable desde el panel admin sin necesidad de publicar una nueva versión de la app.

**Los GET son públicos** (no requieren token) para que sean accesibles en flujos de onboarding o desde la web.

| Método | Endpoint | Auth |
|---|---|---|
| GET | `/content/privacy-policy` | Público |
| GET | `/content/help-support` | Público |
| GET | `/content/faqs` | Público |
| GET | `/content/about` | Público |
| PUT | `/content/{key}` | ADMIN |

---

### GET /content/privacy-policy

```
GET /content/privacy-policy
```

**Response `200`:**
```json
{
  "updated_at": "2026-08-01",
  "sections": [
    {
      "title": "Qué datos recopilamos",
      "body": "Recopilamos los datos que nos proporcionas al registrarte..."
    },
    {
      "title": "Cómo usamos tus datos",
      "body": "..."
    }
  ]
}
```

---

### GET /content/help-support

```
GET /content/help-support
```

**Response `200`:**
```json
{
  "contact_email": "soporte@fitlanacademy.mx",
  "whatsapp_url": "https://wa.me/525500000000",
  "topics": [
    { "id": 1, "title": "Problemas para iniciar sesión", "body": "..." },
    { "id": 2, "title": "No puedo ver los videos", "body": "..." }
  ]
}
```

---

### GET /content/faqs

```
GET /content/faqs
```

**Response `200`:** array plano de preguntas y respuestas.
```json
[
  { "id": 1, "question": "¿Cómo cambio mi contraseña?", "answer": "..." },
  { "id": 2, "question": "¿Puedo usar Fitlán sin suscripción?", "answer": "..." }
]
```

---

### GET /content/about

```
GET /content/about
```

**Response `200`:**
```json
{
  "app_version": "1.0.0",
  "mission": "Conectar a personas con los mejores entrenadores...",
  "description": "Fitlán es una plataforma de fitness online...",
  "website_url": "https://fitlanacademy.mx",
  "social": {
    "instagram_url": "https://instagram.com/fitlanacademy",
    "tiktok_url": "https://tiktok.com/@fitlanacademy"
  }
}
```

---

### PUT /content/{key} — editar contenido (ADMIN)

Reemplaza el documento completo para una clave. El body es el JSON exacto que devolverá el GET correspondiente.

```
PUT /content/faqs
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:** el JSON completo del documento (mismo shape que el GET).

**Keys válidas:** `privacy-policy`, `help-support`, `faqs`, `about`.

**Response `200`:** el documento actualizado tal como quedó guardado.

> Al arrancar por primera vez el servidor inserta contenido por defecto en español para las cuatro claves. Deploys posteriores no sobreescriben cambios ya guardados.

---

## Integración frontend / app móvil

### Logout

Al cerrar sesión, llamar al endpoint **antes** de borrar el token local para que el servidor invalide la sesión:

```js
await axios.post('/api/v1/auth/logout'); // el interceptor de axios agrega el Bearer automáticamente
localStorage.removeItem('token');
```

### Sesión desplazada (401 inesperado)

Si el usuario ya tiene 2 sesiones activas y hace login en un tercer dispositivo, la sesión más antigua queda inválida. El siguiente request desde ese dispositivo devolverá `401`. El frontend y la app móvil deben manejar este caso redirigiendo al login:

```js
// Interceptor de respuesta — agregar una sola vez al inicializar axios
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token'); // o AsyncStorage.removeItem en React Native
      window.location.href = '/login'; // o navigation.replace('Login') en RN
    }
    return Promise.reject(err);
  }
);
```

> Este interceptor cubre todos los casos de `401`: token expirado, sesión cerrada remotamente, cuenta suspendida, etc.

---

## Email

El backend envía emails transaccionales vía **Mailtrap HTTP API** (sandbox para dev/testing). El envío es **asíncrono** — la respuesta HTTP nunca espera a que el correo salga.

| Variable | Descripción |
|---|---|
| `MAILTRAP_API_TOKEN` | Token de API de Mailtrap (Settings → API Tokens) |
| `MAILTRAP_INBOX_ID` | ID numérico del inbox (visible en la URL: `mailtrap.io/inboxes/{id}`) |
| `APP_FRONTEND_URL` | URL base del website (ej. `https://mi-website.com`). Se usa para los links de verificación de email y reset de contraseña en los correos. |

**Local (`application.properties`):** `mailtrap.api.token` y `mailtrap.api.inbox-id` directamente.
**Prod (Railway):** variables de entorno `MAILTRAP_API_TOKEN`, `MAILTRAP_INBOX_ID` y `APP_FRONTEND_URL`.

> El envío usa HTTPS (puerto 443) — no depende de puertos SMTP, por lo que funciona desde cualquier plataforma cloud.

---

## CORS

Los orígenes permitidos se configuran vía la variable de entorno `CORS_ALLOWED_ORIGINS` (coma-separados, soporta patrones con `*`).

| Entorno | Variable |
|---|---|
| Railway (prod) | `CORS_ALLOWED_ORIGINS=https://considerate-mercy-production-fb32.up.railway.app,http://localhost:*` |
| Local (dev) | Si no se define la variable, el fallback es `http://localhost:*` |

Al agregar el dominio público del website, añadirlo a la lista separado por coma:
```
CORS_ALLOWED_ORIGINS=https://considerate-mercy-production-fb32.up.railway.app,https://fitlan.mx,http://localhost:*
```

Los WebSockets (`/ws/**`, `/ws-native/**`) aceptan cualquier origen independientemente de esta variable (necesario para clientes móviles).

---

## Frontend Admin

Panel de administración web incluido en `frontend/`. Construido con React + Vite + MUI.

**Requisitos:** Node 18+

**Levantar:**
```bash
cd frontend
npm install
npm run dev
```

Disponible en `http://localhost:5173`. Requiere que el backend esté corriendo en `http://localhost:8080`.

**Páginas disponibles:**

| Ruta | Descripción |
|---|---|
| `/` | Dashboard con métricas globales y gráfico por coach |
| `/coaches` | Tarjetas por coach con métricas detalladas por training |
| `/trainings` | CRUD de trainings con filtro por estado (DRAFT / PUBLISHED). Descripción opcional. |
| `/sessions` | CRUD de sesiones con filtro por training, ordenadas por `display_order`. Descripción opcional. |
| `/steps` | CRUD de steps con filtro en cascada training → sesión. Incluye editor de ejercicios y descripción opcional. |
| `/categories` | CRUD de categorías |
| `/users` | Gestión de usuarios — editar datos y roles, suspender y activar |
| `/subscriptions` | Gestión de suscripciones — ver plan activo de cada usuario, asignar o cambiar plan, quitar suscripción |

> Todos los filtros se persisten en la URL (`?status=PUBLISHED`, `?training=1&session=2`), por lo que sobreviven al refresco de página y se pueden compartir como enlace.

**Editor de ejercicios (solo steps):**
- Se muestra debajo del campo descripción en el formulario de crear/editar.
- Escribe el texto del ejercicio y presiona **Agregar** o **Enter** para añadirlo a la lista.
- Cada ítem tiene un botón de eliminar individual.
- Al abrir un registro existente, los ejercicios guardados se cargan automáticamente en el editor.
- Si no se agrega ningún ejercicio, el campo se omite del payload (no se envía `null` al backend).

---

## Suscripciones

| Método | Endpoint | Rol requerido |
|---|---|---|
| GET | `/subscriptions/plans` | Público |
| GET | `/subscriptions/me` | USER, ADMIN |
| GET | `/admin/subscriptions` | ADMIN |
| POST | `/admin/subscriptions` | ADMIN |

### Planes disponibles
```
GET /subscriptions/plans
```

> Endpoint público — no requiere `Authorization`. Útil para mostrar precios en el website o en la pantalla de onboarding antes del login.

**Response `200`:**
```json
[
  {
    "id": "LITE",
    "display_name": "Plan Lite",
    "billing_cycle": "MONTHLY",
    "commitment": "MONTHLY",
    "monthly_price": 299.00
  },
  {
    "id": "BASIC",
    "display_name": "Plan Basic",
    "billing_cycle": "MONTHLY",
    "commitment": "ANNUAL",
    "monthly_price": 249.00
  },
  {
    "id": "PRO",
    "display_name": "Plan Pro",
    "billing_cycle": "ANNUAL",
    "commitment": "ANNUAL",
    "monthly_price": 199.00
  }
]
```

| Campo | Descripción |
|---|---|
| `billing_cycle` | Frecuencia de cobro: `MONTHLY` (se cobra cada mes) o `ANNUAL` (se cobra una vez al año) |
| `commitment` | Compromiso mínimo: `MONTHLY` (cancela cuando quieras) o `ANNUAL` (compromiso de 12 meses) |
| `monthly_price` | Precio de referencia por mes (en BASIC y PRO es el equivalente mensual del plan anual) |

Los tres planes dan acceso al mismo contenido. La diferencia es solo el precio y el compromiso de permanencia.

---

### Suscripción activa del usuario
```
GET /subscriptions/me
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": 1,
  "plan": "PRO",
  "plan_display_name": "Plan Pro",
  "billing_cycle": "ANNUAL",
  "commitment": "ANNUAL",
  "monthly_price": 199.00,
  "status": "ACTIVE",
  "current_period_start": "2026-08-01T00:00:00",
  "current_period_end": "2027-08-01T00:00:00",
  "cancel_at_period_end": false,
  "created_at": "2026-08-01T12:00:00"
}
```

**Response `404`:** si el usuario no tiene ninguna suscripción, o si la más reciente no otorga acceso (`UNPAID`, `INCOMPLETE`, `INCOMPLETE_EXPIRED` o `EXPIRED` legacy).

**Estados posibles (`status`):**

| Estado | Descripción | Tiene acceso | Origen |
|---|---|---|---|
| `ACTIVE` | Pago al día | Sí | Stripe |
| `TRIALING` | En periodo de prueba | Sí | Stripe |
| `PAST_DUE` | Pago fallido; Stripe reintentando | Sí (periodo de gracia) | Stripe |
| `CANCELED` | Cancelada; acceso vigente hasta `current_period_end` | Sí, hasta que venza | Stripe / Admin |
| `UNPAID` | Stripe dejó de reintentar; suscripción persiste sin cobrar | No | Stripe |
| `INCOMPLETE` | Pago inicial fallido (< 23 h sin resolver) | No | Stripe |
| `INCOMPLETE_EXPIRED` | `INCOMPLETE` que superó 23 h sin resolver; estado terminal | No | Stripe |
| `EXPIRED` _(deprecated)_ | Estado legacy — solo existe en registros anteriores de la DB. No se asigna a nuevas suscripciones. | No | Legacy |

> `cancel_at_period_end: true` significa que la suscripción no se renovará al terminar el periodo actual — el usuario canceló pero todavía tiene acceso.

> **Quitar suscripción desde el panel admin:** se envía `CANCELED` con `current_period_end` en el pasado (fecha de ayer en hora local), lo que revoca el acceso inmediatamente. La condición de `CANCELED` requiere `current_period_end > now`; al enviarlo en el pasado el acceso cae sin importar diferencias de zona horaria entre cliente y servidor.

---

### Suscripciones — vista admin
Devuelve la suscripción **más reciente** de cada usuario, sin filtrar por estado. Usuarios que nunca tuvieron suscripción no aparecen. Usado por el frontend en `/subscriptions`.

El frontend trata los estados sin acceso (`UNPAID`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, `EXPIRED` legacy) como "Sin suscripción" (chip neutro, plan oculto). Los demás estados se muestran con su color correspondiente.

```
GET /admin/subscriptions
Authorization: Bearer <token de admin>
```

**Response `200`:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "username": "user",
    "plan": "LITE",
    "plan_display_name": "Plan Lite",
    "billing_cycle": "MONTHLY",
    "commitment": "MONTHLY",
    "monthly_price": 299.00,
    "status": "ACTIVE",
    "current_period_start": "2026-08-13T00:00:00",
    "current_period_end": "2027-08-13T00:00:00",
    "cancel_at_period_end": false,
    "created_at": "2026-08-13T12:00:00"
  }
]
```

---

### Asignar / quitar suscripción (admin)
Crea una nueva entrada de suscripción para el usuario. Al ser la más reciente, reemplaza la vista anterior en `GET /admin/subscriptions`.

**Quitar suscripción desde el panel:** el frontend envía `status: CANCELED` con `current_period_end` en el pasado (ayer en hora local). `CANCELED` solo da acceso cuando `current_period_end > now`; usar una fecha pasada garantiza revocación inmediata sin importar diferencias de zona horaria. Esto es lo que ocurre al seleccionar "Sin suscripción" en el dialog de `/subscriptions`.

```
POST /admin/subscriptions
Authorization: Bearer <token de admin>
```
**Body:**
```json
{
  "user_id": 2,
  "plan": "PRO",
  "status": "ACTIVE",
  "current_period_start": "2026-08-01T00:00:00",
  "current_period_end": "2027-08-01T00:00:00"
}
```

> `plan`: `LITE` | `BASIC` | `PRO`
> `status`: cualquier valor del enum `SubscriptionStatus`
> Las fechas en formato ISO 8601 sin zona horaria (`yyyy-MM-ddTHH:mm:ss`).

**Response `200`:** objeto de suscripción con todos los campos.

---

## Errores comunes

| Código | Causa |
|---|---|
| `400` | Validación fallida — campos requeridos, foreign key inválida, o regla de negocio (ej: conversación coach↔coach) |
| `401` | Token ausente, expirado, inválido o cuenta suspendida — ver tabla de errores en Auth |
| `403` | Sin permisos — se requiere rol superior al actual |
| `404` | Recurso no encontrado o regla de negocio violada (ej: coach_id no es coach, token de verificación inválido) |
| `409` | Conflicto de unicidad — username o email ya registrado |
| `500` | Error interno del servidor |

**Formato de error estándar:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Descripción del error."
}
```

**Formato de error de validación (`400`):**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Errores de validación",
  "errors": {
    "username": "El nombre de usuario debe tener entre 4 y 20 caracteres.",
    "email": "Debe ser una dirección de correo electrónico válida."
  }
}
```

---

## Usuarios por defecto

| Username | Password | Rol | Notas |
|---|---|---|---|
| `admin` | `admin1234` | ROLE_ADMIN | — |
| `admin` | `admin1234` | ROLE_ADMIN | Sin suscripción (ADMIN no requiere una) |
| `user` | `user1234` | ROLE_USER | Siempre recibe suscripción LITE ACTIVE al arrancar (365 días) |
| `chirri80` | _(solo FB)_ | ROLE_USER | FB ID `28653788794222204`. Suscripción aleatoria o sin plan según el arranque |
| `rgarcia80` | _(solo Apple)_ | ROLE_USER | Apple sub `001491.…2155`. Suscripción aleatoria o sin plan según el arranque |

> El DataLoader garantiza que `user` siempre tenga una suscripción LITE ACTIVE para poder hacer login. `chirri80` y `rgarcia80` reciben un plan aleatorio (LITE / BASIC / PRO, estado también aleatorio) o ninguno — cambia en cada arranque en frío de la aplicación, útil para ver variedad en la pantalla `/subscriptions` del panel.
>
> `chirri80` y `rgarcia80` no tienen contraseña propia — solo pueden autenticarse mediante sus respectivos endpoints de social login.
