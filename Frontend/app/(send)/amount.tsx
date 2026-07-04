// Enviar #2 — Monto + selector de billetera origen (Conectado a Backend real y WalletsContext).
// Patrón compartido con Pedir/Cambiar: chip "Para" arriba + display de monto
// + selector de wallet + teclado numérico + CTA contextual.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AmountDisplay } from '@/components/AmountDisplay';
import { ContactAvatar } from '@/components/ContactAvatar';
import { NumericKeypad } from '@/components/NumericKeypad';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TxHeader } from '@/components/TxHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { findContact } from '@/data/contacts';
import { WALLETS, type WalletKey } from '@/data/wallets';
import { amountValue, fmt, fmtCompact } from '@/utils/format';
import { colors, fonts, radii } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';

export default function SendAmount() {
  const params = useLocalSearchParams<{
    to?: string;
    name?: string;
    initials?: string;
    color?: string;
    cuentaDestinoId?: string;
  }>();

  // 1. Reconstruimos el contacto con los datos reales de la API (evita el fallback a Lucía Romero)
  const staticContact = findContact(params.to ?? '');
  const contact = staticContact ?? {
    id: params.to ?? 'custom',
    name: params.name ?? 'Contacto',
    handle: params.to ? `@${params.to}` : '@usuario',
    initials: params.initials ?? '??',
    color: params.color ?? '#A259FF',
    cuentaDestinoId: params.cuentaDestinoId ? Number(params.cuentaDestinoId) : undefined
  };

  // 2. Conectamos con las billeteras reales del usuario en SQL Server
  const { wallets } = useWallets();
  const activeWallets = wallets.length > 0 ? wallets : WALLETS;

  // Seleccionamos por defecto la primera billetera activa del usuario
  const [from, setFrom] = useState<WalletKey>(() => (activeWallets[0]?.key as WalletKey) ?? 'mp');

  // 3. Monto inicial limpio en '0' para una UX financiera real
  const [amt, setAmt] = useState('0');

  // Buscamos la billetera seleccionada (soportando tanto propiedades del contexto como de mocks)
  const fromWallet = activeWallets.find(w => w.key === from) ?? activeWallets[0] ?? WALLETS[0];
  const walletBal = Number((fromWallet as any).bal ?? (fromWallet as any).saldoActual ?? 0);
  const walletName = (fromWallet as any).name ?? (fromWallet as any).alias ?? 'Billetera';

  const n = amountValue(amt);
  const insufficient = n > walletBal;
  const valid = n > 0 && !insufficient;

  const ctaLabel =
    n <= 0
      ? 'Elegí un monto'
      : insufficient
        ? 'Saldo insuficiente'
        : `Enviar ${fmt(n)}`;

  function next() {
    if (!valid) return;

    // 4. Pasamos TODA la cadena de datos a confirm.tsx para que SQL y Neo4j reciban los IDs exactos
    router.push({
      pathname: '/(send)/confirm',
      params: {
        to: contact.id,
        from: fromWallet.key,
        amt: String(n),
        name: contact.name,
        initials: contact.initials,
        color: contact.color,
        cuentaDestinoId: contact.cuentaDestinoId ? String(contact.cuentaDestinoId) : ''
      },
    });
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <TxHeader title="Enviar" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.toRow}>
            <ContactAvatar initials={contact.initials} color={contact.color} size={36} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.toLabel}>Para</Text>
              <Text style={styles.toName}>{contact.name}</Text>
            </View>
          </View>

          <Text style={styles.amtLabel}>Monto</Text>
          <AmountDisplay text={fmtCompact(n)} size={60} variant="plain" />
          <Text style={styles.availability}>
            Disponible · <Text style={{ color: colors.text }}>{fmt(walletBal)}</Text>
          </Text>

          <View style={styles.fromRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <WalletGlyph wallet={from} size={32} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.fromLabel}>Desde</Text>
                <Text style={styles.fromName}>{walletName}</Text>
              </View>
            </View>

            <View style={styles.swatch}>
              {activeWallets.map(w => (
                <Pressable
                  key={w.key}
                  onPress={() => setFrom(w.key as WalletKey)}
                  style={[
                    styles.swatchDot,
                    from === w.key && styles.swatchDotOn,
                  ]}
                >
                  <WalletGlyph wallet={w.key as WalletKey} size={22} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <NumericKeypad value={amt} onChange={setAmt} />
          </View>

          <PrimaryButton
            label={ctaLabel}
            disabled={!valid}
            onPress={next}
            style={{ marginTop: 18 }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  toLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  toName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginTop: 1 },
  amtLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 22,
  },
  availability: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  fromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  fromLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  fromName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginTop: 1 },
  swatch: { flexDirection: 'row', gap: 6 },
  swatchDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDotOn: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(57,195,242,0.16)',
  },
});