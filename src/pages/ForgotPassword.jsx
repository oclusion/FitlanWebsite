import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import logoWhite from "../assets/img/fitlan-white.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      // Siempre responde 200 aunque el email no exista (ver README backend) —
      // no hay nada que distinguir en el error, solo mostramos el mismo mensaje.
      await authService.forgotPassword(email);
    } catch (error) {
      console.log("Error al pedir recuperación de contraseña", error);
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-landing auth-screen">
      <div className="container">
        <div className="col-12 col-md-4 mx-auto text-center">
          <img src={logoWhite} className="logo" alt="Fitlan Academy" />

          {sent ? (
            <>
              <h1>Revisá tu email</h1>
              <p>Si el correo existe, te llegó un link para restablecer tu contraseña (válido por 1 hora).</p>
              <Link to="/login" className="btn btn-primary btn-sesion">Volver a iniciar sesión</Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <p>Ingresá tu email y te mandamos un link para restablecer tu contraseña.</p>
              <input
                className="form-control"
                type="email"
                placeholder="Correo"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn-primary btn-sesion" type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link to="/login">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
