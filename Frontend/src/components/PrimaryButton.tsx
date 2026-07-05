import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, shadow, type } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

// Botón principal (CTA) con gradiente cian y glow; versión atenuada cuando está disabled.
export function PrimaryButton({ label, onPress, disabled, style }: Props) {
  if (disabled) {
    return (
      <Pressable disabled style={[styles.disabled, style]}>
        <Text style={[type.button, { color: colors.dim }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={[shadow.cta, { borderRadius: radii.button }, style]}>
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.12)' }}>
        <LinearGradient
          colors={gradients.cyan}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <Text style={type.button}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  disabled: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
