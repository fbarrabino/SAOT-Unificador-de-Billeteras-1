// Cambiar #2 — Confirmar cambio.
// Resumen Desde/A/Monto/Tasa/Comisión/Llega + CTA "Confirmar cambio" con gradiente lime.
// FE-19: el CTA invoca POST /api/operaciones/cambiar (BE-04), espera el
// commit del backend y recién ahí navega a success.
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AmountDisplay } from '@/components/AmountDisplay';
import { TxHeader } from '@/components/TxHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { type WalletKey } from '@/data/wallets';
import { fmt } from '@/utils/format';
import { colors, fonts, gradients, radii, shadow } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';
import {
  cambiar,
  CATEGORIA_EGRESO_DEFAULT,
  CATEGORIA_INGRESO_DEFAULT,
} from '@/api/operaciones';
import { ApiError } from '@/api/client';
import { confirmarConBiometria } from '@/utils/biometrics';

export default function ExchangeConfirm() {
  const { from, to, amt, fee } = useLocalSearchParams<{
    from?: WalletKey;
    to?: WalletKey;
    amt?: string;
    fee?: string;
  }>();

  const { wallets, refresh } = useWallets();
  const fromWallet =
    wallets.find((w) => w.key === ((from as WalletKey) ?? 'mp')) ?? wallets[0];
  const toWallet =
    wallets.find((w) => w.key === ((to as WalletKey) ?? 'lm')) ?? wallets[0];

  const n = Number(amt ?? 0);
  const f = Number(fee ?? 0);
  const willReceive = +Math.max(0, n - f).toFixed(2);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (!fromWallet?.cuentaId || !toWallet?.cuentaId) {
      Alert.alert('No se puede cambiar', 'Faltan cuentas vinculadas en el backend.');
      return;
    }

    // D5 — confirmación biométrica antes de mover dinero.
    const bio = await confirmarConBiometria(
      `Cambiar ${fmt(n)} de ${fromWallet.name} a ${toWallet.name}`,
    );
    if (!bio.ok) {
      Alert.alert('Verificación cancelada', bio.motivo ?? 'No se confirmó el cambio.');
      return;
    }

    setSubmitting(true);
    try {
      await cambiar({
        cuentaOrigenId: fromWallet.cuentaId,
        cuentaDestinoId: toWallet.cuentaId,
        categoriaEgresoId: CATEGORIA_EGRESO_DEFAULT,
        categoriaIngresoId: CATEGORIA_INGRESO_DEFAULT,
        monto: n,
        descripcion: `Cambio ${fromWallet.name} → ${toWallet.name}`,
      });
      await refresh();
      router.replace({
        pathname: '/(exchange)/success',
        params: {
          from: fromWallet.key,
          to: toWallet.key,
          amt: String(n),
          receive: String(willReceive),
        },
      });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.mensaje : 'No se pudo realizar el cambio.';
      Alert.alert('Operación rechazada', mensaje);
    } finally {
      setSubmitting(false);
    }
  }

  if (!fromWallet || !toWallet) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <TxHeader title="Confirmar cambio" />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.cyan} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <TxHeader title="Confirmar cambio" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.lbl}>Recibirás</Text>
          <AmountDisplay text={fmt(willReceive)} variant="green" size={48} />

          <View style={styles.card}>
            <Row
              label="Desde"
              right={
                <View style={styles.rightRow}>
                  <WalletGlyph wallet={fromWallet.key} size={22} />
                  <Text style={styles.value}>{fromWallet.name}</Text>
                </View>
              }
            />
            <Row
              label="A"
              right={
                <View style={styles.rightRow}>
                  <WalletGlyph wallet={toWallet.key} size={22} />
                  <Text style={styles.value}>{toWallet.name}</Text>
                </View>
              }
            />
            <Row label="Monto" right={<Text style={styles.value}>{fmt(n)}</Text>} />
            <Row label="Tasa" right={<Text style={styles.value}>1.00</Text>} />
            <Row label="Comisión" right={<Text style={styles.value}>{fmt(f)}</Text>} />
            <Row label="Llega" right={<Text style={styles.value}>Al instante</Text>} last />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={[shadow.cta, { borderRadius: radii.button, opacity: submitting ? 0.6 : 1 }]}>
            <Pressable disabled={submitting} onPress={confirm} android_ripple={{ color: 'rgba(0,0,0,0.12)' }}>
              <LinearGradient
                colors={gradients.lime}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.ctaText} />
                ) : (
                  <Text style={styles.ctaText}>Confirmar cambio</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  right,
  last,
}: {
  label: string;
  right: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  lbl: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
  },
  card: {
    marginTop: 18,
    borderRadius: radii.cardLg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  value: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  footer: { paddingHorizontal: 18, paddingBottom: 14 },
  cta: {
    height: 54,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ctaText },
});
