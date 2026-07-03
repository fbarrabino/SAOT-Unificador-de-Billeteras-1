// D6 · Change password
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, type } from '@/theme/tokens';
import { changePassword } from '@/api/auth';
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

export default function ChangePassword() {
  const [actual, setActual] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const long = pwd.length >= 8;
  const num = /\d/.test(pwd);
  const match = pwd.length > 0 && pwd === pwd2;
  const ready = actual.length > 0 && long && num && match;

  const handleGuardar = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await changePassword(actual, pwd);
      setSuccess(true);
      setTimeout(() => router.back(), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.mensaje : 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <View style={{ paddingTop: 48 }}>
        <ScreenHeader title="Cambiar contraseña" />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          Ingresá tu contraseña actual y elegí una nueva.
        </Text>

        <View style={{ marginTop: 18 }}>
          <Input
            label="Contraseña actual"
            placeholder="••••••••"
            password
            value={actual}
            onChangeText={v => { setActual(v); if (error) setError(null); }}
            editable={!isLoading}
          />
          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            password
            value={pwd}
            onChangeText={v => { setPwd(v); if (error) setError(null); }}
            editable={!isLoading}
          />
          <Input
            label="Confirmar nueva contraseña"
            placeholder="Repetí la contraseña"
            password
            value={pwd2}
            onChangeText={v => { setPwd2(v); if (error) setError(null); }}
            editable={!isLoading}
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

        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Contraseña actualizada correctamente.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingTop: 14 },
  lead: { ...type.body, lineHeight: 20 },
  rules: { gap: 8, marginTop: 14 },
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
  successBanner: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.green,
    lineHeight: 18,
  },
  footer: { padding: 20 },
});
