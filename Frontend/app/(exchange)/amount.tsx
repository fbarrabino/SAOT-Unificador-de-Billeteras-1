// Cambiar #1 — Selector Desde/Hacia + monto.
// Reglas (de saot-demo.js): origen ≠ destino, monto > 0, monto ≤ saldo de origen.
// Comisión fija: 0.3% (saot demo usa 0.3%; lo aproximamos para el mock).
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AmountDisplay } from '@/components/AmountDisplay';
import { NumericKeypad } from '@/components/NumericKeypad';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { type Wallet, type WalletKey } from '@/data/wallets';
import { amountValue, fmt, fmtCompact } from '@/utils/format';
import { colors, fonts, gradients, radii, shadow } from '@/theme/tokens';
import { useWallets } from '@/context/WalletsContext';

// Sin comisión: el cambio entre billeteras del mismo usuario llega neto
// (el backend mueve el monto completo). FEE_RATE queda en 0.
const FEE_RATE = 0;

export default function ExchangeAmount() {
  const [from, setFrom] = useState<WalletKey>('mp');
  const [to, setTo] = useState<WalletKey>('lm');
  const [amt, setAmt] = useState('250');
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  // ── Swap animado (tocar el botón del medio intercambia Desde ↔ A) ───────────
  // Medimos la posición Y de cada slot para que el cruce recorra la distancia
  // exacta entre ellos. `progress` (0→1) desliza el de arriba hacia abajo y el
  // de abajo hacia arriba; al terminar, aplicamos el swap de estado y reseteamos.
  const progress = useRef(new Animated.Value(0)).current;
  const fromY = useRef<number | null>(null);
  const toY = useRef<number | null>(null);
  const [dist, setDist] = useState(0);
  const [animating, setAnimating] = useState(false);
  const swapping = useRef(false);

  function measure(which: 'from' | 'to') {
    return (e: LayoutChangeEvent) => {
      const y = e.nativeEvent.layout.y;
      if (which === 'from') fromY.current = y;
      else toY.current = y;
      if (fromY.current != null && toY.current != null) {
        setDist(Math.abs(toY.current - fromY.current));
      }
    };
  }

  function doSwap() {
    if (swapping.current) return;
    setPicker(null);

    // Aún sin medir: intercambio instantáneo (sin animación) para no romper el flujo.
    if (dist <= 0) {
      setFrom(to);
      setTo(from);
      return;
    }

    swapping.current = true;
    setAnimating(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setFrom(to);
        setTo(from);
      }
      progress.setValue(0);
      swapping.current = false;
      setAnimating(false);
    });
  }

  const fromTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dist] });
  const toTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -dist] });
  const iconRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  // Saldos REALES del contexto (no mock) → se actualizan tras cada cambio.
  const { wallets } = useWallets();
  const fromWallet = wallets.find(w => w.key === from) ?? wallets[0];
  const toWallet = wallets.find(w => w.key === to) ?? wallets.find(w => w.key !== from) ?? wallets[0];
  const n = amountValue(amt);
  const fee = useMemo(() => +(n * FEE_RATE).toFixed(2), [n]);
  const willReceive = +Math.max(0, n - fee).toFixed(2);

  const sameWallet = fromWallet && toWallet ? fromWallet.key === toWallet.key : from === to;
  const insufficient = fromWallet ? n > fromWallet.bal : false;
  const valid = !!fromWallet && !!toWallet && n > 0 && !insufficient && !sameWallet;

  const ctaLabel = sameWallet
    ? 'Elegí billeteras distintas'
    : n <= 0
    ? 'Elegí un monto'
    : insufficient
    ? 'Saldo insuficiente'
    : 'Revisar cambio';

  function next() {
    if (!valid) return;
    // Usamos las claves ya resueltas (fromWallet/toWallet), no el estado crudo
    // from/to: esos pueden seguir apuntando a un default ('mp'/'lm') que no
    // está entre las billeteras reales del usuario, mientras que fromWallet/
    // toWallet ya cayeron al fallback correcto (la billetera que sí existe).
    router.push({
      pathname: '/(exchange)/confirm',
      params: { from: fromWallet.key, to: toWallet.key, amt: String(n), fee: String(fee) },
    });
  }

  function pickWallet(k: WalletKey) {
    if (picker === 'from') {
      setFrom(k);
      if (k === to) setTo(wallets.find(w => w.key !== k)?.key ?? k);
    } else if (picker === 'to') {
      setTo(k);
      if (k === from) setFrom(wallets.find(w => w.key !== k)?.key ?? k);
    }
    setPicker(null);
  }

  // Con menos de 2 billeteras no se puede cambiar.
  if (!fromWallet || !toWallet) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScreenHeader title="Cambiar" />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: colors.muted, textAlign: 'center', fontFamily: fonts.body, fontSize: 14 }}>
              Necesitás al menos 2 billeteras conectadas para cambiar dinero entre ellas.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="Cambiar" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            onLayout={measure('from')}
            style={{ transform: [{ translateY: fromTranslate }], zIndex: animating ? 2 : 0, elevation: animating ? 2 : 0 }}
          >
            <WalletSlot
              role="Desde"
              wallet={fromWallet}
              onPick={() => setPicker(p => (p === 'from' ? null : 'from'))}
              picking={picker === 'from'}
            />
          </Animated.View>

          <Pressable style={styles.swap} onPress={doSwap} hitSlop={16} accessibilityLabel="Intercambiar billeteras">
            <Animated.View style={[styles.swapBtn, { transform: [{ rotate: iconRotate }] }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M4 8h13l-3-3M20 16H7l3 3" stroke={colors.cyan} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </Pressable>

          <Animated.View
            onLayout={measure('to')}
            style={{ transform: [{ translateY: toTranslate }], zIndex: animating ? 1 : 0, elevation: animating ? 1 : 0 }}
          >
            <WalletSlot
              role="A"
              wallet={toWallet}
              onPick={() => setPicker(p => (p === 'to' ? null : 'to'))}
              picking={picker === 'to'}
            />
          </Animated.View>

          {picker ? (
            <View style={styles.pickList}>
              {wallets.map(w => (
                <Pressable
                  key={w.key}
                  onPress={() => pickWallet(w.key)}
                  style={styles.pickItem}
                >
                  <WalletGlyph wallet={w.key} size={26} />
                  <Text style={styles.pickName}>{w.name}</Text>
                  <Text style={styles.pickBal}>{fmt(w.bal)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.amtLabel}>Monto</Text>
          <AmountDisplay text={fmtCompact(n)} size={56} variant="plain" />
          <Text style={styles.computed}>
            Recibirás <Text style={{ color: colors.text }}>{fmt(willReceive)}</Text> · sin comisión
          </Text>

          <View style={{ marginTop: 12 }}>
            <NumericKeypad value={amt} onChange={setAmt} />
          </View>

          <View style={[shadow.cta, { borderRadius: radii.button, marginTop: 14 }]}>
            <Pressable disabled={!valid} onPress={next}>
              {valid ? (
                <LinearGradient
                  colors={gradients.lime}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>{ctaLabel}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.ctaDisabled}>
                  <Text style={[styles.ctaText, { color: colors.dim }]}>{ctaLabel}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function WalletSlot({
  role,
  wallet,
  onPick,
  picking,
}: {
  role: string;
  wallet: Wallet;
  onPick: () => void;
  picking: boolean;
}) {
  return (
    <Pressable onPress={onPick} style={[styles.slot, picking && { borderColor: colors.cyan }]}>
      <WalletGlyph wallet={wallet.key} size={34} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.slotRole}>{role}</Text>
        <Text style={styles.slotName}>{wallet.name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.slotBalLbl}>Balance</Text>
        <Text style={styles.slotBalVal}>{fmt(wallet.bal)}</Text>
      </View>
      <View style={styles.chev}>
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  slotRole: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  slotName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginTop: 1 },
  slotBalLbl: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },
  slotBalVal: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, marginTop: 1 },
  chev: { width: 22, alignItems: 'center', marginLeft: 6 },
  swap: { alignItems: 'center', marginVertical: -10, zIndex: 1 },
  swapBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickList: {
    marginTop: 8,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
  pickName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  pickBal: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  amtLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
  },
  computed: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.dim,
    textAlign: 'center',
    marginTop: 4,
  },
  cta: {
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ctaText },
});
