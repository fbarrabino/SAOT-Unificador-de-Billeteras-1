// Header de las pantallas transaccionales: ‹ Volver  •  Título centrado  •  ✕ cerrar.
// Sigue el patrón visual de ScreenHeader pero agrega un botón "close" a la derecha
// que dispara `onClose` (típicamente: volver a /(tabs)/home y abortar el flujo).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '@/theme/tokens';

type Props = {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
};

export function TxHeader({ title, onBack, onClose }: Props) {
  const back = onBack ?? (() => router.back());
  const close = onClose ?? (() => router.dismissAll?.() ?? router.replace('/(tabs)/home'));
  return (
    <View style={styles.row}>
      <Pressable onPress={back} style={styles.btn} hitSlop={8}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M15 5l-7 7 7 7"
            stroke={colors.text}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={close} style={styles.btnPlain} hitSlop={8}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M6 6l12 12M18 6L6 18"
            stroke={colors.muted}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  btn: {
    // Sin recuadro: se ve solo la flecha (área táctil de 38x38).
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlain: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
  },
});
