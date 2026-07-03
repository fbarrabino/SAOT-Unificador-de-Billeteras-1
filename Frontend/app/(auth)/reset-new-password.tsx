import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { resetPassword } from '@/api/auth';
import { ApiError } from '@/api/client';

function Rule({ ok, text }: { ok?: boolean; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={11} stroke={ok ? colors.green : colors.dim} strokeWidth={2} fill="none" />
        {ok ? (
          <Path
            d="M7 12l3 3 7-7"
            stroke={colors.green}
            strokeWidth={2.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
      <Text style={[styles.ruleText, ok && { color: colors.green }]}>{text}</Text>
    </View>
  );
}

export default function ResetNewPassword() {
  const { email, codigo } = useLocalSearchParams<{ email: string; codigo: string }>();
  const [pwd, setPwd] = React.useState('');
  const [pwd2, setPwd2] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const long = pwd.length >= 8;
  const num = /\d/.test(pwd);
  const match = pwd.length > 0 && pwd === pwd2;
  const ready = long && num && match;

  const handleGuardar = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await resetPassword(email, codigo, pwd);
      router.push('/(auth)/reset-success');
    } catch (err) {
      setError(err instanceof ApiError ? err.mensaje : 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="Nueva contraseña" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Creá una nueva contraseña</Text>
          <Text style={styles.lead}>
            Elegí una contraseña segura que no hayas usado antes.
          </Text>

          <View style={{ marginTop: 22 }}>
            <Input
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              password
              value={pwd}
              onChangeText={setPwd}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repetí la contraseña"
              password
              value={pwd2}
              onChangeText={setPwd2}
            />
          </View>

          <View style={styles.rules}>
            <Rule ok={long} text="Al menos 8 caracteres" />
            <Rule ok={num} text="Incluye un número" />
            <Rule ok={match} text="Las contraseñas coinciden" />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isLoading ? 'Guardando...' : 'Guardar contraseña'}
            onPress={handleGuardar}
            disabled={!ready || isLoading}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingTop: 14 },
  title: { ...type.display, fontSize: 24, marginBottom: 6 },
  lead: { ...type.body, lineHeight: 20 },
  rules: { gap: 8, marginTop: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
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
});
