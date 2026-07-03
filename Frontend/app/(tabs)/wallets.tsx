import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import { colors, fonts, type } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';
import { fmt } from '@/utils/format';

export default function Wallets() {
  const { wallets, isLoading, refresh } = useWallets();
  const total = wallets.reduce((s, w) => s + w.bal, 0);

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.cyan}
            />
          }
        >
          <Text style={styles.h1}>Billeteras</Text>
          <Text style={styles.subhead}>
            {wallets.length === 0
              ? 'Conectá tu primera billetera para ver el balance unificado.'
              : (
                <>
                  Balance combinado ·{' '}
                  <Text style={{ color: colors.text }}>{fmt(total)}</Text>
                </>
              )}
          </Text>

          {wallets.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 7h18v12H3z" />
                  <Path d="M3 7l3-3h12l3 3" />
                  <Path d="M16 13h.01" />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>Sin billeteras conectadas</Text>
              <Text style={styles.emptyHint}>
                Cuando vinculés una billetera vamos a mostrar acá su saldo y
                actividad. Operás todo desde un solo lugar.
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => router.push('/connect-list')}
              >
                <Text style={styles.emptyCtaText}>Conectar billetera</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {wallets.map(w => (
                <Pressable
                  key={w.key}
                  onPress={() =>
                    router.push({ pathname: '/wallet-detail', params: { wallet: w.key } })
                  }
                >
                  <LinearGradient
                    colors={w.tint}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.row}
                  >
                    <WalletGlyph wallet={w.key} size={42} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.name}>{w.name}</Text>
                      <Text style={styles.sub}>Vinculada · ARG</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amt}>{fmt(w.bal)}</Text>
                      <Text style={styles.amtSub}>Disponible</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}

              <Pressable style={styles.addRow} onPress={() => router.push('/connect-list')}>
                <View style={styles.plusCircle}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round">
                    <Path d="M12 5v14M5 12h14" />
                  </Svg>
                </View>
                <Text style={styles.addText}>Conectar otra billetera</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            </View>
          )}

          {isLoading && wallets.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.cyan} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 120 },
  h1: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.text, letterSpacing: -0.5 },
  subhead: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: 22 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim, marginTop: 2 },
  amt: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.text },
  amtSub: { fontFamily: fonts.body, fontSize: 10.5, color: colors.green, marginTop: 2 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 6,
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { flex: 1, marginLeft: 12, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  chev: { fontFamily: fonts.body, fontSize: 18, color: colors.dim },
  emptyState: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(57,195,242,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  emptyCta: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.cyan,
  },
  emptyCtaText: {
    ...type.button,
    color: colors.ctaText,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
