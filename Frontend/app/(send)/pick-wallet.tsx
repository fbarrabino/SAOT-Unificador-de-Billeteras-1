// Enviar #1.5 — Elegí a qué billetera del destinatario cae el pago.
// Llega desde recipient con el usuarioId del contacto (usuario real de la app),
// pide sus billeteras activas al backend y, al elegir una, sigue a amount con
// el cuentaDestinoId correspondiente.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ContactAvatar } from '@/components/ContactAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { type WalletKey } from '@/data/wallets';
import { fetchBilleterasDeUsuario, type BilleteraDestino } from '@/api/cuentas';
import { ApiError } from '@/api/client';
import { colors, fonts, radii } from '@/theme/tokens';

export default function PickWallet() {
  const params = useLocalSearchParams<{
    to?: string;
    usuarioId?: string;
    name?: string;
    initials?: string;
    color?: string;
  }>();

  const name = params.name ?? 'Contacto';
  const initials = params.initials ?? '??';
  const color = params.color ?? '#A259FF';

  const [wallets, setWallets] = useState<BilleteraDestino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const id = Number(params.usuarioId);
      if (!id) {
        setError('No se pudo identificar al destinatario.');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchBilleterasDeUsuario(id);
        if (!cancelled) setWallets(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.mensaje : 'No se pudieron cargar las billeteras.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.usuarioId]);

  function pick(w: BilleteraDestino) {
    router.push({
      pathname: '/(send)/amount',
      params: {
        to: params.to ?? String(params.usuarioId ?? ''),
        name,
        initials,
        color,
        cuentaDestinoId: String(w.cuentaBilleteraId),
      },
    });
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Elegí la billetera" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.toRow}>
            <ContactAvatar initials={initials} color={color} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.toLabel}>Enviar a</Text>
              <Text style={styles.toName}>{name}</Text>
            </View>
          </View>

          <Text style={styles.lead}>Elegí a qué billetera de {name.split(' ')[0]} querés que llegue el dinero.</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.cyan} size="large" />
              <Text style={styles.centerText}>Cargando billeteras…</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.centerText}>{error}</Text>
            </View>
          ) : wallets.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.centerText}>
                {name.split(' ')[0]} todavía no tiene billeteras vinculadas para recibir dinero.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 8 }}>
              {wallets.map((w) => (
                <Pressable key={w.cuentaBilleteraId} style={styles.walletRow} onPress={() => pick(w)}>
                  {w.key ? (
                    <WalletGlyph wallet={w.key as WalletKey} size={36} />
                  ) : (
                    <View style={styles.walletFallback}>
                      <Text style={styles.walletFallbackText}>{w.nombre[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.walletName}>{w.nombre}</Text>
                    {w.alias ? <Text style={styles.walletAlias}>{w.alias}</Text> : null}
                  </View>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40 },
  toRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  toLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  toName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, marginTop: 1 },
  lead: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 18 },
  center: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, textAlign: 'center', paddingHorizontal: 20 },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 12,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  walletFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(57,195,242,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletFallbackText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.cyan },
  walletName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  walletAlias: { fontFamily: fonts.body, fontSize: 12, color: colors.dim, marginTop: 2 },
  chev: { fontFamily: fonts.body, fontSize: 20, color: colors.dim, marginLeft: 8 },
});
