import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OTLogo } from './OTLogo';
import { gradients } from '@/theme/tokens';

type Props = {
  size?: number;
};

// Ícono de la app: tile redondeado con gradiente lima y el logo OT centrado.
export function AppIcon({ size = 72 }: Props) {
  const radius = Math.round(size * 0.28);
  return (
    <View
      style={[
        styles.shadow,
        { width: size, height: size, borderRadius: radius, shadowRadius: size * 0.5 },
      ]}
    >
      <LinearGradient
        colors={gradients.lime}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tile, { width: size, height: size, borderRadius: radius }]}
      >
        <OTLogo size={size * 0.42} color="#06121A" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#B6F04B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    elevation: 12,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
