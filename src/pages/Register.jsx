import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import logoWhite from "../assets/img/fitlan-white.svg";

// POST /auth/register (ver README backend) — la cuenta queda con active=false
// hasta verificar el email, no devuelve token. A diferencia de la app móvil
// (solo login), el registro vive únicamente acá.
const Register = () => {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.username || !form.email || !form.password) {
      setError("Completá todos los campos");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.register(form.username, form.password, form.email, form.name);
      setDone(true);
    } catch (err) {
      setError(err.message || "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/entrenamientos" replace />;

  if (done) {
    return (
      <div className="bg-landing auth-screen">
        <div className="container">
          <div className="col-12 col-md-4 mx-auto text-center">
            <img src={logoWhite} className="logo" alt="Fitlan Academy" />
            <h1>Revisá tu email</h1>
            <p>Te mandamos un link para activar tu cuenta. Una vez que lo confirmes, ya podés iniciar sesión.</p>
            <Link to="/login" className="btn btn-primary btn-sesion">Ir a iniciar sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-landing dark auth-screen">
      <div className="container">
        <div className="col-12 col-md-4 mx-auto text-center">
          <img src={logoWhite} className="logo" alt="Fitlan Academy" />

          <form onSubmit={handleSubmit} className="auth-form">
            <input className="form-control" type="text" placeholder="Nombre" value={form.name} onChange={handleChange("name")} />
            <input className="form-control" type="text" placeholder="Usuario" autoCapitalize="none" value={form.username} onChange={handleChange("username")} />
            <input className="form-control" type="email" placeholder="Correo" autoCapitalize="none" value={form.email} onChange={handleChange("email")} />
            <input className="form-control" type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={form.password} onChange={handleChange("password")} />

            {error ? <div className="alert-box"><p>{error}</p></div> : null}

            <button className="btn btn-primary btn-sesion" type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
