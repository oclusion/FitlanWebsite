import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoWhite from "../assets/img/fitlan-white.svg";

// Mismos mensajes de error de negocio que maneja LoginScreen.jsx en la app móvil
// (ver README backend) — acá con más sentido todavía, ya que este sitio SÍ permite
// registrarse y activar suscripción, así que los CTA llevan a esas páginas propias
// en vez de a un link externo.
//
// Tras verificar el email, el backend redirige a /login?verified=true (o
// ?verified=error si el link ya se usó / expiró); acá se muestra el aviso.
const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verified = searchParams.get("verified");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier || !password) {
      setError({ message: "Ingresa usuario y contraseña" });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // login() devuelve si la cuenta tiene una suscripción con acceso. Sin ella
      // (cuenta nueva recién verificada) se entra directo a /planes a elegir uno.
      const hasSubscription = await login(identifier, password);
      navigate(hasSubscription ? "/entrenamientos" : "/planes");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => {
    if (!error) return null;
    const message = error.message || "";

    if (message.startsWith("No tienes una cuenta activa")) {
      return (
        <div className="alert-box">
          <p>Todavía no tienes una cuenta activa. Regístrate para poder entrar.</p>
          <Link to="/registro">Crear cuenta</Link>
        </div>
      );
    }
    if (message.startsWith("No tienes una suscripción activa")) {
      return (
        <div className="alert-box">
          <p>Tu suscripción no está activa.</p>
          <Link to="/planes">Ver planes</Link>
        </div>
      );
    }
    return <div className="alert-box"><p>{message || "Credenciales inválidas"}</p></div>;
  };

  if (isAuthenticated) return <Navigate to="/entrenamientos" replace />;

  return (
    <div className="bg-landing auth-screen">
      <div className="container">
        <div className="col-12 col-md-4 mx-auto text-center">
          <Link to="/"><img src={logoWhite} className="logo" alt="Fitlan Academy" /></Link>

          {verified === "true" ? (
            <div className="alert-box alert-box--success">
              <p>¡Cuenta verificada! Ya puedes iniciar sesión.</p>
            </div>
          ) : null}
          {verified === "error" ? (
            <div className="alert-box">
              <p>El enlace de verificación es inválido o ya fue usado.</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="form-control"
              type="text"
              placeholder="Usuario o correo"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoCapitalize="none"
            />
            <input
              className="form-control"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {renderError()}

            <Link to="/olvide-password" className="forgot-link">Olvidé mi contraseña</Link>

            <button className="btn btn-primary btn-sesion" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
