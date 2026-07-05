import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, type } from '@/theme/tokens';

function CheckBig() {
  return (
    <View style={styles.iconWrap}>
      <Svg width={56} height={56} viewBox="0 0 24 24">
        <Path
          d="M5 12l5 5 9-12"
          stroke={colors.green}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// Pantalla de éxito tras cambiar la contraseña; lleva de vuelta al login.
export default function ResetSuccess() {
  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <CheckBig />
          <Text style={styles.title}>¡Listo!</Text>
          <Text style={styles.lead}>
            Tu contraseña se actualizó correctamente. Ya podés ingresar a tu cuenta.
          </Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton label="Ingresar" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: { ...type.display, fontSize: 30, marginBottom: 12, textAlign: 'center' },
  lead: { ...type.body, textAlign: 'center', lineHeight: 21 },
  footer: { padding: 20 },
});
