import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, radii, type } from '@/theme/tokens';
import { register } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useSession } from '@/context/SessionContext';

// Pantalla de registro: crea el usuario, valida los campos e inicia sesión al terminar.
export default function Signup() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useSession();

  // Limpiamos errores al editar cualquier campo
  const clearErr = () => { if (error) setError(null); };

  const handleSignup = async () => {
    setError(null);

    // Validaciones locales
    if (!nombre.trim()) return setError('El nombre es obligatorio.');
    if (!apellido.trim()) return setError('El apellido es obligatorio.');
    if (!email.trim()) return setError('El email es obligatorio.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    if (!checked) return setError('Debés aceptar los términos y condiciones.');

    setIsLoading(true);
    try {
      // 1. Crear la cuenta (el backend ya dispara el código de verificación)
      await register(nombre.trim(), apellido.trim(), email.trim().toLowerCase(), password, telefono);
      // 2. Login automático para que quede autenticado de una
      await login(email.trim().toLowerCase(), password);
      // 3. Navegamos explícitamente (no vía useEffect(isAuthenticated)): esta
      // pantalla puede seguir montada debajo de /login en el stack, y un
      // efecto reactivo a isAuthenticated se dispararía en ambas a la vez,
      // generando una carrera que termina en /(tabs)/home en vez de acá.
      router.replace({ pathname: '/(auth)/verify-email', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      let mensaje: string;
      if (err instanceof ApiError) {
        switch (err.status) {
          case 0:
            mensaje = 'Sin conexión al servidor. Verificá tu red o que el backend esté activo.';
            break;
          case 400:
            mensaje = err.mensaje || 'Datos inválidos. Revisá los campos ingresados.';
            break;
          case 409:
            mensaje = 'Ya existe una cuenta con ese email.';
            break;
          case 500:
          case 502:
          case 503:
            mensaje = 'El servidor tuvo un problema interno. Intentá más tarde.';
            break;
          default:
            mensaje = err.mensaje || `Error inesperado (${err.status}).`;
        }
      } else if (err instanceof Error) {
        mensaje = err.message;
      } else {
        mensaje = 'Ocurrió un error desconocido al registrarse.';
      }
      setError(mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="Crear cuenta" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.lead}>Una sola cuenta para todas tus billeteras.</Text>

          <View style={styles.form}>
            <Input
              label="Nombre"
              placeholder="Tu nombre"
              autoCapitalize="words"
              value={nombre}
              onChangeText={v => { setNombre(v); clearErr(); }}
              editable={!isLoading}
            />
            <Input
              label="Apellido"
              placeholder="Tu apellido"
              autoCapitalize="words"
              value={apellido}
              onChangeText={v => { setApellido(v); clearErr(); }}
              editable={!isLoading}
            />
            <Input
              label="Email"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={v => { setEmail(v); clearErr(); }}
              editable={!isLoading}
            />
            <Input
              label="Teléfono (opcional)"
              placeholder="+54 9 3624 000000"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={telefono}
              onChangeText={v => { setTelefono(v); clearErr(); }}
              editable={!isLoading}
            />
            <Input
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              password
              value={password}
              onChangeText={v => { setPassword(v); clearErr(); }}
              editable={!isLoading}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repetí la contraseña"
              password
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); clearErr(); }}
              editable={!isLoading}
            />

            <Pressable
              style={styles.terms}
              onPress={() => { setChecked(c => !c); clearErr(); }}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked ? (
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path
                      d="M5 12l5 5 9-12"
                      stroke={colors.ctaText}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : null}
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.link}>Términos</Text> y la{' '}
                <Text style={styles.link}>Política de Privacidad</Text> de SaOT.
              </Text>
            </Pressable>

            {/* Banner de error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <PrimaryButton
            label={isLoading ? '' : 'Crear cuenta'}
            onPress={handleSignup}
            style={{ marginTop: 22 }}
            disabled={isLoading}
          />

          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.cyan} size="small" />
              <Text style={styles.loadingText}>Creando tu cuenta...</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>¿Ya tenés cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable disabled={isLoading}>
                <Text style={styles.footerLink}>Ingresar</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 32, flexGrow: 1 },
  lead: { ...type.body, marginBottom: 22 },
  form: {},
  terms: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  termsText: { flex: 1, color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  link: { color: colors.cyan, fontFamily: fonts.bodyBold },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#f87171',
    lineHeight: 18,
  },
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerMuted: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
});
