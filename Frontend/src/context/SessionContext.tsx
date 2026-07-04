/**
 * SessionContext.tsx — Estado global de autenticación
 *
 * Provee a toda la app:
 *  - usuario: datos del usuario logueado (o null si no está autenticado)
 *  - isAuthenticated: booleano derivado de usuario !== null
 *  - isLoading: true mientras se espera respuesta del login
 *  - error: mensaje de error legible para mostrar al usuario
 *  - login(email, password): inicia sesión, actualiza estado
 *  - logout(): borra sesión
 *  - clearError(): limpia el error (útil al editar los campos del formulario)
 *  - actualizarUsuario(usuario): reemplaza el usuario en memoria (D4/FE-Perfil,
 *    tras un PUT o POST /foto exitoso, sin necesidad de volver a loguearse)
 *
 * Uso:
 *   // En _layout.tsx:
 *   <SessionProvider><App /></SessionProvider>
 *
 *   // En cualquier pantalla:
 *   const { login, isLoading, error } = useSession();
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  type UsuarioResponse,
} from '@/api/auth';
import { ApiError } from '@/api/client';

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface SessionState {
  usuario: UsuarioResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  actualizarUsuario: (usuario: UsuarioResponse) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await apiLogin(email, password);
      setUsuario(user);
      // No navegamos desde acá: el componente reacciona a isAuthenticated
    } catch (err) {
      // Traducimos los ApiError a mensajes amigables según el código HTTP
      let mensaje: string;

      if (err instanceof ApiError) {
        switch (err.status) {
          case 0:
            mensaje =
              'Sin conexión al servidor. Verificá tu red o que el backend esté activo.';
            break;
          case 400:
            mensaje = err.mensaje || 'Datos inválidos. Revisá el email y la contraseña.';
            break;
          case 401:
            mensaje = 'Email o contraseña incorrectos.';
            break;
          case 403:
            mensaje = 'No tenés permiso para acceder.';
            break;
          case 422:
            mensaje = 'Los datos enviados no son válidos.';
            break;
          case 500:
          case 502:
          case 503:
            mensaje = 'El servidor tuvo un problema interno. Intentá más tarde.';
            break;
          default:
            mensaje = err.mensaje || `Error inesperado (${err.status}).`;
        }
      } else if (err instanceof Error) {
        mensaje = err.message;
      } else {
        mensaje = 'Ocurrió un error desconocido al iniciar sesión.';
      }

      setError(mensaje);
      // Re-lanzamos para que el componente sepa que el login falló
      // (ej: para no navegar ni limpiar el formulario)
      throw new Error(mensaje);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUsuario(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const actualizarUsuario = useCallback((nuevoUsuario: UsuarioResponse) => {
    setUsuario(nuevoUsuario);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        usuario,
        isAuthenticated: usuario !== null,
        isLoading,
        error,
        login,
        logout,
        clearError,
        actualizarUsuario,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession() debe usarse dentro de <SessionProvider>.');
  }
  return ctx;
}