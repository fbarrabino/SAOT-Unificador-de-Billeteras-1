// Enviar #3 — Confirmar.
// Resumen Para/Desde/Comisión/Llega + CTA "Deslizar para enviar".
// FE-19: el CTA dispara POST /api/operaciones/enviar y solo navega a success
// si el backend confirma la transacción (saldo + movimiento commit OK).
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AmountDisplay } from '@/components/AmountDisplay';
import { ContactAvatar } from '@/components/ContactAvatar';
import { TxHeader } from '@/components/TxHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { findContact } from '@/data/contacts';
import { type WalletKey } from '@/data/wallets';
import { fmt } from '@/utils/format';
import { colors, fonts, gradients, radii, shadow } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';
import { enviar, CATEGORIA_EGRESO_DEFAULT } from '@/api/operaciones';
import { ApiError } from '@/api/client';
import { confirmarConBiometria } from '@/utils/biometrics';

export default function SendConfirm() {
  const { to, from, amt } = useLocalSearchParams<{ to?: string; from?: WalletKey; amt?: string }>();
  const contact = findContact(to ?? '') ?? findContact('lr')!;
  const { wallets, refresh } = useWallets();
  const wallet =
    wallets.find((w) => w.key === ((from as WalletKey) ?? 'mp')) ?? wallets[0];
  const n = Number(amt ?? 0);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (!wallet?.cuentaId) {
      Alert.alert('No se puede enviar', 'No se encontró la cuenta de origen vinculada al backend.');
      return;
    }

    // D5 — confirmación biométrica antes de mover dinero.
    const bio = await confirmarConBiometria(`Enviar ${fmt(n)} a ${contact.name}`);
    if (!bio.ok) {
      Alert.alert('Verificación cancelada', bio.motivo ?? 'No se confirmó el envío.');
      return;
    }

    setSubmitting(true);
    try {
      await enviar({
        cuentaOrigenId: wallet.cuentaId,
        categoriaId: CATEGORIA_EGRESO_DEFAULT,
        monto: n,
        descripcion: `Envío a ${contact.name}`,
      });
      await refresh();
      router.replace({
        pathname: '/(send)/success',
        params: { to: contact.id, from: wallet.key, amt: String(n) },
      });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.mensaje : 'No se pudo enviar el dinero.';
      Alert.alert('Operación rechazada', mensaje);
    } finally {
      setSubmitting(false);
    }
  }

  if (!wallet) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <TxHeader title="Confirmar" />
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
        <TxHeader title="Confirmar" />

        <View style={styles.body}>
          <Text style={styles.sentLabel}>Estás enviando</Text>
          <AmountDisplay text={fmt(n)} variant="green" size={48} />

          <View style={styles.card}>
            <Row label="Para" right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ContactAvatar initials={contact.initials} color={contact.color} size={22} />
                <Text style={styles.value}>{contact.name}</Text>
              </View>
            } />
            <Row label="Desde" right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <WalletGlyph wallet={wallet.key} size={22} />
                <Text style={styles.value}>{wallet.name}</Text>
              </View>
            } />
            <Row label="Comisión" right={<Text style={styles.value}>{fmt(0)}</Text>} />
            <Row label="Llega" right={<Text style={styles.value}>Al instante</Text>} last />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[shadow.cta, { borderRadius: radii.button, opacity: submitting ? 0.6 : 1 }]}>
            <Pressable disabled={submitting} onPress={confirm} android_ripple={{ color: 'rgba(0,0,0,0.12)' }}>
              <LinearGradient
                colors={gradients.cyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.ctaText} />
                ) : (
                  <Text style={styles.ctaText}>Deslizar para enviar</Text>
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
  body: { flex: 1, paddingHorizontal: 18 },
  sentLabel: {
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
    paddingVertical: 14,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
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
