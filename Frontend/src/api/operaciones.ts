/**
 * operaciones.ts — Cliente de operaciones transaccionales (BE-03/04/05)
 *
 * Endpoints:
 * POST /api/operaciones/enviar
 * POST /api/operaciones/cambiar
 * POST /api/operaciones/pagar-qr
 *
 * El backend responde 409 Conflict con { mensaje } cuando hay saldo
 * insuficiente, categoría inválida o cuentas inexistentes. El cliente
 * `api` ya levanta ApiError con ese mensaje listo para mostrar al usuario.
 */

import { api } from './client';

// ─── Categorías por defecto (seed init.sql) ───────────────────────────────────
// Para evitar tener que pedir el catálogo en cada operación, usamos los ids
// del seed: 7 = "Otros" (Egreso), 2 = "Transferencia recibida" (Ingreso).
export const CATEGORIA_EGRESO_DEFAULT = 7;
export const CATEGORIA_INGRESO_DEFAULT = 2;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OperacionResponse {
  operacion: string;
  movimientosCreados: number[];
  saldoOrigenFinal: number;
  saldoDestinoFinal: number | null;
}

export interface EnviarRequest {
  cuentaOrigenId: number;
  categoriaId: number;
  monto: number;
  descripcion?: string | null;
  cuentaDestinoId?: number | null; // C1-BE / C1-FE: Inyección de la cuenta destino real
}

export interface CambiarRequest {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  categoriaEgresoId: number;
  categoriaIngresoId: number;
  monto: number;
  descripcion?: string | null;
}

export interface TransferirRequest {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  categoriaEgresoId: number;
  categoriaIngresoId: number;
  monto: number;
  descripcion?: string | null;
}

export interface PagarQrRequest {
  cuentaOrigenId: number;
  categoriaId: number;
  monto: number;
  descripcion?: string | null;
  codigoQR?: string | null;
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

export const enviar = (body: EnviarRequest) =>
  api.post<OperacionResponse>('/api/operaciones/enviar', body);

export const cambiar = (body: CambiarRequest) =>
  api.post<OperacionResponse>('/api/operaciones/cambiar', body);

export const transferir = (body: TransferirRequest) =>
  api.post<OperacionResponse>('/api/operaciones/transferir', body);

export const pagarQr = (body: PagarQrRequest) =>
  api.post<OperacionResponse>('/api/operaciones/pagar-qr', body);