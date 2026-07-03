/**
 * sesiones.ts — Servicio de sesiones / dispositivos conectados (D7)
 *
 * Endpoints:
 *   GET  /api/usuarios/me/sesiones               → sesiones activas del usuario
 *   POST /api/usuarios/me/sesiones/{id}/revocar   → cierra una sesión propia
 */

import { api } from './client';

export interface SesionResponse {
  sesionId: number;
  dispositivoNombre: string | null;
  ipUltimoLogin: string | null;
  fechaCreacion: string;
  ultimaActividad: string;
  esSesionActual: boolean;
}

export async function fetchSesiones(): Promise<SesionResponse[]> {
  return api.get<SesionResponse[]>('/api/usuarios/me/sesiones');
}

export async function revocarSesion(sesionId: number): Promise<{ mensaje: string }> {
  return api.post<{ mensaje: string }>(`/api/usuarios/me/sesiones/${sesionId}/revocar`, {});
}
