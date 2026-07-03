import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

export type WalletGlyphKey = 'mp' | 'ua' | 'lm' | 'bb' | 'nx';

const LOGOS: Record<WalletGlyphKey, ImageSourcePropType> = {
  mp: require('../assets/wallets/mplogo.webp'),
  ua: require('../assets/wallets/ualalogo.webp'),
  lm: require('../assets/wallets/logolm.webp'),
  bb: require('../assets/wallets/brulogo.webp'),
  nx: require('../assets/wallets/nxlogo.webp'),
};

// Brubank y Lemon usan logos con fondo propio (oscuro), Mercado Pago / Ualá /
// Naranja X usan logos pensados sobre fondo blanco — los renderizamos sobre
// un círculo blanco para que se vean limpios.
const LOGOS_SOBRE_FONDO_CLARO: Record<WalletGlyphKey, boolean> = {
  mp: true,
  ua: true,
  nx: true,
  lm: false,
  bb: false,
};

type Props = {
  wallet: WalletGlyphKey;
  size?: number;
};

export function WalletGlyph({ wallet, size = 34 }: Props) {
  const fondoClaro = LOGOS_SOBRE_FONDO_CLARO[wallet];
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fondoClaro ? '#FFFFFF' : 'transparent',
        },
      ]}
    >
      <Image
        source={LOGOS[wallet]}
        style={
          fondoClaro
            ? { width: size * 0.82, height: size * 0.82 }
            : { width: size, height: size }
        }
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
