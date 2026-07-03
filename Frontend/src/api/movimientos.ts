/**
 * movimientos.ts — Servicio de movimientos / actividad
 *
 * Endpoint: GET /api/movimientos/me
 * Trae los movimientos del usuario autenticado y los convierte al tipo
 * ActivityItem que usa la tab de Actividad.
 *
 * El backend devuelve: { movimientoId, cuentaBilleteraId, monto, tipo ('INGRESO'/'EGRESO'),
 *                        fecha, descripcion, categoriaNombre, cuentaAlias }
 */

import { api } from './client';
import type { ActivityItem } from '@/data/activity';
import type { WalletKey } from '@/data/wallets';

// ─── Tipo del backend ─────────────────────────────────────────────────────────

export interface MovimientoResponse {
  movimientoId: number;
  cuentaBilleteraId: number;
  categoriaId: number;
  fecha: string;          // ISO 8601: "2026-06-22T14:22:00"
  descripcion: string | null;
  monto: number;
  tipo: string;           // 'INGRESO' | 'EGRESO'
  categoriaNombre: string | null;
  cuentaAlias: string | null;
}

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────

/**
 * Convierte una fecha ISO al bucket de la timeline ('HOY', 'AYER', '22 JUN', etc.)
 * comparando contra la fecha local del dispositivo.
 */
function toBucket(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const soloFecha = (d: Date) => d.toDateString();

    if (soloFecha(fecha) === soloFecha(hoy)) return 'HOY';
    if (soloFecha(fecha) === soloFecha(ayer)) return 'AYER';

    const dia = fecha.getDate();
    const mes = fecha
      .toLocaleString('es-AR', { month: 'short' })
      .toUpperCase()
      .replace('.', '');
    return `${dia} ${mes}`;
  } catch {
    return '—';
  }
}

/**
 * Intenta inferir el WalletKey a partir del alias de cuenta ('mp-cuenta', 'ua-personal', etc.)
 * o del cuentaBilleteraId si el alias no da pistas.
 */
function toWalletKey(alias: string | null): WalletKey {
  const a = (alias ?? '').toLowerCase();
  if (a.includes('mp') || a.includes('mercado')) return 'mp';
  if (a.includes('ua') || a.includes('uala') || a.includes('ualá')) return 'ua';
  if (a.includes('lm') || a.includes('lemon')) return 'lm';
  if (a.includes('bb') || a.includes('brubank')) return 'bb';
  if (a.includes('nx') || a.includes('naranja')) return 'nx';
  return 'mp'; // default razonable mientras el alias no esté estandarizado
}

function toWalletName(key: WalletKey): string {
  const names: Record<WalletKey, string> = {
    mp: 'Mercado Pago',
    ua: 'Ualá',
    lm: 'Lemon',
    bb: 'Brubank',
    nx: 'Naranja X',
  };
  return names[key];
}

/**
 * Convierte un MovimientoResponse del backend al tipo ActivityItem del frontend.
 */
export function movimientoToActivity(m: MovimientoResponse): ActivityItem {
  const kind: 'in' | 'out' =
    m.tipo.trim().toUpperCase() === 'INGRESO' ? 'in' : 'out';

  const wallet = toWalletKey(m.cuentaAlias);

  let time = '00:00';
  try {
    time = new Date(m.fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    time = '00:00';
  }

  return {
    id: String(m.movimientoId),
    bucket: toBucket(m.fecha),
    wallet,
    title: m.descripcion?.trim() || m.categoriaNombre || 'Movimiento',
    walletName: toWalletName(wallet),
    time,
    // Monto: negativo si es egreso, positivo si es ingreso
    amount: kind === 'out' ? -Math.abs(m.monto) : Math.abs(m.monto),
    kind,
  };
}

// ─── Función pública ──────────────────────────────────────────────────────────

/**
 * GET /api/movimientos/me
 *
 * Devuelve el historial del usuario como ActivityItem[].
 * Los movimientos ya vienen ordenados por fecha DESC desde el backend.
 *
 * Bloque 1 (B1): si el server no responde o el usuario no tiene
 * movimientos, devolvemos array vacío para que la UI muestre el empty state.
 */
export async function fetchMisMovimientos(): Promise<ActivityItem[]> {
  try {
    const movimientos = await api.get<MovimientoResponse[]>('/api/movimientos/me');

    if (!Array.isArray(movimientos)) {
      console.warn('[movimientos] La respuesta del servidor no es un array.');
      return [];
    }

    return movimientos.map(movimientoToActivity);
  } catch (err) {
    console.warn('[movimientos] No se pudo conectar al backend:', err);
    return [];
  }
}
