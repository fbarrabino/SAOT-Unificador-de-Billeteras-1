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
 * todas las plataformas. Cada capa es un gradiente diagonal que va de un color
 * translúcido a transparente, imitando un glow que sale de una esquina.
 *
 * Es responsive: usa StyleSheet.absoluteFill, así se adapta a cualquier tamaño
 * de pantalla sin depender de medidas fijas.
 */
export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      {/* Glow azul — esquina superior izquierda */}
      <LinearGradient
        colors={['rgba(40,90,160,0.55)', 'rgba(40,90,160,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.7 }}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow violeta — esquina superior derecha */}
      <LinearGradient
        colors={['rgba(120,80,200,0.45)', 'rgba(120,80,200,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.7 }}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow lime — costado derecho, algo más abajo */}
      <LinearGradient
        colors={['rgba(140,200,80,0.26)', 'rgba(140,200,80,0)']}
        start={{ x: 1, y: 0.42 }}
        end={{ x: 0.3, y: 0.95 }}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
