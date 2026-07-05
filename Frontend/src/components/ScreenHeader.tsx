import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, type } from '@/theme/tokens';

// Encabezado de pantalla: flecha de volver (usa onBack o el back del router) + título centrado.
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.btn} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.push('/')))}>
        <Feather name="chevron-left" size={24} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      {/* Espacio invisible puro para mantener el título centrado flex, sin bordes fantasma */}
      <View style={styles.emptySpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  btn: {
    // Área táctil de 40x40 pero SIN recuadro: se ve solo la flecha.
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.h4,
    fontSize: 16,
  },
  emptySpace: {
    width: 40,
    height: 40,
  }
});