// Onboarding post-registro: ofrece conectar los contactos reales del teléfono
// (con permiso), cruzarlos con usuarios de la app (por email y teléfono) para
// agregarlos, invitar al resto y pedirles dinero por WhatsApp/SMS. En web el
// navegador no puede leer la agenda → se usa una lista demo.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Share,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ContactAvatar } from '@/components/ContactAvatar';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';
import { matchContactos, agregarContacto, type MatchContact } from '@/api/contactos';
import { useNotif } from '@/context/NotifContext';
import { useSession } from '@/context/SessionContext';

// Link de invitación/pago (placeholder para la demo).
const INVITE_LINK = 'https://saot.app';
const PALETTE = ['#E08A55', '#A259FF', '#00F0FF', '#00FF85', '#FF4B4B', '#FFD600'];

type PhoneContact = { id: string; name: string; email?: string; phone?: string };

// Contactos simulados para la demo WEB (el navegador no accede a la agenda).
// Incluye emails de las cuentas demo para que el cruce muestre coincidencias reales.
const WEB_DEMO_CONTACTS: PhoneContact[] = [
  { id: 'w1', name: 'Fabri (demo)', email: 'fabrisaot@gmail.com' },
  { id: 'w2', name: 'Franco (demo)', email: 'francosaot@gmail.com' },
  { id: 'w3', name: 'Lautaro (demo)', email: 'lautarosaot@gmail.com' },
  { id: 'w4', name: 'Sofía Gómez', email: 'sofia.gomez@example.com', phone: '+54 9 3624 111111' },
  { id: 'w5', name: 'Martín Díaz', phone: '+54 9 3624 222222' },
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

export default function ConnectContacts() {
  const { notify } = useNotif();
  const { usuario } = useSession();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [appUsers, setAppUsers] = useState<MatchContact[]>([]);
  const [invitables, setInvitables] = useState<PhoneContact[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);

  // Modal de "pedir dinero" a un contacto real por WhatsApp/SMS.
  const [requesting, setRequesting] = useState<PhoneContact | null>(null);
  const [monto, setMonto] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        let phone: PhoneContact[] = [];

        if (Platform.OS === 'web') {
          // Web: sin API de contactos → lista demo.
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
            id: c.id ?? Math.random().toString(36).slice(2),
            name: c.name || 'Sin nombre',
            email: c.emails?.[0]?.email?.trim().toLowerCase(),
            phone: c.phoneNumbers?.[0]?.number?.trim(),
          }));
        }

        // Cruzamos por email Y teléfono con los usuarios registrados.
        const emails = phone.map((p) => p.email).filter((e): e is string => !!e);
        const telefonos = phone.map((p) => p.phone).filter((t): t is string => !!t);
        const matches = emails.length || telefonos.length ? await matchContactos(emails, telefonos) : [];
        const matchedEmails = new Set(matches.map((m) => m.email.toLowerCase()));

        if (!cancelled) {
          setAppUsers(matches);
          // Invitables = contactos del teléfono que NO son usuarios (o sin email).
          setInvitables(phone.filter((p) => !p.email || !matchedEmails.has(p.email)));
          setLoading(false);
        }
      } catch (e) {
        console.warn('[connect-contacts] error al leer/cruzar contactos:', e);
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = () => router.replace('/(tabs)/home');

  async function handleAgregar(u: MatchContact) {
    setBusy(u.usuarioId);
    try {
      await agregarContacto(u.usuarioId);
      setAdded((prev) => new Set(prev).add(u.usuarioId));
      notify({ emoji: '✅', title: 'Contacto agregado', subtitle: u.nombre });
    } catch (e) {
      notify({ emoji: '⚠️', title: 'No se pudo agregar', subtitle: u.nombre });
    } finally {
      setBusy(null);
    }
  }

  async function handleInvitar(c: PhoneContact) {
    try {
      await Share.share({
        message: `¡Sumate a SaOT, la app que unifica todas tus billeteras! ${INVITE_LINK}`,
      });
    } catch {
      // El usuario canceló el share: no hacemos nada.
    }
  }

  // Abre WhatsApp (o SMS de fallback) con el pedido de dinero prellenado.
  async function enviarPedido(c: PhoneContact, montoStr: string) {
    const nombre = c.name.split(' ')[0];
    const miNombre = usuario?.nombre ?? 'Alguien';
    const montoTxt = montoStr.trim() ? `$${montoStr.trim()}` : 'un pago';
    const texto = `Hola ${nombre}, ${miNombre} te pide ${montoTxt} por SaOT 💸\nPagá o sumate acá: ${INVITE_LINK}`;

    const digits = (c.phone ?? '').replace(/\D/g, '');
    try {
      if (digits) {
        // wa.me abre WhatsApp si está instalado; si no, su versión web.
        await Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(texto)}`);
      } else {
        await Share.share({ message: texto });
      }
    } catch {
      // Fallback a SMS y, en último caso, al share nativo.
      try {
        const sep = Platform.OS === 'ios' ? '&' : '?';
        if (digits) await Linking.openURL(`sms:${digits}${sep}body=${encodeURIComponent(texto)}`);
        else await Share.share({ message: texto });
      } catch {
        await Share.share({ message: texto });
      }
    }
  }

  async function confirmarPedido() {
    const c = requesting;
    setRequesting(null);
    if (c) await enviarPedido(c, monto);
    setMonto('');
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.skip} onPress={finish} hitSlop={10}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <View style={styles.iconCircle}>
            <Feather name="users" size={26} color={colors.cyan} />
          </View>
          <Text style={styles.title}>Conectá tus contactos</Text>
          <Text style={styles.lead}>
            Encontrá quién de tu agenda ya usa SaOT para enviarle dinero al instante, invitá al resto y pediles plata por WhatsApp.
          </Text>
          {Platform.OS === 'web' ? (
            <Text style={styles.webNote}>
              Modo demo web · en el celular se leen tus contactos reales.
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.cyan} size="large" />
            <Text style={styles.loaderText}>Leyendo tus contactos…</Text>
          </View>
        ) : denied ? (
          <View style={styles.loader}>
            <Feather name="lock" size={28} color={colors.dim} />
            <Text style={styles.loaderText}>
              No nos diste permiso a los contactos. Podés hacerlo más tarde desde Ajustes.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {appUsers.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>YA USAN SAOT</Text>
                {appUsers.map((u) => {
                  const yaAgregado = added.has(u.usuarioId);
                  return (
                    <View key={u.usuarioId} style={styles.row}>
                      <ContactAvatar
                        initials={initialsOf(u.nombre)}
                        color={colorFor(u.email)}
                        size={44}
                      />
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{u.nombre}</Text>
                        <Text style={styles.rowSub}>{u.email}</Text>
                      </View>
                      <Pressable
                        style={[styles.actionBtn, yaAgregado && styles.actionBtnDone]}
                        onPress={() => !yaAgregado && handleAgregar(u)}
                        disabled={yaAgregado || busy === u.usuarioId}
                      >
                        {busy === u.usuarioId ? (
                          <ActivityIndicator color={colors.ctaText} size="small" />
                        ) : (
                          <Text style={[styles.actionText, yaAgregado && styles.actionTextDone]}>
                            {yaAgregado ? 'Agregado' : 'Agregar'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </>
            ) : null}

            {invitables.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>INVITAR / PEDIR</Text>
                {invitables.map((c) => (
                  <View key={c.id} style={styles.row}>
                    <ContactAvatar
                      initials={initialsOf(c.name)}
                      color={colorFor(c.email ?? c.id)}
                      size={44}
                    />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{c.name}</Text>
                      {c.email || c.phone ? (
                        <Text style={styles.rowSub}>{c.email ?? c.phone}</Text>
                      ) : null}
                    </View>
                    {c.phone ? (
                      <Pressable style={styles.askBtn} onPress={() => { setMonto(''); setRequesting(c); }}>
                        <Feather name="dollar-sign" size={13} color={colors.ctaText} />
                        <Text style={styles.askText}>Pedir</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.inviteBtn} onPress={() => handleInvitar(c)}>
                      <Feather name="send" size={13} color={colors.cyan} />
                    </Pressable>
                  </View>
                ))}
              </>
            ) : null}

            {appUsers.length === 0 && invitables.length === 0 ? (
              <Text style={styles.empty}>
                No encontramos contactos con email o teléfono para cruzar.
              </Text>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Pressable style={styles.doneBtn} onPress={finish}>
            <Text style={styles.doneText}>Listo</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Modal para pedir dinero por WhatsApp/SMS */}
      <Modal
        visible={requesting !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRequesting(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRequesting(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Pedir dinero</Text>
            <Text style={styles.modalSub}>
              A {requesting?.name ?? ''} por WhatsApp
            </Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountSign}>$</Text>
              <TextInput
                value={monto}
                onChangeText={setMonto}
                placeholder="0"
                placeholderTextColor={colors.dim}
                keyboardType="number-pad"
                style={styles.amountInput}
                autoFocus
              />
            </View>
            <Pressable style={styles.modalSend} onPress={confirmarPedido}>
              <Feather name="message-circle" size={16} color={colors.ctaText} />
              <Text style={styles.modalSendText}>Enviar pedido</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setRequesting(null)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: 8, alignItems: 'flex-end' },
  skip: { paddingVertical: 6, paddingHorizontal: 4 },
  skipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
  intro: { paddingHorizontal: spacing.xl, paddingTop: 4, paddingBottom: 8 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(57,195,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...type.display, fontSize: 24, marginBottom: 6 },
  lead: { ...type.body, lineHeight: 20 },
  webNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    marginTop: 8,
    fontStyle: 'italic',
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 },
  loaderText: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 12, paddingBottom: 20 },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.dim,
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
    gap: 8,
  },
  rowInfo: { flex: 1, marginLeft: 4 },
  rowName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.dim, marginTop: 2 },
  actionBtn: {
    backgroundColor: colors.cyan,
    borderRadius: radii.icon,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: 'center',
  },
  actionBtnDone: { backgroundColor: 'rgba(255,255,255,0.06)' },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ctaText },
  actionTextDone: { color: colors.muted },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    borderRadius: radii.icon,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  askText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ctaText },
  inviteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.4)',
    borderRadius: radii.icon,
    padding: 8,
  },
  empty: { textAlign: 'center', color: colors.dim, fontFamily: fonts.body, fontSize: 13, marginTop: 30 },
  footer: { padding: spacing.xl },
  doneBtn: {
    backgroundColor: colors.cyan,
    borderRadius: radii.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ctaText },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#14141c',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
  },
  modalTitle: { ...type.display, fontSize: 20, marginBottom: 2 },
  modalSub: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, marginBottom: 18 },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  amountSign: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.muted, marginRight: 6 },
  amountInput: { flex: 1, fontFamily: fonts.displayBold, fontSize: 24, color: colors.text, paddingVertical: 14 },
  modalSend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    borderRadius: radii.card,
    paddingVertical: 14,
  },
  modalSendText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ctaText },
  modalCancel: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  modalCancelText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
