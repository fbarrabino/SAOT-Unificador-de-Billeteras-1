import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { CodeInput } from '@/components/CodeInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { verifyEmail, resendVerificationEmail } from '@/api/auth';
import { ApiError } from '@/api/client';

export default function VerifyEmail() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const goHome = () => router.replace('/(tabs)/home');

  const handleVerificar = async () => {
    if (!email) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verifyEmail(email, code);
      goHome();
    } catch (err) {
      setError(err instanceof ApiError ? err.mensaje : 'Ocurrió un error inesperado.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setFeedback(null);
    setError(null);
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      setFeedback('Te reenviamos el código.');
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.mensaje : 'No se pudo reenviar el código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={styles.title}>Verificá tu email</Text>
          <Text style={styles.lead}>
            Te enviamos un código de 6 dígitos a {email ?? 'tu email'} para confirmar tu cuenta.
          </Text>

          <View style={{ marginTop: 28 }}>
            <CodeInput length={6} onChange={setCode} />
          </View>

          <Pressable onPress={handleResend} style={styles.resend} disabled={isResending}>
            <Text style={styles.resendText}>{isResending ? 'Reenviando...' : 'Reenviar código'}</Text>
          </Pressable>

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={isVerifying ? 'Verificando...' : 'Verificar código'}
            onPress={handleVerificar}
            disabled={code.length < 6 || isVerifying}
          />
          <Pressable onPress={goHome} style={styles.skip} disabled={isVerifying}>
            <Text style={styles.skipText}>Verificar más tarde</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 20, paddingTop: 48 },
  title: { ...type.display, fontSize: 24, marginBottom: 6 },
  lead: { ...type.body, lineHeight: 20 },
  resend: { alignSelf: 'center', marginTop: 26, paddingVertical: 8 },
  resendText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
  feedback: { ...type.body, fontSize: 12.5, color: colors.muted, marginTop: 4, textAlign: 'center' },
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
  footer: { padding: 20 },
  skip: { alignSelf: 'center', marginTop: 14, paddingVertical: 6 },
  skipText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
