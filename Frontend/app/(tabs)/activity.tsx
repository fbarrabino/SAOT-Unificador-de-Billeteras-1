// Tab Actividad — Bloque 2 #01
// Lista unificada (todas las billeteras) de movimientos en una timeline.
// Header título + ícono lupa, filtros pill (Todos / Ingresos / Salientes),
// filas agrupadas por bucket temporal (HOY / AYER / fechas).
//
// PAGINADO + FILTROS SERVER-SIDE (rúbrica 3.4 y 3.5):
// El filtro (tipo + texto) y el paginado NO se resuelven en el cliente: se
// mandan como query params a GET /api/movimientos/me/paged y la API los
// resuelve en la base (Skip/Take + WHERE). Acá solo acumulamos las páginas
// y hacemos scroll infinito con SectionList.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
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
import { fetchMovimientosPaginado } from '@/api/movimientos';
import type { ActivityItem } from '@/data/activity';

type Filter = 'all' | 'in' | 'out';

// Filas por página. El backend clampa pageSize a 1..100.
const PAGE_SIZE = 20;

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
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // ── Estado del listado paginado (viene de la API) ─────────────────────────
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);        // carga inicial / cambio de filtro
  const [loadingMore, setLoadingMore] = useState(false); // scroll infinito (página siguiente)
  const [refreshing, setRefreshing] = useState(false);   // pull-to-refresh
  const [error, setError] = useState<string | null>(null);

  // Debounce del texto (400 ms): así no le pegamos a la API en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Pill de filtro → valor 'tipo' que entiende la API.
  const tipoParam = filter === 'in' ? 'Ingreso' : filter === 'out' ? 'Egreso' : undefined;

  // Carga una página. mode:
  //   'reset'   → primera carga o cambió el filtro → REEMPLAZA la lista.
  //   'append'  → scroll infinito → AGREGA al final.
  //   'refresh' → pull-to-refresh → recarga la página 1.
  const cargar = useCallback(
    async (pageToLoad: number, mode: 'reset' | 'append' | 'refresh') => {
      if (mode === 'reset') setLoading(true);
      if (mode === 'append') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);

      try {
        const res = await fetchMovimientosPaginado({
          tipo: tipoParam,
          texto: debouncedQuery || undefined,
          pageNumber: pageToLoad,
          pageSize: PAGE_SIZE,
        });

        setItems(prev => {
          if (mode === 'append') {
            // Dedupe defensivo por id para no repetir claves entre páginas.
            const seen = new Set(prev.map(p => p.id));
            return [...prev, ...res.items.filter(i => !seen.has(i.id))];
          }
          return res.items;
        });
        setPage(res.pageNumber);
        setHasNext(res.hasNext);
        setTotalCount(res.totalCount);
      } catch (e) {
        console.warn('[Activity] Error cargando movimientos:', e);
        setError('No se pudieron cargar los movimientos. Revisá tu conexión.');
        if (mode === 'reset') setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [tipoParam, debouncedQuery],
  );

  // Cuando cambia el filtro o el texto (debounced), recargamos desde la página 1.
  useEffect(() => {
    cargar(1, 'reset');
  }, [cargar]);

  const onRefresh = useCallback(() => cargar(1, 'refresh'), [cargar]);

  // Scroll infinito: al llegar al final, si hay más y no estamos cargando, pedimos la próxima.
  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && !refreshing && hasNext) {
      cargar(page + 1, 'append');
    }
  }, [loading, loadingMore, refreshing, hasNext, page, cargar]);

  // Agrupamos los ítems acumulados por bucket temporal para las secciones.
  const sections = useMemo(() => {
    const groups: Array<{ title: string; data: ActivityItem[] }> = [];
    for (const a of items) {
      const last = groups[groups.length - 1];
      if (last && last.title === a.bucket) last.data.push(a);
      else groups.push({ title: a.bucket, data: [a] });
    }
    return groups;
  }, [items]);

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
              placeholder="Buscar por descripción o categoría..."
              placeholderTextColor={colors.dim}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        ) : null}

        {/* ── Filtros pill ──────────────────────────────────────────────────── */}
        <View style={styles.filters}>
          <FilterPill label="Todos"    active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label="Ingresos" active={filter === 'in'}  onPress={() => setFilter('in')} />
          <FilterPill label="Salientes"active={filter === 'out'} onPress={() => setFilter('out')} />
        </View>

        {/* ── Contador total (demuestra el paginado real) ───────────────────── */}
        {!loading && totalCount > 0 ? (
          <Text style={styles.count}>
            {totalCount} movimiento{totalCount === 1 ? '' : 's'}
          </Text>
        ) : null}

        {/* ── Banner de error ───────────────────────────────────────────────── */}
        {error && !loading ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => cargar(1, 'reset')} style={styles.retryBtn}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Lista paginada (SectionList + scroll infinito) ─────────────────── */}
        {loading && items.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.cyan} />
            <Text style={styles.loadingText}>Cargando actividad...</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.cyan}
                colors={[colors.cyan]}
              />
            }
            renderSectionHeader={({ section }) => (
              <Text style={styles.bucket}>{section.title}</Text>
            )}
            renderItem={({ item }) => <ActivityRow a={item} />}
            ListEmptyComponent={
              !loading && !error ? (
                <Text style={styles.empty}>Sin movimientos para este filtro.</Text>
              ) : null
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoad}>
                  <ActivityIndicator color={colors.cyan} />
                </View>
              ) : !hasNext && items.length > 0 ? (
                <Text style={styles.endText}>· fin del historial ·</Text>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Fila de movimiento ───────────────────────────────────────────────────────

function ActivityRow({ a }: { a: ActivityItem }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/transaction-detail', params: { id: a.id } })}
    >
      <WalletGlyph wallet={a.wallet} size={36} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.title}>{a.title}</Text>
        <Text style={styles.sub}>
          {a.walletName} · {a.time}
        </Text>
      </View>
      <Text
        style={[styles.amount, { color: a.kind === 'in' ? colors.green : colors.text }]}
      >
        {a.kind === 'in' ? '+' : '-'}
        {fmt(Math.abs(a.amount))}
      </Text>
    </Pressable>
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
  count: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.dim,
    paddingHorizontal: 18,
    marginBottom: 2,
  },
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
  footerLoad: { paddingVertical: 18, alignItems: 'center' },
  endText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 0.5,
  },
  bucket: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.dim,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: colors.bg,
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
