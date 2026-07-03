// D7-FE · Dispositivos conectados
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type } from '@/theme/tokens';
import { fetchSesiones, revocarSesion, type SesionResponse } from '@/api/sesiones';
import { ApiError } from '@/api/client';

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ConnectedDevicesScreen() {
  const [sesiones, setSesiones] = useState<SesionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchSesiones();
      setSesiones(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.mensaje : 'No se pudieron cargar los dispositivos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleRevocar = async (sesionId: number) => {
    setRevokingId(sesionId);
    try {
      await revocarSesion(sesionId);
      setSesiones(prev => prev.filter(s => s.sesionId !== sesionId));
    } catch (err) {
      setError(err instanceof ApiError ? err.mensaje : 'No se pudo cerrar la sesión.');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <View style={{ paddingTop: 48 }}>
        <ScreenHeader title="Dispositivos conectados" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Estas son las sesiones activas de tu cuenta. Si no reconocés alguna, cerrala.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.cyan} style={{ marginTop: 32 }} />
        ) : error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : sesiones.length === 0 ? (
          <Text style={styles.emptyText}>No hay sesiones activas.</Text>
        ) : (
          <View style={styles.card}>
            {sesiones.map((s, i) => (
              <DeviceRow
                key={s.sesionId}
                sesion={s}
                noBorder={i === sesiones.length - 1}
                isRevoking={revokingId === s.sesionId}
                onRevocar={() => handleRevocar(s.sesionId)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DeviceRow({
  sesion,
  noBorder,
  isRevoking,
  onRevocar,
}: {
  sesion: SesionResponse;
  noBorder?: boolean;
  isRevoking: boolean;
  onRevocar: () => void;
}) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Feather name="smartphone" size={18} color={colors.cyan} />
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={type.bodyText}>{sesion.dispositivoNombre ?? 'Dispositivo desconocido'}</Text>
          {sesion.esSesionActual ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ESTA SESIÓN</Text>
            </View>
          ) : null}
        </View>
        <Text style={type.small}>
          {sesion.ipUltimoLogin ?? 'IP desconocida'} · Última actividad {formatFecha(sesion.ultimaActividad)}
        </Text>
      </View>
      {sesion.esSesionActual ? null : (
        <Pressable onPress={onRevocar} disabled={isRevoking} style={styles.closeBtn}>
          {isRevoking ? (
            <ActivityIndicator size="small" color={colors.red} />
          ) : (
            <Text style={styles.closeBtnText}>Cerrar</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  lead: { ...type.body, marginBottom: spacing.xl, lineHeight: 20 },
  emptyText: { ...type.body, textAlign: 'center', marginTop: 32 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 0.4,
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#f87171',
    lineHeight: 18,
  },
});
