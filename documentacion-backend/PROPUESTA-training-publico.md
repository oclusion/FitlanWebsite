# Propuesta backend: endpoint público de training (para compartir)

**Estado:** 📝 Propuesta — necesita implementación en backend antes de que la página pública del sitio funcione con datos reales.

---

## Contexto

Necesitamos que un usuario pueda compartir un entrenamiento (o su actividad) y que quien reciba el link vea una página pública con la info del entrenamiento — sin necesidad de cuenta — pero **sin acceso a los videos**. El objetivo es conversión: mostrar de qué se trata y ofrecer un botón para registrarse.

Hoy `GET /training/{id}` requiere rol `USER`/`ADMIN` (token) y devuelve `sessions[].steps[]` completos, incluido `video_url`/`video_key`. No sirve para esto tal cual — no es público y expone los videos.

## Cambio pedido

Un endpoint **público** (sin `Authorization`) que devuelva una versión recortada de un training:

```
GET /public/training/{id}
```

**Reglas:**
- Sin token, como `/content/*` o `/subscriptions/plans` (ver README, ambos ya públicos).
- Si el training no existe o `publish_status != PUBLISHED` → `404` (no filtrar borradores).
- **Nunca** incluir `video_url` ni `video_key` en ningún nivel (ni del training ni de steps) — ese es el punto de este endpoint.
- El resto de los campos públicos del training normal sí sirven tal cual.

**Response `200` (forma sugerida):**
```json
{
  "id": 1,
  "title": "Yoga Vinyasa Nivel 1",
  "description": "Entrenamiento de flujo dinámico para principiantes.",
  "image_url": "https://...",
  "image_key": "uploads/...",
  "image_landscape_url": "https://...",
  "image_landscape_key": "uploads/...",
  "difficulty_level": "BEGINNER",
  "premium": false,
  "categories": [{ "id": 2, "name": "Yoga" }],
  "coach": {
    "id": 5,
    "name": "Juan Pérez",
    "profile_image_url": "https://...",
    "profile_image_key": "uploads/..."
  },
  "sessions": [
    {
      "id": 1,
      "title": "Vinyasa 1",
      "duration_seconds": 1440,
      "steps": [
        { "id": 1, "title": "Saludo al sol", "duration_seconds": 900 }
      ]
    }
  ]
}
```

> Cada `step` solo trae `id`, `title`, `duration_seconds` — sin `video_url`/`video_key`/`description`/`exercises`, para no exponer contenido premium en una página sin login.

## Para qué lo usa el sitio

1. **Server-side (Node, en el propio deploy del website, no en el backend):** cuando un bot de vista previa de redes (WhatsApp, Facebook, Twitter, etc.) pide `/entrenamiento-publico/{id}`, el servidor del sitio llama a este endpoint para armar los meta tags (`og:title`, `og:image` con la portada landscape, `og:description`) antes de responderle al bot. Los bots no ejecutan JavaScript, por eso esto no se puede resolver solo con React.
2. **Cliente (React):** la página pública `/entrenamiento-publico/{id}` también usa este mismo endpoint para mostrarle al visitante humano la info del entrenamiento + botón "Quiero empezar este entrenamiento" → `/registro`.

## Casos borde a confirmar

1. **Training `premium`**: ¿se muestra igual en la página pública (solo como dato informativo, ya que no hay video ahí de todos modos) o se oculta directamente? Por ahora el frontend lo va a mostrar como dato — avisar si backend prefiere no exponerlo sin login.
2. **Rate limiting**: al ser público y sin auth, es más expuesto a scraping/abuso que el resto de la API — si ya hay rate limiting general, confirmar que aplica acá también.
