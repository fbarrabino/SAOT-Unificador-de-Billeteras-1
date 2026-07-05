/**
 * metodosPago.ts — Cliente de métodos de pago externos (tarjetas del usuario)
 *
 * Endpoints:
 *   GET    /api/metodos-pago/usuario/{id}  → métodos de un usuario
 *   POST   /api/metodos-pago               → alta de un método
 *   DELETE /api/metodos-pago/{id}          → baja de un método
 */

import { api } from './client';

// Método de pago externo tal como lo devuelve el backend (solo últimos 4 dígitos).
export interface MetodoPagoExterno {
  metodoId: number;
  usuarioId: number;
  tipo: string; // Ej: "Tarjeta" o "Cuenta"
  ultimosCuatro: string;
  entidadEmisora: string; // Ej: "Visa", "Mastercard", "Mercado Pago"
}

export const metodosPagoApi = {
  // Trae los métodos de un usuario específico
  getByUsuario: (usuarioId: number) =>
    api.get<MetodoPagoExterno[]>(`/api/metodos-pago/usuario/${usuarioId}`),

  // Para cuando hagamos el botón de "+ Agregar"
  create: (data: Omit<MetodoPagoExterno, 'metodoId'>) =>
    api.post<MetodoPagoExterno>('/api/metodos-pago', data),

  // Para cuando hagamos la opción de eliminar
  delete: (metodoId: number) =>
    api.delete<void>(`/api/metodos-pago/${metodoId}`),
};