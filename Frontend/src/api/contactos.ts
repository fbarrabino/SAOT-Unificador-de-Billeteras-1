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