import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import notificationService from "../services/notificationService";

// Equivalente web de los switches de notificaciones que agregamos en
// ProfileScreen.jsx (app móvil) — mismo endpoint (GET/PUT
// /users/me/notification-preferences).
const groups = [
  { key: "actividad_enabled", label: "Actividad" },
  { key: "novedades_enabled", label: "Novedades" },
  { key: "cuenta_enabled", label: "Cuenta" },
];

const Settings = () => {
  const [preferences, setPreferences] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    notificationService.getPreferences()
      .then(setPreferences)
      .catch((error) => console.log("No se pudieron cargar las preferencias", error));
  }, []);

  const handleToggle = (key) => {
    if (!preferences || saving) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(key);
    notificationService.updatePreferences(next)
      .catch((error) => {
        console.log("No se pudo actualizar la preferencia", error);
        setPreferences(preferences);
      })
      .finally(() => setSaving(null));
  };

  return (
    <div>
      <Header />
      <main>
        <div className="container">
          <h1>Configuración</h1>
          <h3>Notificaciones</h3>
          {preferences ? (
            <div className="settings-list">
              {groups.map((group) => (
                <label key={group.key} className="settings-row">
                  <span>{group.label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[group.key]}
                    disabled={saving === group.key}
                    onChange={() => handleToggle(group.key)}
                  />
                </label>
              ))}
            </div>
          ) : (
            <p>Cargando...</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
