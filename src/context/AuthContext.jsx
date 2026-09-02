import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "../services/authService";
import subscriptionService, { hasSubscriptionAccess } from "../services/subscriptionService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  // null = todavía no sabemos (esperando /subscriptions/me); true/false = resuelto.
  // Separa "estar logueado" de "tener acceso al contenido": sin suscripción con
  // acceso, SubscriptionRoute manda a /planes, pero /cuenta y /planes siguen
  // accesibles.
  const [hasSubscription, setHasSubscription] = useState(null);

  // Devuelve el booleano de acceso además de setearlo en el estado, para que
  // el caller (p. ej. Login) pueda decidir a dónde navegar sin esperar al render.
  const refreshSubscription = useCallback(async () => {
    setHasSubscription(null);
    try {
      const data = await subscriptionService.getMySubscription();
      const access = hasSubscriptionAccess(data);
      setHasSubscription(access);
      return access;
    } catch (error) {
      // 404 = sin suscripción (o la más reciente no da acceso) — no es un error.
      if (error.status !== 404) console.log("No se pudo verificar la suscripción", error);
      setHasSubscription(false);
      return false;
    }
  }, []);

  const login = useCallback(async (identifier, password) => {
    await authService.login(identifier, password);
    setIsAuthenticated(true);
    return refreshSubscription();
  }, [refreshSubscription]);

  // Al montar la app con una sesión ya guardada (reload de página), verificar la
  // suscripción. Tras un login nuevo lo hace login() directamente.
  useEffect(() => {
    if (authService.isAuthenticated()) refreshSubscription();
  }, [refreshSubscription]);

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
    <AuthContext.Provider
      value={{ isAuthenticated, hasSubscription, refreshSubscription, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
