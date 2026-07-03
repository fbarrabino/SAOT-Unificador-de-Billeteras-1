// Tab Actividad — Bloque 2 #01
// Lista unificada (todas las billeteras) de movimientos en una timeline.
// Header título + ícono lupa, filtros pill (Todos / Ingresos / Salientes),
// filas agrupadas por bucket temporal (HOY / AYER / fechas).
// Datos reales desde WalletsContext (GET /api/movimientos/me).
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import { fmt } from '@/utils/format';
import { colors, fonts, radii } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';
import type { ActivityItem } from '@/data/activity';

type Filter = 'all' | 'in' | 'out';

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={colors.muted} strokeWidth={2} />
      <Path d="M20 20l-3.5-3.5" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function Activity() {
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  // Datos reales del backend (o mock si no hay conexión)
  const { activity, isLoading, error, refresh } = useWallets();

  // Filtrado y búsqueda local sobre los datos ya cargados.
  // F1 — además de título/billetera, se puede buscar por monto: el usuario
  // puede tipear "45", "45.20" o "45,20" y matchea igual.
  const filtered = useMemo(() => {
    return activity.filter(a => {
      if (filter === 'in'  && a.kind !== 'in')  return false;
      if (filter === 'out' && a.kind !== 'out') return false;
      if (query) {
        const q = query.toLowerCase().trim();
        const matchTitle  = a.title.toLowerCase().includes(q);
        const matchWallet = a.walletName.toLowerCase().includes(q);

        // Monto en sus dos notaciones ("45.20" y "45,20") + el query
        // normalizado a punto para comparar sin importar la coma.
        const montoAbs = Math.abs(a.amount).toFixed(2);
        const montoComa = montoAbs.replace('.', ',');
        const qNum = q.replace(',', '.');
        const matchMonto =
          montoAbs.includes(qNum) || montoComa.includes(q);

        if (!matchTitle && !matchWallet && !matchMonto) return false;
      }
      return true;
    });
  }, [activity, filter, query]);

  // Re-agrupar por bucket conservando el orden (viene ordenado del backend)
  const grouped: Array<{ bucket: string; items: ActivityItem[] }> = [];
  for (const a of filtered) {
    const last = grouped[grouped.length - 1];
    if (last && last.bucket === a.bucket) last.items.push(a);
    else grouped.push({ bucket: a.bucket, items: [a] });
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.head}>
          <Text style={styles.h1}>Actividad</Text>
          <Pressable
            style={styles.searchBtn}
            onPress={() => setSearching(s => !s)}
            hitSlop={8}
          >
            <SearchIcon />
          </Pressable>
        </View>

        {/* ── Barra de búsqueda ─────────────────────────────────────────────── */}
        {searching ? (
          <View style={styles.searchWrap}>
            <SearchIcon />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre, billetera o monto..."
              placeholderTextColor={colors.dim}
              style={styles.searchInput}
            />
          </View>
        ) : null}

        {/* ── Filtros pill ──────────────────────────────────────────────────── */}
        <View style={styles.filters}>
          <FilterPill label="Todos"    active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label="Ingresos" active={filter === 'in'}  onPress={() => setFilter('in')} />
          <FilterPill label="Salientes"active={filter === 'out'} onPress={() => setFilter('out')} />
        </View>

        {/* ── Banner de error ───────────────────────────────────────────────── */}
        {error && !isLoading ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={refresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Lista de movimientos ──────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            // Pull-to-refresh: llama a refresh() que vuelve a pedir al backend
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.cyan}
              colors={[colors.cyan]}
            />
          }
        >
          {isLoading && activity.length === 0 ? (
            // Primera carga — spinner centrado
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.cyan} />
              <Text style={styles.loadingText}>Cargando actividad...</Text>
            </View>
          ) : grouped.length === 0 ? (
            <Text style={styles.empty}>Sin movimientos para este filtro.</Text>
          ) : (
            grouped.map(g => (
              <View key={g.bucket}>
                <Text style={styles.bucket}>{g.bucket}</Text>
                {g.items.map(a => (
                  <Pressable
                    key={a.id}
                    style={styles.row}
                    onPress={() =>
                      router.push({ pathname: '/transaction-detail', params: { id: a.id } })
                    }
                  >
                    <WalletGlyph wallet={a.wallet} size={36} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.title}>{a.title}</Text>
                      <Text style={styles.sub}>
                        {a.walletName} · {a.time}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.amount,
                        { color: a.kind === 'in' ? colors.green : colors.text },
                      ]}
                    >
                      {a.kind === 'in' ? '+' : '-'}
                      {fmt(Math.abs(a.amount))}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Componente auxiliar ──────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillOn]}>
      <Text style={[styles.pillText, active && { color: colors.ctaText }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  h1: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.icon,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.input,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillOn: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 6,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12.5, color: '#f87171', flex: 1 },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  retryText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#f87171' },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 130 },
  loadingWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.dim },
  bucket: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.dim,
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim, marginTop: 2 },
  amount: { fontFamily: fonts.displayBold, fontSize: 14.5 },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
    marginTop: 40,
  },
});
