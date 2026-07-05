import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, fonts } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
};

// Botón secundario tipo "login social" (borde tenue, sin gradiente).
export function SocialButton({ label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.text,
  },
});
