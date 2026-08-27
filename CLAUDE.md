# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve the dist/ build locally
npm run lint      # oxlint (not eslint)
```

There is no test suite. Copy `.env.example` to `.env` to set `VITE_API_BASE_URL`; it defaults to the production backend (`https://fitlan-production.up.railway.app/api/v1`). If `VITE_API_BASE_URL` is unset entirely, `src/config/api.js` falls back to `http://localhost:8080/api/v1`.

## What this project is

Public website for Fitlán Academy: a marketing landing plus a logged-in user area (training feed, training detail, workout steps with video, coach profiles, account/settings). React 19 + Vite SPA, `react-router-dom` v7, Bootstrap 5 CSS (no bootstrap JS — see Header note below).

This is a sibling of a React Native/Expo mobile app (`rn-starter`, referenced as `../src`). Both hit the **same backend with the same API contract**. The web app is the only place a user can **register a new account and reset a password**; the mobile app is login-only. Differences from mobile: token stored in `localStorage` (not `expo-secure-store`), routing via react-router (not React Navigation).

The full backend API contract is documented in `documentacion-backend/README.md` (2300+ lines) with a Postman collection alongside it. Consult it before touching any service.

## Architecture

**API layer — `src/services/*.js`.** Nearly 1:1 ports of the mobile app's `../src/services/`. Each service is a thin object wrapping endpoint calls. The only file that meaningfully differs from mobile is `services/api.js`.

`services/api.js` is the single choke point: one `request()` helper that injects `Authorization: Bearer <token>`, parses the response, and on **401 with an active token** clears the token and hard-redirects to `/login` unless already there (mobile resets a nav stack instead). It exports `api.get/post/put/patch/delete` plus `setToken/clearToken/getToken`. The in-memory `_token` is seeded from `localStorage` at module load. Errors are thrown as plain objects `{ status, ...body }`, not `Error` instances.

Signature quirk: `get/post/put` take `(endpoint, body?, options?)` and JSON-stringify the body, but `patch(endpoint, options)` and `delete(endpoint, options)` take **only fetch options** — no body argument, no serialization. A PATCH with a payload must pass `{ body: JSON.stringify(...) }` explicitly.

**Auth — `context/AuthContext.jsx` + `services/authService.js` + `components/ProtectedRoute.jsx`.**
- `authService` persists three `localStorage` keys on login: `fitlan_token`, `fitlan_roles`, `fitlan_user_id`.
- `authService.logout()` is deliberately **synchronous and fire-and-forget**: it dispatches `POST /auth/logout` without awaiting (headers are built with the still-valid token at call time), then immediately clears local storage. Do not add `await` here — the subsequent full-page reload would otherwise run with the stale token still present.
- `AuthContext.logout()` does `window.location.href = "/"` (a real reload, not `navigate()`) and intentionally does **not** call `setIsAuthenticated(false)` — that would make `ProtectedRoute` flash `/login` before the browser processes the reload.
- `ProtectedRoute` redirects to `/login` purely off `isAuthenticated` from context.
- Registration leaves the account `active=false` until email verification; the backend returns no token, so the user must log in after verifying.

**Routing — `src/App.jsx`.** All routes are declared here in one `<Routes>`. Paths are in Spanish (`/registro`, `/entrenamientos`, `/entrenamiento/:id`, `/entrenamiento/:trainingId/sesion/:sessionId`, `/entrenador/:id`, `/configuracion`, etc.). Public: `/`, `/login`, `/registro`, `/verificar-email`, `/olvide-password`, `/restablecer-password`, `/faqs`, `/privacidad`, `/acerca-de`, `/ayuda`. Everything else (`/entrenamientos`, `/cuenta`, `/mis-entrenamientos`, `/planes`, the training/coach detail routes) is wrapped in `<ProtectedRoute>`.

**Pages — `src/pages/`, one component per route.** Data fetching is done directly in `useEffect` with `.then/.catch`, errors logged via `console.log`, local `loading` state. No data-fetching library, no global store beyond `AuthContext`.

**Static content pages** (`Privacy`, `Help`, `Faqs`, `About`) pull their body from the backend CMS via `contentService` (`GET /content/*`, public, no token).

**Training → session → step navigation adapts to the training's shape.** `GET /training/{id}` returns `sessions[]` each with `steps[]` embedded, and `TrainingDetail` branches on that after load: **1 session / ≤1 step** → `<Navigate replace>` to `/entrenamiento/:id/sesion/:sid?reproducir=1` (the `Steps` page auto-opens the `WorkoutModal` video on the first step); **1 session / 2+ steps** → `<Navigate replace>` to the session's step list; **2+ sessions** → stay on `TrainingDetail` showing the session list (clicking a session then goes to its step list, no auto-play). `reproducir=1` is the only trigger for auto-play — entering a session any other way always shows the step list.

## Conventions specific to this repo

- **This is a port of static mockups** in `../maquetas` (HTML/PHP + Bootstrap). Most components/pages carry a header comment naming the mockup file they came from and what changed. When the mockup had hardcoded data the backend doesn't provide (e.g. star ratings on training cards), the port **omits it rather than faking data** — keep this principle.
- **Bootstrap CSS only, never bootstrap JS.** Interactive widgets (e.g. the mobile menu toggle in `components/Header.jsx`) are reimplemented with React state. Mixing `bootstrap.bundle.js`'s imperative DOM manipulation with React's virtual DOM causes desync.
- **CSS**: `src/assets/css/styles.css` is the original mockup stylesheet, copied verbatim — avoid editing it. New-screen styles (login, register, settings, my-trainings, plans, FAQs) go in `src/assets/css/app-extra.css`. Both are imported in `main.jsx` after `bootstrap.min.css`.
- **No payment/checkout flow exists.** The backend only exposes read-only `GET /subscriptions/plans` and `/subscriptions/me`. The Plans page and "request personalized training" button route to email contact — do not build a simulated payment.
- `subscriptionService.getMySubscription()` returns **404 when the user has no subscription** — that is not an error, handle it explicitly in callers. `ACTIVE_SUBSCRIPTION_STATUSES` / `hasSubscriptionAccess()` in that file define which statuses still grant content access.
- `trainingService.getTrainings()` returns a plain array normally, but a paginated `{ items, page, page_size, total_items, total_pages }` object when a `page` arg is passed.
- Some services (`notificationService` device-token registration, Facebook login in the backend docs) are ports carried over from mobile and may not be wired into any web page.
- **Shared helpers live in `src/utils/`** — `format.js` (`formatDifficulty` / `difficultyLabels` for `BEGINNER|INTERMEDIATE|ADVANCED`, `firstName`, `formatDuration` seconds→`"N min"`) and `initials.js` (`getInitials`). Reuse these rather than re-deriving label maps or name parsing per page.
- Icons come from **`react-icons`** (e.g. `react-icons/io5`); there is no local icon component set.
- `oxlint` config is `.oxlintrc.json`: `react/rules-of-hooks` is an error, `react/only-export-components` a warning (constant exports allowed). `npm run preview` needs a prior `npm run build`.
