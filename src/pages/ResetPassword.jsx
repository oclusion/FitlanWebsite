import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            <Link to="/"><img src={logoWhite} className="logo" alt="Fitlan Academy" /></Link>
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
            <Link to="/"><img src={logoWhite} className="logo" alt="Fitlan Academy" /></Link>
            <h1>Contraseña restablecida</h1>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
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
          <Link to="/"><img src={logoWhite} className="logo" alt="Fitlan Academy" /></Link>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="password-field">
              <input
                className="form-control"
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
            <div className="password-field">
              <input
                className="form-control"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>

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
