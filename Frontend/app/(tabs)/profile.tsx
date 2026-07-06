import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { colors, fonts, gradients, radii } from '@/theme/tokens';
import { useSession } from '@/context/SessionContext';
import { useWallets } from '@/context/WalletsContext';
import { urlFotoPerfil } from '@/api/usuarios';

function RowIcon({ children, color = colors.cyan }: { children: React.ReactNode; color?: string }) {
  return (
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: `${color}1F`, borderColor: `${color}3D` },
      ]}
    >
      {children}
    </View>
  );
}

const ICON_PROPS = (color: string) => ({
  fill: 'none' as const,
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// Tab Perfil: tarjeta del usuario y accesos a métodos de pago, notificaciones,
// seguridad, ayuda/soporte y cierre de sesión.
export default function Profile() {
  const { usuario } = useSession();
  const { wallets } = useWallets();
  const nBilleteras = wallets.length;

  const nombreCompleto = usuario
    ? `${usuario.nombre} ${usuario.apellido}`.trim()
    : '';
  const iniciales = usuario
    ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
    : '?';

  const fotoUri = urlFotoPerfil(usuario?.fotoPerfilUrl ?? null);
  const [fotoError, setFotoError] = useState(false);

  // Si cambia la foto (nueva subida), reseteamos el error para reintentar cargarla.
  useEffect(() => {
    setFotoError(false);
  }, [fotoUri]);

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.h1}>Perfil</Text>

          {/* NAVEGACIÓN 1: Tarjeta de usuario -> Editar Perfil */}
          <Pressable onPress={() => router.push('/profile-edit')} style={styles.userCard}>
            <View style={styles.avatar}>
              {fotoUri && !fotoError ? (
                <Image
                  source={{ uri: fotoUri }}
                  style={StyleSheet.absoluteFillObject}
                  onError={() => setFotoError(true)}
                />
              ) : (
                <LinearGradient
                  colors={gradients.lime}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, styles.avatarFallback]}
                >
                  <Text style={styles.avatarText}>{iniciales}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.userName}>{nombreCompleto}</Text>
              <Text style={styles.userMail}>{usuario?.email ?? ''}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>

          <View style={styles.group}>
            {/* ACÁ ESTÁ EL ENLACE A TU NUEVA PANTALLA */}
            <Row
              label="Métodos de pago"
              sub={`${nBilleteras} billetera${nBilleteras === 1 ? '' : 's'} vinculada${nBilleteras === 1 ? '' : 's'}`}
              onPress={() => router.push('/payment-methods')}
            >
              <RowIcon>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.cyan)}>
                  <Rect x={3} y={6} width={18} height={14} rx={2} />
                  <Line x1={3} y1={11} x2={21} y2={11} />
                </Svg>
              </RowIcon>
            </Row>

            <Row label="Contactos" sub="Reconectar agenda del teléfono" onPress={() => router.push('/connect-contacts')}>
              <RowIcon>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.cyan)}>
                  <Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <Circle cx={9} cy={7} r={4} />
                  <Path d="M22 21v-2a4 4 0 00-3-3.87" />
                  <Path d="M16 3.13a4 4 0 010 7.75" />
                </Svg>
              </RowIcon>
            </Row>

            <Row label="Notificaciones" sub="Push, email" onPress={() => router.push('/profile-notifications')}>
              <RowIcon>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.cyan)}>
                  <Path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <Path d="M10 21h4" />
                </Svg>
              </RowIcon>
            </Row>

            {/* NAVEGACIÓN 2: Fila de Seguridad -> Pantalla de Seguridad */}
            <Row label="Seguridad" sub="Face ID, 2FA" onPress={() => router.push('/profile-security')}>
              <RowIcon>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.cyan)}>
                  <Path d="M6 10V8a6 6 0 0112 0v2" />
                  <Rect x={5} y={10} width={14} height={10} rx={2} />
                </Svg>
              </RowIcon>
            </Row>

            <Row label="Ayuda y soporte" sub="FAQ, contactanos" onPress={() => router.push('/support-faq')}>
              <RowIcon>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.cyan)}>
                  <Circle cx={12} cy={12} r={10} />
                  <Path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4" />
                  <Path d="M12 17h.01" />
                </Svg>
              </RowIcon>
            </Row>

            {/* NAVEGACIÓN 3: Fila de Logout -> Pantalla de Confirmación de Logout */}
            <Row label="Cerrar sesión" danger onPress={() => router.push('/profile-logout')}>
              <RowIcon color={colors.red}>
                <Svg width={20} height={20} viewBox="0 0 24 24" {...ICON_PROPS(colors.red)}>
                  <Path d="M10 17l5-5-5-5" />
                  <Path d="M15 12H4" />
                  <Path d="M20 4v16" />
                </Svg>
              </RowIcon>
            </Row>
          </View>

          <Text style={styles.version}>SaOT v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  sub,
  children,
  danger,
  onPress,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {children}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.red }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={[styles.chev, danger && { color: colors.red }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 120 },
  h1: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.text, letterSpacing: -0.5, marginBottom: 18 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ctaText },
  userName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  userMail: { fontFamily: fonts.body, fontSize: 12, color: colors.dim, marginTop: 2 },
  chev: { fontFamily: fonts.body, fontSize: 20, color: colors.dim, marginLeft: 8 },
  group: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  rowSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dim, marginTop: 2 },
  version: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.dim, marginTop: 14 },
});