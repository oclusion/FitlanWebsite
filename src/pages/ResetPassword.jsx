import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import logoWhite from "../assets/img/fitlan-white.svg";

// POST /auth/reset-password { token, new_password } — el README backend marcaba
// esta página como "pendiente de implementar" del lado del sitio, así que este es
// el primer frontend real para ese flujo.
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.status === 404 ? "Este link ya se usó, expiró, o no es válido." : (err.message || "No se pudo restablecer la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-landing auth-screen">
        <div className="container">
          <div className="col-12 col-md-4 mx-auto text-center">
            <img src={logoWhite} className="logo" alt="Fitlan Academy" />
            <h1>Link inválido</h1>
            <p>Falta el token de recuperación en el link.</p>
            <Link to="/olvide-password" className="btn btn-primary btn-sesion">Pedir uno nuevo</Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-landing dark auth-screen">
        <div className="container">
          <div className="col-12 col-md-4 mx-auto text-center">
            <img src={logoWhite} className="logo" alt="Fitlan Academy" />
            <h1>Contraseña restablecida</h1>
            <p>Ya podés iniciar sesión con tu nueva contraseña.</p>
            <button className="btn btn-primary btn-sesion" type="button" onClick={() => navigate("/login")}>
              Iniciar sesión
            </button>
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
            <input
              className="form-control"
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="form-control"
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error ? <div className="alert-box"><p>{error}</p></div> : null}

            <button className="btn btn-primary btn-sesion" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
