import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CodeInput } from '@/components/CodeInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { forgotPassword } from '@/api/auth';
import { ApiError } from '@/api/client';

// Pantalla de ingreso del código de 6 dígitos; lo pasa a la pantalla de nueva contraseña.
export default function ResetCode() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // La validación real del código ocurre en /reset-password junto con la
  // nueva contraseña (el backend no tiene un endpoint separado para "solo
  // verificar" el código); acá lo llevamos como parámetro a la próxima pantalla.
  const handleContinuar = () => {
    router.push({ pathname: '/(auth)/reset-new-password', params: { email, codigo: code } });
  };

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

  // Contenido de la pantalla. Se envuelve en TouchableWithoutFeedback SOLO en
  // nativo (ver abajo); en web ese wrapper roba el foco de las casillas.
  const content = (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Restablecer contraseña" />
      <View style={styles.body}>
        <Text style={styles.title}>Ingresá el código</Text>
        <Text style={styles.lead}>Te enviamos un código de 6 dígitos al email.</Text>

        <View style={{ marginTop: 28 }}>
          <CodeInput length={6} onChange={setCode} />
        </View>

        <Pressable onPress={handleResend} style={styles.resend} disabled={isResending}>
          <Text style={styles.resendText}>{isResending ? 'Reenviando...' : 'Reenviar código'}</Text>
        </Pressable>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Verificar código"
          onPress={handleContinuar}
          disabled={code.length < 6}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
        >
          {/* En web, envolver todo en TouchableWithoutFeedback + Keyboard.dismiss
              roba el foco al tocar las casillas (el click burbujea y hace blur),
              impidiendo escribir el código. Por eso el "tocar afuera para cerrar
              el teclado" queda solo en nativo, donde el TextInput retiene el gesto. */}
          {Platform.OS === 'web' ? (
            content
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              {content}
            </TouchableWithoutFeedback>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 20, paddingTop: 18 },
  title: { ...type.display, fontSize: 24, marginBottom: 6 },
  lead: { ...type.body, lineHeight: 20 },
  resend: { alignSelf: 'center', marginTop: 26, paddingVertical: 8 },
  resendText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
  feedback: { ...type.body, fontSize: 12.5, color: colors.muted, marginTop: 4, textAlign: 'center' },
  footer: { padding: 20 },
});
