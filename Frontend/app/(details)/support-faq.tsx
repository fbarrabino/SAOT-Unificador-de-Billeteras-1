// E2 · Preguntas frecuentes
// Acordeón: cada pregunta se expande/colapsa al tocarla, una a la vez.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type } from '@/theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo cargo dinero en mi billetera?',
    respuesta:
      'Andá a la sección Billeteras, elegí la billetera de destino y tocá "Cargar dinero". Podés vincular una tarjeta de débito/crédito o transferir desde tu banco.',
  },
  {
    pregunta: '¿Cuánto tarda en acreditarse una transferencia?',
    respuesta:
      'Las transferencias entre usuarios de la app son instantáneas. Las cargas desde banco pueden demorar hasta 24 horas hábiles en acreditarse.',
  },
  {
    pregunta: '¿Qué hago si no reconozco una transacción?',
    respuesta:
      'Andá al detalle de la transacción y tocá "Reportar problema". Elegí el motivo "No reconozco la transacción" y contanos qué pasó; nuestro equipo lo va a revisar.',
  },
  {
    pregunta: '¿Cómo cambio mi contraseña o PIN?',
    respuesta:
      'En tu perfil, entrá a Seguridad y ahí vas a encontrar las opciones para cambiar tu contraseña, PIN y demás métodos de acceso.',
  },
  {
    pregunta: '¿Tiene costo usar la app?',
    respuesta:
      'Crear una cuenta, recibir dinero y transferir entre billeteras propias es gratis. Algunas operaciones con bancos externos pueden tener un costo, que siempre se muestra antes de confirmar.',
  },
  {
    pregunta: '¿Cómo elimino una billetera conectada?',
    respuesta:
      'Entrá al detalle de la billetera desde la sección Billeteras y tocá "Desconectar". Esto no elimina el dinero, solo la conexión con la app.',
  },
];

export default function SupportFaqScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <View style={{ paddingTop: 48 }}>
        <ScreenHeader title="Preguntas frecuentes" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Respuestas rápidas a las dudas más comunes. Si no encontrás lo que buscás, contactá a soporte.
        </Text>

        <View style={styles.card}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <View key={item.pregunta} style={[styles.item, i < FAQ_ITEMS.length - 1 && styles.itemBorder]}>
                <Pressable style={styles.question} onPress={() => toggle(i)}>
                  <Text style={styles.questionText}>{item.pregunta}</Text>
                  <Feather
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isOpen ? colors.cyan : colors.dim}
                  />
                </Pressable>
                {isOpen && (
                  <Text style={styles.answerText}>{item.respuesta}</Text>
                )}
              </View>
            );
          })}
        </View>

        <Pressable style={styles.contactBtn} onPress={() => router.push('/support-contact')}>
          <Text style={styles.contactBtnText}>¿No encontraste tu respuesta? Contactar soporte</Text>
          <Feather name="chevron-right" size={18} color={colors.cyan} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  subtitle: {
    ...type.body,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
  },
  item: {
    paddingVertical: spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    ...type.bodyText,
    flex: 1,
    paddingRight: spacing.md,
  },
  answerText: {
    ...type.small,
    color: colors.muted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  contactBtnText: {
    ...type.bodyText,
    color: colors.cyan,
  },
});
