import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuroraBackground } from './AuroraBackground';
import { AppIcon } from './AppIcon';
import { fonts, colors } from '@/theme/tokens';

/** Pantalla de carga inicial: se muestra mientras cargan fuentes/sesión (ver _layout.tsx). */
export function SplashScreen() {
  return (
    <View style={styles.root}>
      <AuroraBackground />
      <AppIcon size={96} />
      <Text style={styles.title}>SaOT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 18,
  },
});
