/**
 * cuentas.ts — Servicio de cuentas/billeteras
 *
 * Endpoint: GET /api/cuentas-billetera/me
 * Devuelve las cuentas vinculadas del usuario autenticado y las convierte
 * al tipo Wallet que usan las pantallas del frontend.
 */

import { api } from './client';
import { gradients } from '@/theme/tokens';
import type { Wallet, WalletKey } from '@/data/wallets';

export interface CuentaBilleteraResponse {
  cuentaBilleteraId: number;
  usuarioId: number;
  billeteraId: number;
  alias: string | null;
  saldoActual: number;
  fechaVinculacion: string;
  billeteraNombre: string | null;
  usuarioNombre: string | null;
}

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────

/** Convierte el nombre del backend al key interno de la app. */
function toWalletKey(nombre: string | null): WalletKey | null {
  const n = (nombre ?? '').toLowerCase().trim();
  if (n.includes('mercado') || n.includes('mp')) return 'mp';
  if (n.includes('ual')) return 'ua';
  if (n.includes('lemon') || n.includes('lm')) return 'lm';
  if (n.includes('brubank') || n.includes('bb')) return 'bb';
  if (n.includes('naranja') || n.includes('nx')) return 'nx';
  return null; // billetera desconocida — la ignoramos
}

function toGradient(key: WalletKey): readonly [string, string] {
  const map: Record<string, readonly [string, string]> = {
    mp: gradients.mpTint,
    ua: gradients.uaTint,
    lm: gradients.lmTint,
    bb: gradients.bbTint,
    nx: gradients.nxTint,
  };
  return map[key] || gradients.mpTint;
}

export function cuentaToWallet(cuenta: CuentaBilleteraResponse): Wallet | null {
  const key = toWalletKey(cuenta.billeteraNombre);
  if (key === null) return null;

  return {
    key,
    name: cuenta.billeteraNombre ?? key,
    short: cuenta.alias ?? cuenta.billeteraNombre ?? key,
    bal: cuenta.saldoActual,
    tint: toGradient(key),
    cuentaId: cuenta.cuentaBilleteraId,
  };
}

// ─── Función pública ──────────────────────────────────────────────────────────

/**
 * GET /api/cuentas-billetera/me
 *
 * Devuelve las billeteras del usuario autenticado transformadas a Wallet[].
 */
export async function fetchMisCuentas(): Promise<Wallet[]> {
  try {
    const cuentas = await api.get<CuentaBilleteraResponse[]>('/api/cuentas-billetera/me');

    if (!Array.isArray(cuentas)) {
      console.warn('[cuentas] La respuesta del servidor no es un array.');
      return [];
    }

    return cuentas
      .map(cuentaToWallet)
      .filter((w): w is Wallet => w !== null);
  } catch (err) {
    console.warn('[cuentas] No se pudo conectar al backend:', err);
    return [];
  }
}

// ─── Billeteras de un destinatario (para elegir a cuál enviarle dinero) ───────

// Billetera de OTRO usuario tal como la expone el backend: sin saldo (privacidad).
export interface BilleteraDestinoResponse {
  cuentaBilleteraId: number;
  billeteraNombre: string | null;
  alias: string | null;
}

// Billetera destino ya lista para la UI (con el key interno para pintar el logo).
export interface BilleteraDestino {
  cuentaBilleteraId: number;
  nombre: string;
  alias: string | null;
  key: WalletKey | null; // null si el nombre no matchea ninguna billetera conocida
}

/**
 * GET /api/cuentas-billetera/de-usuario/{usuarioId}
 *
 * Billeteras activas del destinatario para elegir a cuál cae el pago.
 * No trae el saldo del otro usuario.
 */
export async function fetchBilleterasDeUsuario(usuarioId: number): Promise<BilleteraDestino[]> {
  const cuentas = await api.get<BilleteraDestinoResponse[]>(
    `/api/cuentas-billetera/de-usuario/${usuarioId}`,
  );

  if (!Array.isArray(cuentas)) return [];

  return cuentas.map((c) => ({
    cuentaBilleteraId: c.cuentaBilleteraId,
    nombre: c.billeteraNombre ?? 'Billetera',
    alias: c.alias,
    key: toWalletKey(c.billeteraNombre),
  }));
}

// Nueva función para B4-FE (Tu trabajo)
export async function vincularCuentaBilletera(billeteraId: number, alias: string, saldoInicial: number): Promise<CuentaBilleteraResponse> {
  const req = {
    billeteraId,
    alias,
    saldoInicial
  };
  return await api.post<CuentaBilleteraResponse>('/api/cuentas-billetera', req);
}

/**
 * DELETE /api/cuentas-billetera/{id}/desvincular
 * Desvincula (soft-delete) una cuenta del usuario. La billetera vuelve a
 * quedar "disponible" para reconectar.
 */
export async function desvincularCuentaBilletera(cuentaBilleteraId: number): Promise<void> {
  await api.delete<void>(`/api/cuentas-billetera/${cuentaBilleteraId}/desvincular`);
}