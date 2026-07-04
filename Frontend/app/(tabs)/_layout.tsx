import { Tabs, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, gradients, shadow } from '@/theme/tokens';

// ─── Íconos ───────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M3 11l9-8 9 8" />
      <Path d="M5 10v10h14V10" />
    </Svg>
  );
}
function WalletIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Rect x={3} y={6} width={18} height={14} rx={2} />
      <Line x1={3} y1={11} x2={21} y2={11} />
    </Svg>
  );
}
function ActivityIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M4 12h4l2-7 4 14 2-7h4" />
    </Svg>
  );
}
function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}
function QRIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <Path d="M14 14h3v3M21 14v3M14 18v3h3M18 21h3" />
    </Svg>
  );
}

const ICONS: Record<string, (p: { color: string }) => React.ReactElement> = {
  home: HomeIcon,
  wallets: WalletIcon,
  activity: ActivityIcon,
  profile: ProfileIcon,
};
const LABELS: Record<string, string> = {
  home: 'Inicio',
  wallets: 'Billeteras',
  activity: 'Actividad',
  profile: 'Perfil',
};

// ─── Tab bar personalizada (estilo Mercado Pago: sólida + QR central) ──────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  function renderTab(index: number) {
    const route = state.routes[index];
    const focused = state.index === index;
    const color = focused ? colors.cyan : colors.dim;
    const Icon = ICONS[route.name];

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <Pressable
        key={route.key}
        style={({ pressed }) => [styles.tab, pressed && { opacity: 0.55 }]}
        onPress={onPress}
      >
        {Icon ? <Icon color={color} /> : null}
        <Text style={[styles.label, { color }]}>{LABELS[route.name]}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: (insets.bottom || 10) + 6 }]}>
      {renderTab(0)}
      {renderTab(1)}

      {/* Botón central QR (elevado, tipo FAB de Mercado Pago) */}
      <Pressable
        style={({ pressed }) => [styles.fabSlot, pressed && { transform: [{ scale: 0.92 }] }]}
        onPress={() => router.push('/(payqr)/payqr-scanning')}
      >
        <LinearGradient
          colors={gradients.cyan}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <QRIcon color={colors.ctaText} />
        </LinearGradient>
        <Text style={styles.fabLabel}>Pagar QR</Text>
      </Pressable>

      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="wallets" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // SÓLIDO (sin transparencia). Un dark propio, distinto del negro del fondo.
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26, // se eleva por encima de la barra (estilo MP)
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow.cta,
  },
  fabLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.cyan,
    marginTop: 4,
  },
});
