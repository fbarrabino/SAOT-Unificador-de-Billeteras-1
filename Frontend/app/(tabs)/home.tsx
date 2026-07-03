import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import { colors, fonts, gradients, radii, type } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';
import { fmt } from '@/utils/format';

// ─── Íconos ───────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M21 3L3 11l7 2 2 7 9-17z" />
      <Path d="M10 13L21 3" />
    </Svg>
  );
}
function RequestIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M12 4v12" />
      <Path d="M6 11l6 6 6-6" />
      <Path d="M4 20h16" />
    </Svg>
  );
}
function SwapIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M4 8h13l-3-3" />
      <Path d="M20 16H7l3 3" />
    </Svg>
  );
}
function QRIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <Path d="M14 14h3v3M21 14v3M14 18v3h3M18 21h3" />
    </Svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Home() {
  // Datos reales del backend (o mock si el backend no responde)
  const { wallets, activity, isLoading, error, refresh } = useWallets();

  const total = wallets.reduce((s, w) => s + w.bal, 0);

  // Mostramos solo los últimos 3 movimientos en la home
  const recentActivity = activity.slice(0, 3);

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Balance total ───────────────────────────────────────────────── */}
          <Text style={styles.balanceLabel}>Balance Total</Text>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.cyan} size="small" />
              <Text style={styles.loadingText}>Actualizando...</Text>
            </View>
          ) : (
            <Text style={styles.balance}>{fmt(total)}</Text>
          )}

          {/* Banner de error con botón para reintentar */}
          {error && !isLoading ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={refresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ── Billeteras conectadas ────────────────────────────────────────── */}
          <Pressable
            style={styles.sectionRow}
            onPress={() => router.push('/(tabs)/wallets')}
          >
            <Text style={styles.h4}>Billeteras Conectadas</Text>
            <Text style={styles.more}>›</Text>
          </Pressable>

          {wallets.length === 0 && !isLoading ? (
            <Pressable
              style={styles.walletsEmpty}
              onPress={() => router.push('/connect-list')}
            >
              <Text style={styles.walletsEmptyTitle}>Todavía no tenés billeteras</Text>
              <Text style={styles.walletsEmptyHint}>
                Vinculá tu primera para ver el balance unificado y operar.
              </Text>
              <Text style={styles.walletsEmptyCta}>Conectar billetera ›</Text>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 18, gap: 10 }}
              style={{ marginHorizontal: -18, paddingHorizontal: 18 }}
            >
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
                    style={styles.wcard}
                  >
                    <WalletGlyph wallet={w.key} size={34} />
                    <Text style={styles.wname}>{w.name}</Text>
                    <Text style={styles.wbal}>{fmt(w.bal)}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* ── Acciones rápidas ─────────────────────────────────────────────── */}
          <View style={[styles.sectionRow, { marginTop: 24 }]}>
            <Text style={styles.h4}>Acciones Rápidas</Text>
          </View>

          {/* Si no hay billeteras conectadas, las acciones rápidas redirigen a
              conectar primero. Evita que el flow de Enviar/Cambiar arranque
              sin cuentas y falle contra el backend con "cuenta no existe". */}
          {(() => {
            const sinBilleteras = wallets.length === 0;
            const irAConectar = () =>
              Alert.alert(
                'Conectá una billetera',
                'Necesitás vincular al menos una billetera para usar esta acción.',
                [
                  { text: 'Ahora no', style: 'cancel' },
                  { text: 'Conectar', onPress: () => router.push('/connect-list') },
                ],
              );
            return (
              <View style={[styles.qa, sinBilleteras && { opacity: 0.55 }]}>
                <QuickAction
                  icon={<SendIcon />}
                  label="Enviar"
                  // Fix Franco: Rutas limpias sin paréntesis
                  onPress={() => (sinBilleteras ? irAConectar() : router.push('/recipient'))}
                />
                <QuickAction
                  icon={<RequestIcon />}
                  label="Pedir"
                  // Fix Franco: Rutas limpias sin paréntesis
                  onPress={() => (sinBilleteras ? irAConectar() : router.push('/amount'))}
                />
                <QuickAction
                  icon={<SwapIcon />}
                  label="Cambiar"
                  // Fix Franco: Rutas limpias sin paréntesis
                  onPress={() => (sinBilleteras ? irAConectar() : router.push('/amount'))}
                />
                <QuickAction
                  icon={<QRIcon />}
                  label="Pagar QR"
                  onPress={() => (sinBilleteras ? irAConectar() : router.push('/payqr-scanning'))}
                />
              </View>
            );
          })()}

          {/* ── Actividad reciente ───────────────────────────────────────────── */}
          <Pressable
            style={[styles.sectionRow, { marginTop: 26 }]}
            onPress={() => router.push('/activity')}
          >
            <Text style={styles.h4}>Actividad Reciente</Text>
            <Text style={styles.more}>Ver todo ›</Text>
          </Pressable>

          {recentActivity.length === 0 && !isLoading ? (
            <Text style={styles.emptyText}>Sin movimientos recientes.</Text>
          ) : (
            recentActivity.map(a => (
              <View key={a.id} style={styles.act}>
                <WalletGlyph wallet={a.wallet} size={36} />
                <View style={{ flex: 1, marginLeft: 11 }}>
                  <Text style={styles.actTitle}>{a.title}</Text>
                  <Text style={styles.actSub}>{a.walletName}</Text>
                </View>
                <Text style={[styles.actAmt, { color: a.kind === 'in' ? colors.green : colors.text }]}>
                  {a.kind === 'in' ? '+' : '-'}
                  {fmt(Math.abs(a.amount))}
                </Text>
              </View>
            ))
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Componente auxiliar ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.qaItem} onPress={onPress}>
      <View style={styles.qaCircle}>{icon}</View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 120 },
  balanceLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  balance: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: 6,
    color: colors.cyan,
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: '#f87171',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  retryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#f87171',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  h4: { ...type.h4 },
  more: { fontFamily: fonts.body, fontSize: 13, color: colors.dim },
  wcard: {
    width: 130,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  wname: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 22 },
  wbal: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.text, marginTop: 2 },
  walletsEmpty: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
  walletsEmptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  walletsEmptyHint: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 18,
  },
  walletsEmptyCta: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.cyan,
    marginTop: 6,
  },
  qa: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  qaItem: { flex: 1, alignItems: 'center', gap: 8 },
  qaCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(57,195,242,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.cyan },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
    marginTop: 12,
  },
  act: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
  actTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  actSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim, marginTop: 2 },
  actAmt: { fontFamily: fonts.displayBold, fontSize: 14 },
});