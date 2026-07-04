// Enviar #1 — Buscar destinatario con contactos reales del Backend.
// Search input + grid horizontal de contactos frecuentes + lista vertical "Todos los contactos".
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ContactAvatar } from '@/components/ContactAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { type Contact } from '@/data/contacts';
import { colors, fonts } from '@/theme/tokens';
import { getMisContactos, type BackendContact } from '@/api/contactos';

// Paleta determinista para asignar colores suaves a los contactos dinámicos del BE
const PALETTE = ['#E08A55', '#A259FF', '#00F0FF', '#00FF85', '#FF4B4B', '#FFD600'];

export default function SendRecipient() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<(Contact & { cuentaDestinoId?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await getMisContactos();

        // Mapeamos los campos del Backend al contrato visual del Frontend
        const mapped = data.map((bc) => {
          const name = bc.nombre || 'Sin Nombre';
          const parts = name.trim().split(' ');
          const initials = parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0] ? parts[0][0].toUpperCase() : '??';

          const color = PALETTE[bc.usuarioContactoId % PALETTE.length];
          const handle = bc.email ? `@${bc.email.split('@')[0]}` : '@usuario';

          return {
            id: String(bc.usuarioContactoId),
            name,
            handle,
            initials,
            color,
            cuentaDestinoId: bc.cuentaDestinoId
          };
        });

        setContacts(mapped);
      } catch (err) {
        console.error('Error al cargar contactos reales:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q),
    );
  }, [query, contacts]);

  function pick(c: Contact & { cuentaDestinoId?: number }) {
    // Inyectamos todas las propiedades reales en los params de navegación para la cadena completa del flujo
    router.push({
      pathname: '/(send)/amount',
      params: {
        to: c.id,
        name: c.name,
        initials: c.initials,
        color: c.color,
        cuentaDestinoId: c.cuentaDestinoId ? String(c.cuentaDestinoId) : ''
      }
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
              placeholder="Buscar nombre, usuario o email"
              placeholderTextColor={colors.dim}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={colors.cyan} size="large" />
              <Text style={styles.loaderText}>Cargando contactos de la red...</Text>
            </View>
          ) : (
            <>
              {contacts.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.freqRow}
                  style={{ marginHorizontal: -18, paddingHorizontal: 18 }}
                >
                  {contacts.slice(0, 5).map(c => (
                    <Pressable key={c.id} style={styles.freqItem} onPress={() => pick(c)}>
                      <ContactAvatar initials={c.initials} color={c.color} size={48} />
                      <Text style={styles.freqName} numberOfLines={1}>
                        {c.name.split(' ')[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.sectionLabel}>TODOS LOS CONTACTOS</Text>

              {filtered.map(c => (
                <Pressable key={c.id} style={styles.contactRow} onPress={() => pick(c)}>
                  <ContactAvatar initials={c.initials} color={c.color} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactHandle}>{c.handle}</Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}

              {filtered.length === 0 ? (
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
  empty: { textAlign: 'center', color: colors.dim, fontFamily: fonts.body, fontSize: 13, marginTop: 18 },
  loaderContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  loaderText: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, marginTop: 12 }
});