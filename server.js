// Servidor de producción del sitio (reemplaza el `serve -s dist` estático
// puro). Necesario para que los bots de vista previa de redes (WhatsApp,
// Facebook, Twitter, etc.) vean meta tags específicos de cada entrenamiento
// al compartir un link a /entrenamiento-publico/:id — esos bots no ejecutan
// JavaScript, así que un SPA puro siempre les muestra el <title>/og:* genérico
// de index.html, nunca el del training. Ver
// documentacion-backend/PROPUESTA-training-publico.md para el endpoint
// público que esto necesita del lado del backend.
//
// Para cualquier otro visitante (humano o bot no reconocido) el
// comportamiento es idéntico al `serve` de antes: archivos estáticos +
// fallback a index.html para que el ruteo de react-router siga funcionando.
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

// .env solo tiene VITE_API_BASE_URL (se versiona a propósito, ver .env) — no
// vale la pena sumar la dependencia `dotenv` por una sola variable.
const readDotEnv = (key) => {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
    const line = envFile.split("\n").find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.split("=").slice(1).join("=").trim() : undefined;
  } catch {
    return undefined;
  }
};

const API_BASE_URL = process.env.VITE_API_BASE_URL || readDotEnv("VITE_API_BASE_URL") || "http://localhost:8080/api/v1";
const PORT = process.env.PORT || 8080;
const SITE_URL = process.env.SITE_URL || "https://fitlanacademy.com";

const indexHtmlTemplate = fs.readFileSync(indexHtmlPath, "utf-8");

// Bots conocidos que arman vista previa de links — ninguno ejecuta JS.
const BOT_USER_AGENT =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|TelegramBot|LinkedInBot|Discordbot|SkypeUriPreview|Pinterest|redditbot|Applebot|vkShare|W3C_Validator/i;

const escapeHtml = (str = "") =>
  String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Reconstruye el tag completo (no un replace parcial del content) — así no
// importa el orden/formato exacto de sus atributos en el index.html fuente.
const setMetaByProperty = (html, property, content) =>
  html.replace(new RegExp(`<meta property="${property}"[^>]*>`), `<meta property="${property}" content="${escapeHtml(content)}">`);
const setMetaByName = (html, name, content) =>
  html.replace(new RegExp(`<meta name="${name}"[^>]*>`), `<meta name="${name}" content="${escapeHtml(content)}">`);
const dropMetaByProperty = (html, property) =>
  html.replace(new RegExp(`\\s*<meta property="${property}"[^>]*>\\n`), "\n");

// Arma el HTML que ve el bot: mismo index.html, con el título y los meta
// og:*/twitter:* del training en vez de los genéricos del sitio.
const buildTrainingMetaHtml = (training, pageUrl) => {
  const image = training.image_landscape_url || training.image_url || `${SITE_URL}/apple-touch-icon.png`;
  const title = `${training.title} | Fitlán Academy`;
  const description = training.description || "Entrena diferente con Fitlán Academy.";

  let html = indexHtmlTemplate;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  html = setMetaByProperty(html, "og:title", title);
  html = setMetaByProperty(html, "og:description", description);
  html = setMetaByProperty(html, "og:url", pageUrl);
  html = setMetaByProperty(html, "og:image", image);
  // No conocemos las dimensiones reales de la imagen del training (a
  // diferencia del og:image genérico, que sí es siempre el mismo 1200x630) —
  // mejor omitirlas que mentirle al bot.
  html = dropMetaByProperty(html, "og:image:width");
  html = dropMetaByProperty(html, "og:image:height");
  html = setMetaByName(html, "twitter:title", title);
  html = setMetaByName(html, "twitter:description", description);
  html = setMetaByName(html, "twitter:image", image);
  return html;
};

const app = express();

app.get("/entrenamiento-publico/:id", async (req, res, next) => {
  const userAgent = req.get("user-agent") || "";
  if (!BOT_USER_AGENT.test(userAgent)) return next(); // visitante real → SPA normal, React arma la página

  try {
    const apiRes = await fetch(`${API_BASE_URL}/public/training/${encodeURIComponent(req.params.id)}`);
    if (!apiRes.ok) return next(); // sin datos del training → que caiga al index.html genérico
    const training = await apiRes.json();
    const pageUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    res.set("Content-Type", "text/html").send(buildTrainingMetaHtml(training, pageUrl));
  } catch (error) {
    console.log("No se pudo armar el HTML con meta tags para el bot", error);
    next();
  }
});

app.use(express.static(distDir, { index: false }));

// SPA fallback: cualquier ruta que no matcheó un archivo estático ni la ruta
// de arriba devuelve index.html — react-router toma el control del lado del
// cliente (mismo comportamiento que `serve -s`). Middleware sin path (no
// "*"/"/*splat") a propósito: Express 5 exige nombrar los wildcards y esto
// evita depender de esa sintaxis para un catch-all tan simple.
app.use((_req, res) => {
  res.sendFile(indexHtmlPath);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en :${PORT} (API: ${API_BASE_URL})`);
});
