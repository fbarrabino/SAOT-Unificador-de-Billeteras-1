import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';

/**
 * Fondo "aurora" (glows difuminados sobre negro) — MISMO en toda la app.
 *
 * Se arma con expo-linear-gradient (renderiza idéntico en emulador, Expo Go y
 * web; la versión vieja con react-native-svg RadialGradient quedaba negra en el
 * emulador). Colores EXACTOS del diseño original: #285AA0 azul, #7850C8 violeta,
 * #8CC850 lime.
 *
 * Layout imitando la referencia: azul arriba-izquierda, violeta arriba-derecha
 * y un glow lime hacia el centro-derecha/abajo. Los glows son suaves (se apagan
 * a mitad de camino) y la parte inferior queda oscura.
 */
export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      {/* Glow azul — arriba a la izquierda */}
      <LinearGradient
        colors={['rgba(40,90,160,0.5)', 'rgba(40,90,160,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.6 }}
        locations={[0, 0.5]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow violeta — arriba a la derecha */}
      <LinearGradient
        colors={['rgba(120,80,200,0.45)', 'rgba(120,80,200,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.6 }}
        locations={[0, 0.5]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow lime — costado derecho hacia el centro/abajo */}
      <LinearGradient
        colors={['rgba(140,200,80,0.32)', 'rgba(140,200,80,0)']}
        start={{ x: 0.9, y: 0.45 }}
        end={{ x: 0.15, y: 1 }}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
