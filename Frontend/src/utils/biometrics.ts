/**
 * biometrics.ts — Confirmación biométrica para operaciones sensibles (D5)
 *
 * Envuelve expo-local-authentication para pedir Face ID / huella antes de
 * confirmar un pago. Diseñado para no romper el flujo en dispositivos sin
 * biometría (emuladores, equipos sin huella/rostro configurado): si no hay
 * hardware o no hay credenciales enroladas, devuelve `true` y deja pasar.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export interface ConfirmacionBiometrica {
  ok: boolean;
  /** true si el dispositivo realmente pidió biometría (vs. saltada por falta de hardware). */
  usoBiometria: boolean;
  /** mensaje de error legible si ok === false por algo distinto a cancelar. */
  motivo?: string;
}

/**
 * Pide confirmación biométrica al usuario.
 * @param prompt texto que se muestra en el diálogo del sistema.
 */
export async function confirmarConBiometria(
  prompt = 'Confirmá la operación',
): Promise<ConfirmacionBiometrica> {
  try {
    const hayHardware = await LocalAuthentication.hasHardwareAsync();
    const estaEnrolado = await LocalAuthentication.isEnrolledAsync();

    // Sin hardware o sin huella/rostro configurado → no bloqueamos la operación.
    if (!hayHardware || !estaEnrolado) {
      return { ok: true, usoBiometria: false };
    }

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // permite el PIN del sistema como respaldo
    });

    if (resultado.success) {
      return { ok: true, usoBiometria: true };
    }

    // El usuario canceló o falló la verificación.
    return {
      ok: false,
      usoBiometria: true,
      motivo: 'No se pudo verificar tu identidad. Operación cancelada.',
    };
  } catch (err) {
    // Ante un error inesperado de la API biométrica, dejamos pasar para no
    // trabar la operación financiera (SQL sigue siendo la fuente de verdad).
    console.warn('[biometrics] Error al verificar, se omite:', err);
    return { ok: true, usoBiometria: false };
  }
}
