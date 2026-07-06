/**
 * contactos.ts — Cliente de contactos (C1-BE / C1-FE)
 * * Endpoints:
 * GET /api/contactos/me
 * POST /api/contactos
 */

import { api } from './client';

// Contacto tal como lo devuelve el backend (incluye la cuenta destino para enviarle plata).
export interface BackendContact {
    usuarioContactoId: number;
    nombre: string;
    email: string;
    cuentaDestinoId: number;
}

// Trae la agenda de contactos del usuario autenticado.
export const getMisContactos = () =>
    api.get<BackendContact[]>('/api/contactos/me');

// Contacto del teléfono que resultó ser usuario registrado de la app.
export interface MatchContact {
    usuarioId: number;
    nombre: string;
    email: string;
}

// Cruza los emails y/o teléfonos de la agenda con los usuarios registrados.
// El backend no persiste la lista; solo devuelve las coincidencias.
export const matchContactos = (emails: string[], telefonos: string[] = []) =>
    api.post<MatchContact[]>('/api/contactos/match', { emails, telefonos });

// Agrega un usuario a la agenda de contactos del usuario autenticado.
export const agregarContacto = (usuarioContactoId: number, aliasPersonalizado?: string) =>
    api.post('/api/contactos', { usuarioContactoId, aliasPersonalizado });