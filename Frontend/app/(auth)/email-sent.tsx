import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { forgotPassword } from '@/api/auth';
import { ApiError } from '@/api/client';

function MailCheck() {
  return (
    <View style={styles.iconWrap}>
      <Svg width={42} height={42} viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 6h16v12H4z" />
        <Path d="M4 7l8 6 8-6" />
      </Svg>
    </View>
  );
}

export default function EmailSent() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await forgotPassword(email);
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
        <ScreenHeader title="Recuperar contraseña" />
        <View style={styles.body}>
          <MailCheck />
          <Text style={styles.title}>Email enviado</Text>
          <Text style={styles.lead}>
            Revisá tu casilla: te enviamos un código de 6 dígitos. Puede tardar unos minutos.
          </Text>

          <Pressable onPress={handleResend} style={styles.resend} disabled={isResending}>
            <Text style={styles.resendText}>{isResending ? 'Reenviando...' : 'Reenviar código'}</Text>
          </Pressable>

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Ingresé el código"
            onPress={() => router.push({ pathname: '/(auth)/reset-code', params: { email } })}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: 'rgba(57,195,242,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { ...type.display, fontSize: 26, marginBottom: 10, textAlign: 'center' },
  lead: { ...type.body, textAlign: 'center', lineHeight: 21, marginBottom: 22 },
  resend: { paddingVertical: 8 },
  resendText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
  feedback: { ...type.body, fontSize: 12.5, color: colors.muted, marginTop: 8, textAlign: 'center' },
  footer: { padding: 20 },
});
