import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';

/**
 * Fondo "aurora" (glows difuminados sobre negro) — MISMO en toda la app.
 *
 * Se arma con expo-linear-gradient (renderiza igual en teléfono, emulador y web;
 * la versión con react-native-svg RadialGradient quedaba negra en emulador).
 * Colores EXACTOS del diseño original: #285AA0 azul, #7850C8 violeta, #8CC850 lime.
 *
 * IMPORTANTE: cada glow ARRANCA en una esquina. En un gradiente lineal, todo lo
 * que queda "antes" del punto de inicio se pinta con el color inicial a full; si
 * el inicio estaba en el medio de la pantalla, el color sangraba hacia atrás y
 * teñía todo (por eso antes el teléfono se veía todo verde). Anclado a esquinas
 * no hay sangrado: azul arriba-izq, violeta arriba-der, lime sutil abajo-der.
 */
export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      {/* Azul — esquina superior izquierda */}
      <LinearGradient
        colors={['rgba(40,90,160,0.5)', 'rgba(40,90,160,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.55 }}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Violeta — esquina superior derecha */}
      <LinearGradient
        colors={['rgba(120,80,200,0.45)', 'rgba(120,80,200,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.55 }}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Lime — esquina inferior derecha, sutil, hacia el centro (sin teñir arriba) */}
      <LinearGradient
        colors={['rgba(140,200,80,0.22)', 'rgba(140,200,80,0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.25, y: 0.4 }}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
