/**
 * auth.ts — Servicio de autenticación
 *
 * Cubre:
 *  - POST /api/auth/login   → recibe JWT, lo guarda en memoria
 *  - POST /api/auth/register → crea un usuario nuevo
 *  - GET  /api/auth/me      → valida y devuelve el usuario actual
 *  - logout                 → borra el token de memoria
 */

import { Platform } from 'react-native';
import { api, setToken, getToken, ApiError } from './client';

// D7: nombre de dispositivo que mandamos en el login para identificar la
// sesión en "Dispositivos conectados". Simple a propósito (no hay librería
// de device-info en el proyecto todavía).
function nombreDispositivoActual(): string {
  switch (Platform.OS) {
    case 'ios':
      return 'iPhone · App';
    case 'android':
      return 'Android · App';
    case 'web':
      return 'Navegador web';
    default:
      return `${Platform.OS} · App`;
  }
}

// ─── Tipos que devuelve el backend ────────────────────────────────────────────

export interface UsuarioResponse {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  fechaAlta: string;
}

interface LoginResponse {
  token: string;
  expiresAt: string;
  usuario: UsuarioResponse;
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Autentica el usuario y guarda el JWT en memoria.
 * Lanza ApiError con mensaje legible si:
 *   - El email o contraseña están vacíos (validación local)
 *   - Las credenciales son incorrectas (401 del backend)
 *   - El backend no responde (status 0)
 */
export async function login(
  email: string,
  password: string,
): Promise<UsuarioResponse> {
  // Validación local antes de hacer el request
  if (!email.trim()) {
    throw new ApiError(400, 'El email es obligatorio.');
  }
  if (!password.trim()) {
    throw new ApiError(400, 'La contraseña es obligatoria.');
  }

  try {
    const data = await api.post<LoginResponse>(
      '/api/auth/login',
      { email: email.trim().toLowerCase(), password, dispositivoNombre: nombreDispositivoActual() },
      false, // endpoint público
    );

    setToken(data.token);
    return data.usuario;
  } catch (err) {
    // Re-lanzamos para que el contexto/componente los maneje
    // pero podemos enriquecer el mensaje antes
    if (err instanceof ApiError && err.status === 401) {
      throw new ApiError(401, 'Email o contraseña incorrectos.');
    }
    throw err;
  }
}

/**
 * POST /api/auth/register
 *
 * Registra un usuario nuevo. No inicia sesión automáticamente.
 * Lanza ApiError si el email ya está en uso (400 del backend).
 */
export async function register(
  nombre: string,
  apellido: string,
  email: string,
  password: string,
): Promise<UsuarioResponse> {
  if (!nombre.trim()) throw new ApiError(400, 'El nombre es obligatorio.');
  if (!apellido.trim()) throw new ApiError(400, 'El apellido es obligatorio.');
  if (!email.trim()) throw new ApiError(400, 'El email es obligatorio.');
  if (password.length < 6) {
    throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres.');
  }

  return api.post<UsuarioResponse>(
    '/api/auth/register',
    { nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim().toLowerCase(), password },
    false,
  );
}

/**
 * GET /api/auth/me
 *
 * Verifica que el token actual sea válido y devuelve los datos del usuario.
 * Útil al volver a abrir la app (cuando tengamos persistencia con SecureStore).
 */
export async function me(): Promise<UsuarioResponse> {
  return api.get<UsuarioResponse>('/api/auth/me');
}

/**
 * POST /api/auth/forgot-password
 *
 * Pide un código de 6 dígitos para resetear la contraseña. El backend nunca
 * revela si el email existe: siempre responde 200 salvo que haya throttle
 * (60s entre reenvíos), en cuyo caso lanza ApiError(429, ...).
 */
export async function forgotPassword(email: string): Promise<{ mensaje: string }> {
  if (!email.trim()) {
    throw new ApiError(400, 'El email es obligatorio.');
  }

  return api.post<{ mensaje: string }>(
    '/api/auth/forgot-password',
    { email: email.trim().toLowerCase() },
    false,
  );
}

/**
 * POST /api/auth/reset-password
 *
 * Valida el código de 6 dígitos y, si es válido, actualiza la contraseña.
 * Lanza ApiError(400, ...) si el código es inválido o expiró.
 */
export async function resetPassword(
  email: string,
  codigo: string,
  nuevaPassword: string,
): Promise<{ mensaje: string }> {
  if (codigo.length !== 6) {
    throw new ApiError(400, 'El código debe tener 6 dígitos.');
  }
  if (nuevaPassword.length < 6) {
    throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres.');
  }

  return api.post<{ mensaje: string }>(
    '/api/auth/reset-password',
    { email: email.trim().toLowerCase(), codigo, nuevaPassword },
    false,
  );
}

/**
 * Cierra la sesión local borrando el token de memoria.
 * No hay endpoint de logout en el backend (el JWT simplemente expira).
 */
export function logout(): void {
  setToken(null);
}

/**
 * POST /api/auth/verify-email
 *
 * Valida el código de 6 dígitos enviado al registrarse.
 * Lanza ApiError(400, ...) si el código es inválido o expiró.
 */
export async function verifyEmail(email: string, codigo: string): Promise<{ mensaje: string }> {
  if (codigo.length !== 6) {
    throw new ApiError(400, 'El código debe tener 6 dígitos.');
  }

  return api.post<{ mensaje: string }>(
    '/api/auth/verify-email',
    { email: email.trim().toLowerCase(), codigo },
    false,
  );
}

/**
 * POST /api/auth/resend-verification-email
 *
 * Reenvía el código de verificación de email. Mismo throttle de 60s que
 * forgot-password; lanza ApiError(429, ...) si se pide antes de tiempo.
 */
export async function resendVerificationEmail(email: string): Promise<{ mensaje: string }> {
  return api.post<{ mensaje: string }>(
    '/api/auth/resend-verification-email',
    { email: email.trim().toLowerCase() },
    false,
  );
}

/**
 * POST /api/auth/change-password
 *
 * Requiere sesión activa. Cambia la contraseña verificando la actual (BCrypt).
 * Lanza ApiError(400, ...) si la contraseña actual es incorrecta.
 */
export async function changePassword(
  passwordActual: string,
  passwordNueva: string,
): Promise<{ mensaje: string }> {
  if (!passwordActual) {
    throw new ApiError(400, 'Ingresá tu contraseña actual.');
  }
  if (passwordNueva.length < 6) {
    throw new ApiError(400, 'La nueva contraseña debe tener al menos 6 caracteres.');
  }

  return api.post<{ mensaje: string }>('/api/auth/change-password', {
    passwordActual,
    passwordNueva,
  });
}

// Re-exportamos para no tener que importar desde 'client' en los contextos
export { getToken };
