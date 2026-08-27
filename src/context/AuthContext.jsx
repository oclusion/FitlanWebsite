import { createContext, useContext, useState, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const login = useCallback(async (identifier, password) => {
    await authService.login(identifier, password);
    setIsAuthenticated(true);
  }, []);

  // Sincrónico de punta a punta (authService.logout() también lo es), y el
  // reload a "/" vive acá adentro en vez de en cada caller — así cualquier
  // pantalla que llame logout() se comporta igual sin tener que acordarse de
  // nada. Tiene que ser reload real (window.location, no navigate() de
  // react-router): ProtectedRoute reacciona a isAuthenticated y redirige a
  // /login apenas se pone en false, así que hay que salirse de React del todo
  // para que no se cruce con eso. A propósito NO se llama setIsAuthenticated(false)
  // acá: ya vamos a recargar la página entera, así que ese setState no sirve para
  // nada más que disparar un re-render de más (ProtectedRoute alcanza a mostrar
  // un flash de /login un instante antes de que el navegador procese el reload).
  // authService.isAuthenticated() ya va a leer el localStorage limpio en el
  // próximo arranque de la app.
  const logout = useCallback(() => {
    authService.logout();
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
