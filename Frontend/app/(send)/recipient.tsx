// Enviar #1 — Buscar destinatario entre los contactos REALES del teléfono que ya
// usan SaOT. Pide permiso de contactos, cruza la agenda (email + teléfono) con los
// usuarios registrados (matchContactos) y, al elegir uno, sigue a la pantalla de
// selección de billetera del destinatario. En web el navegador no accede a la
// agenda → se usa una lista demo con los emails de las cuentas de presentación.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Contacts from 'expo-contacts';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ContactAvatar } from '@/components/ContactAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, fonts } from '@/theme/tokens';
import { matchContactos, type MatchContact } from '@/api/contactos';

// Paleta determinista para colorear los avatares de los contactos.
const PALETTE = ['#E08A55', '#A259FF', '#00F0FF', '#00FF85', '#FF4B4B', '#FFD600'];

type PhoneContact = { name: string; email?: string; phone?: string };

// Contactos simulados para la demo WEB (el navegador no accede a la agenda).
// Incluyen los emails de las cuentas demo para que el cruce muestre coincidencias.
const WEB_DEMO_CONTACTS: PhoneContact[] = [
  { name: 'Fabri (demo)', email: 'fabrisaot@gmail.com' },
  { name: 'Franco (demo)', email: 'francosaot@gmail.com' },
  { name: 'Lautaro (demo)', email: 'lautarosaot@gmail.com' },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || '??').toUpperCase();
}

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function SendRecipient() {
  const [query, setQuery] = useState('');
  const [appUsers, setAppUsers] = useState<MatchContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        let phone: PhoneContact[] = [];

        if (Platform.OS === 'web') {
          phone = WEB_DEMO_CONTACTS;
        } else {
          const { status } = await Contacts.requestPermissionsAsync();
          if (status !== 'granted') {
            if (!cancelled) {
              setDenied(true);
              setLoading(false);
            }
            return;
          }
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Emails, Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          });
          phone = data.map((c) => ({
            name: c.name || 'Sin nombre',
            email: c.emails?.[0]?.email?.trim().toLowerCase(),
            phone: c.phoneNumbers?.[0]?.number?.trim(),
          }));
        }

        // Cruzamos por email Y teléfono con los usuarios registrados de SaOT.
        const emails = phone.map((p) => p.email).filter((e): e is string => !!e);
        const telefonos = phone.map((p) => p.phone).filter((t): t is string => !!t);
        const matches = emails.length || telefonos.length ? await matchContactos(emails, telefonos) : [];

        if (!cancelled) {
          setAppUsers(matches);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[send/recipient] error al leer/cruzar contactos:', err);
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appUsers;
    return appUsers.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [query, appUsers]);

  function pick(u: MatchContact) {
    // Vamos al selector de billetera del destinatario con su usuarioId real.
    router.push({
      pathname: '/(send)/pick-wallet',
      params: {
        to: String(u.usuarioId),
        usuarioId: String(u.usuarioId),
        name: u.nombre,
        initials: initialsOf(u.nombre),
        color: colorFor(u.email),
      },
    });
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="Enviar a" />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchWrap}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke={colors.muted} strokeWidth={2} />
              <Path d="M20 20l-3.5-3.5" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar nombre o email"
              placeholderTextColor={colors.dim}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.cyan} size="large" />
              <Text style={styles.centerText}>Buscando contactos que usan SaOT…</Text>
            </View>
          ) : denied ? (
            <View style={styles.center}>
              <Feather name="lock" size={28} color={colors.dim} />
              <Text style={styles.centerText}>
                No nos diste permiso a los contactos. Podés habilitarlo desde los ajustes del teléfono para enviar dinero a tu agenda.
              </Text>
            </View>
          ) : (
            <>
              {appUsers.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.freqRow}
                  style={{ marginHorizontal: -18, paddingHorizontal: 18 }}
                >
                  {appUsers.slice(0, 5).map((u) => (
                    <Pressable key={u.usuarioId} style={styles.freqItem} onPress={() => pick(u)}>
                      <ContactAvatar initials={initialsOf(u.nombre)} color={colorFor(u.email)} size={48} />
                      <Text style={styles.freqName} numberOfLines={1}>
                        {u.nombre.split(' ')[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.sectionLabel}>TUS CONTACTOS QUE USAN SAOT</Text>

              {filtered.map((u) => (
                <Pressable key={u.usuarioId} style={styles.contactRow} onPress={() => pick(u)}>
                  <ContactAvatar initials={initialsOf(u.nombre)} color={colorFor(u.email)} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactName}>{u.nombre}</Text>
                    <Text style={styles.contactHandle}>{u.email}</Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}

              {appUsers.length === 0 ? (
                <Text style={styles.empty}>
                  Ninguno de tus contactos usa SaOT todavía. Invitalos desde “Conectá tus contactos”.
                </Text>
              ) : filtered.length === 0 ? (
                <Text style={styles.empty}>No encontramos contactos para "{query}".</Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 80 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 2,
  },
  freqRow: { gap: 14, paddingTop: 16, paddingRight: 18 },
  freqItem: { alignItems: 'center', width: 64, gap: 6 },
  freqName: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.dim,
    marginTop: 18,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
  contactName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  contactHandle: { fontFamily: fonts.body, fontSize: 12, color: colors.dim, marginTop: 2 },
  chev: { fontFamily: fonts.body, fontSize: 18, color: colors.dim, marginLeft: 8 },
  empty: { textAlign: 'center', color: colors.dim, fontFamily: fonts.body, fontSize: 13, marginTop: 18, paddingHorizontal: 20, lineHeight: 19 },
  center: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, textAlign: 'center', paddingHorizontal: 24, lineHeight: 19 },
});
