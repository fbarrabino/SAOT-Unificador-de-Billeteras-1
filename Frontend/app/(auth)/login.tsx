import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { useSession } from '@/context/SessionContext';

export default function Login() {
  // A5 — venimos del signup con el email precargado y un flag de "recién creada".
  const params = useLocalSearchParams<{ email?: string; justRegistered?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [showRegistered, setShowRegistered] = useState(params.justRegistered === '1');

  const { login, isLoading, isAuthenticated, error, clearError } = useSession();

  // Cuando el login es exitoso, el contexto actualiza isAuthenticated.
  // Navegamos desde acá para no mezclar lógica de sesión con navegación.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  // Limpiamos el error cuando el usuario empieza a editar los campos
  const handleEmailChange = (v: string) => {
    setEmail(v);
    setShowRegistered(false);
    if (error) clearError();
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (error) clearError();
  };

  const handleLogin = async () => {
    try {
      await login(email, password);
      // La navegación la maneja el useEffect de arriba
    } catch {
      // El error ya fue guardado en el contexto (SessionContext.login lo setea)
      // No hacemos nada extra acá — el mensaje se muestra en el banner de abajo
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.iconWrap}>
            <AppIcon size={72} />
          </View>

          <Text style={styles.title}>Hola de nuevo</Text>
          <Text style={styles.subtitle}>
            Ingresá para ver tus billeteras y operar desde un solo lugar.
          </Text>

          <View style={styles.form}>
            {showRegistered ? (
              <View style={styles.okBanner}>
                <Text style={styles.okText}>
                  ¡Cuenta creada! Ingresá con tu email y contraseña.
                </Text>
              </View>
            ) : null}

            <Input
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="tu@email.com"
              editable={!isLoading}
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={handlePasswordChange}
              password
              placeholder="••••••••"
              editable={!isLoading}
            />

            {/* Banner de error — solo visible cuando hay un error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.forgotWrap} disabled={isLoading}>
                <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </Link>

            <PrimaryButton
              label={isLoading ? '' : 'Ingresar'}
              onPress={handleLogin}
              style={{ marginTop: 8 }}
              disabled={isLoading}
            />

            {/* Spinner superpuesto al botón mientras carga */}
            {isLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={colors.cyan} size="small" />
                <Text style={styles.loadingText}>Verificando credenciales...</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>¿No tenés cuenta? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable disabled={isLoading}>
                <Text style={styles.footerLink}>Crear cuenta</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 36,
    flexGrow: 1,
  },
  iconWrap: { alignItems: 'center', marginBottom: 22 },
  title: {
    ...type.display,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 18,
  },
  form: { marginTop: 6 },
  okBanner: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  okText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.green,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 2,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#f87171',
    lineHeight: 18,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgot: { ...type.link, fontSize: 13 },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerMuted: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
});
