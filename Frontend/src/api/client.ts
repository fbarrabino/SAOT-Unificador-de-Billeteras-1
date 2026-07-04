/**
 * client.ts — Cliente HTTP base de SaOT
 *
 * Centraliza TODAS las peticiones al backend:
 *  - Adjunta el token JWT en cada request autenticado
 *  - Tipifica los errores con ApiError (status + mensaje legible)
 *  - Distingue error de red (sin conexión) de error del servidor
 *
 * URL base: http://localhost:5001 (launchSettings.json del backend)
 * En producción cambiar BASE_URL por la URL del servidor real.
 */

// Para probar desde el celular vía Expo Go necesitamos la IP LAN, no localhost.
// Cambiar a 'http://localhost:5001' si volvés a desarrollar solo en web.
export const BASE_URL = 'http://localhost:5001';
// ─── Token en memoria ─────────────────────────────────────────────────────────
// En producción migrar a expo-secure-store para que persista entre sesiones.
let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

// ─── Tipo de error tipado ─────────────────────────────────────────────────────

/**
 * Error que lanza el cliente cuando la respuesta no es exitosa.
 *  - status 0   → sin conexión / backend caído
 *  - status 4xx → error del cliente (credenciales, datos, etc.)
 *  - status 5xx → error del servidor
 */
export class ApiError extends Error {
  constructor(
    /** Código HTTP de la respuesta. 0 si fue un error de red. */
    public readonly status: number,
    /** Mensaje legible para mostrar al usuario. */
    public readonly mensaje: string,
    /** Cuerpo raw de la respuesta (útil para debugging). */
    public readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  requiresAuth = true,
): Promise<T> {
  // 1. Armar headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (requiresAuth) {
    if (!_token) {
      throw new ApiError(
        401,
        'No hay sesión activa. Iniciá sesión nuevamente.',
      );
    }
    headers['Authorization'] = `Bearer ${_token}`;
  }

  // 2. Ejecutar fetch con manejo de error de red
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // El fetch en sí falló: sin internet, backend caído, timeout, CORS, etc.
    const mensaje =
      networkError instanceof TypeError
        ? 'No se pudo conectar con el servidor. Verificá tu conexión a internet o que el backend esté corriendo.'
        : 'Error de red inesperado al contactar el servidor.';

    throw new ApiError(0, mensaje, networkError);
  }

  // 3. Parsear cuerpo de la respuesta
  // Intentamos JSON siempre; si falla (204 No Content, etc.) usamos null.
  let data: unknown = null;
  try {
    const text = await response.text();
    if (text.length > 0) {
      data = JSON.parse(text);
    }
  } catch {
    // Respuesta no es JSON válido — dejamos data en null
    data = null;
  }

  // 4. Respuesta con error HTTP
  if (!response.ok) {
    // El backend de SaOT devuelve { mensaje: string } en los errores
    let mensaje = `Error ${response.status}: ${response.statusText}`;

    if (
      typeof data === 'object' &&
      data !== null &&
      'mensaje' in data &&
      typeof (data as { mensaje: unknown }).mensaje === 'string'
    ) {
      mensaje = (data as { mensaje: string }).mensaje;
    }

    throw new ApiError(response.status, mensaje, data);
  }

  return data as T;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Métodos HTTP tipados. Usar `auth = false` solo para endpoints públicos. */
export const api = {
  get: <T>(path: string, auth = true) =>
    request<T>('GET', path, undefined, auth),

  post: <T>(path: string, body: unknown, auth = true) =>
    request<T>('POST', path, body, auth),

  put: <T>(path: string, body: unknown, auth = true) =>
    request<T>('PUT', path, body, auth),

  delete: <T>(path: string, auth = true) =>
    request<T>('DELETE', path, undefined, auth),
};