import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import logoWhite from "../assets/img/fitlan-white.svg";

// GET /auth/verify-email?token=<uuid> (ver README backend) — link que llega por
// email después de /auth/register.
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    authService.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="bg-landing auth-screen">
      <div className="container">
        <div className="col-12 col-md-4 mx-auto text-center">
          <img src={logoWhite} className="logo" alt="Fitlan Academy" />

          {status === "loading" && <p>Verificando tu cuenta...</p>}

          {status === "success" && (
            <>
              <h1>Cuenta verificada</h1>
              <p>Ya podés iniciar sesión.</p>
              <Link to="/login" className="btn btn-primary btn-sesion">Iniciar sesión</Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1>Link inválido</h1>
              <p>Este link ya se usó, expiró, o no es válido.</p>
              <Link to="/registro" className="btn btn-primary btn-sesion">Volver a registrarme</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
