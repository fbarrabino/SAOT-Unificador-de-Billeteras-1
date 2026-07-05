import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii, type } from '@/theme/tokens';
import { forgotPassword } from '@/api/auth';
import { ApiError } from '@/api/client';

function LockIcon() {
  return (
    <View style={styles.iconTile}>
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 10V8a6 6 0 0112 0v2" />
        <Path d="M5 10h14v10H5z" />
      </Svg>
    </View>
  );
}

// Pantalla "olvidé mi contraseña": pide el email y dispara el envío del código de reset.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnviar = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email);
      router.push({ pathname: '/(auth)/email-sent', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 0
          ? 'Sin conexión al servidor.'
          : err.mensaje || 'No se pudo enviar el código.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="Recuperar contraseña" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LockIcon />
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.lead}>
            Te enviaremos un código de 6 dígitos al email para que puedas crear una nueva.
          </Text>

          <View style={{ marginTop: 24 }}>
            <Input
              label="Email"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={v => { setEmail(v); if (error) setError(null); }}
              editable={!isLoading}
            />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          <PrimaryButton
            label={isLoading ? 'Enviando...' : 'Enviar código'}
            onPress={handleEnviar}
            disabled={isLoading}
          />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingTop: 18, paddingBottom: 24, flexGrow: 1 },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radii.icon,
    backgroundColor: 'rgba(57,195,242,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: { ...type.display, fontSize: 26, marginBottom: 10 },
  lead: { ...type.body, lineHeight: 21 },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#f87171',
    lineHeight: 18,
  },
});
