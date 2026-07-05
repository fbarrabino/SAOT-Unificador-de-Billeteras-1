/**
 * usuarios.ts — Servicio de perfil de usuario (B7)
 *
 * Endpoints:
 *   GET  /api/usuarios/me       → perfil del usuario autenticado
 *   PUT  /api/usuarios/me       → actualiza Nombre, Apellido, Email, Pais, Telefono
 *   POST /api/usuarios/me/foto  → sube la foto de perfil (base64)
 */
import { api, BASE_URL } from './client';
import type { UsuarioResponse } from './auth';

export interface ActualizarPerfilRequest {
    nombre: string;
    apellido: string;
    email: string;
    pais: string | null;
    telefono: string | null;
}

export async function obtenerPerfil(): Promise<UsuarioResponse> {
    return api.get<UsuarioResponse>('/api/usuarios/me');
}

export async function actualizarPerfil(req: ActualizarPerfilRequest): Promise<UsuarioResponse> {
    return api.put<UsuarioResponse>('/api/usuarios/me', req);
}

/**
 * D4 — Sube la foto de perfil. Acepta el base64 puro que devuelve
 * expo-image-picker (result.assets[0].base64), sin el prefijo data URI.
 */
export async function subirFotoPerfil(imagenBase64: string): Promise<UsuarioResponse> {
    return api.post<UsuarioResponse>('/api/usuarios/me/foto', { imagenBase64 });
}

/** Arma la URL completa para mostrar la foto con <Image source={{ uri }} />. */
export function urlFotoPerfil(fotoPerfilUrl: string | null): string | null {
    if (!fotoPerfilUrl) return null;
    return `${BASE_URL}${fotoPerfilUrl}`;
}