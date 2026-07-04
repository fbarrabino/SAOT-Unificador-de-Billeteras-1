/**
 * contactos.ts — Cliente de contactos (C1-BE / C1-FE)
 * * Endpoints:
 * GET /api/contactos/me
 * POST /api/contactos
 */

import { api } from './client';

export interface BackendContact {
    usuarioContactoId: number;
    nombre: string;
    email: string;
    cuentaDestinoId: number;
}

export const getMisContactos = () =>
    api.get<BackendContact[]>('/api/contactos/me');