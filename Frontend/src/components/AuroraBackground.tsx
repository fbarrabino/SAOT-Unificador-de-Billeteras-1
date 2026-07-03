import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';

/**
 * Fondo "aurora" (glows difuminados sobre negro).
 *
 * Antes usaba react-native-svg con RadialGradient, que NO renderiza de forma
 * confiable en emuladores/dev-builds (aparecía todo negro) aunque sí funcionaba
 * en Expo Go. Ahora se arma con expo-linear-gradient, que renderiza idéntico en
 * emulador, Expo Go y web.
 *
 * Los colores son EXACTAMENTE los del fondo original (#285AA0 azul, #7850C8
 * violeta, #8CC850 lime). Para que quede tan oscuro como el diseño original, el
 * color se apaga temprano (locations [0, 0.4]) → el glow queda concentrado en la
 * esquina y el resto de la pantalla se mantiene negro (no "lavado").
 *
 * Es responsive: StyleSheet.absoluteFill se adapta a cualquier tamaño.
 */
export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      {/* Glow azul — esquina superior izquierda */}
      <LinearGradient
        colors={['rgba(40,90,160,0.5)', 'rgba(40,90,160,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.95, y: 0.7 }}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow violeta — esquina superior derecha */}
      <LinearGradient
        colors={['rgba(120,80,200,0.42)', 'rgba(120,80,200,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.7 }}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow lime — costado derecho, algo más abajo */}
      <LinearGradient
        colors={['rgba(140,200,80,0.2)', 'rgba(140,200,80,0)']}
        start={{ x: 0.95, y: 0.42 }}
        end={{ x: 0.3, y: 1 }}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
