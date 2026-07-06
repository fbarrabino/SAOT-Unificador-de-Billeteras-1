// Layout raíz de la app: carga las fuentes, monta los providers globales y define el Stack de navegación.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  useFonts as useJakarta,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { WalletsProvider } from '@/context/WalletsContext';
import { SplashScreen } from '@/components/SplashScreen';
import { NotifProvider } from '@/context/NotifContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { SettingsProvider } from '@/context/SettingsContext';

// Duración mínima del splash custom para que se sienta intencional
// (no un flash de un instante) aunque la sesión ya esté resuelta.
const SPLASH_MIN_MS = 700;

/**
 * Wrapper interno que conecta el estado de autenticación con WalletsProvider.
 * Necesita estar dentro de SessionProvider para poder llamar useSession().
 */
function AppWithProviders() {
  const { isAuthenticated } = useSession();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    // enabled={isAuthenticated} hace que WalletsProvider cargue datos
    // solo cuando hay sesión activa y los limpie al desloguearse.
    <WalletsProvider enabled={isAuthenticated}>
      {/* NotifProvider envuelve el Stack para que useNotif esté disponible en
          todas las pantallas (connect-syncing, send, payqr, etc.). Va dentro de
          SafeAreaProvider porque usa useSafeAreaInsets(). */}
      <NotifProvider>
        {/* ConfirmProvider expone useConfirm() → modal de confirmación in-app
            (dentro del dispositivo), en vez del window.confirm del navegador. */}
        <ConfirmProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          {/* Sin sesión: solo se puede navegar dentro de (auth) (login/registro/recuperar). */}
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          {/* Con sesión: el resto de la app. Si no hay sesión, Expo Router
              redirige automáticamente a la primera ruta disponible del guard
              activo (login), evitando el acceso directo por URL. */}
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(details)" />
            <Stack.Screen name="(exchange)" />
            <Stack.Screen name="(send)" />
            <Stack.Screen name="(request)" />
            <Stack.Screen name="(payqr)" />
          </Stack.Protected>

          {/* Sin guard: signup hace login automático antes de navegar acá, así
              que si esta pantalla quedara dentro de (auth) (guard !isAuthenticated)
              o solo dentro del guard isAuthenticated, se rompería según el orden
              de las llamadas. La dejamos siempre alcanzable. */}
          <Stack.Screen name="verify-email" />
        </Stack>
        </ConfirmProvider>
      </NotifProvider>
    </WalletsProvider>
  );
}

export default function RootLayout() {
  const [grotesk] = useSpaceGrotesk({ SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  const [jakarta] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Pantalla en negro mientras cargan las fuentes
  if (!grotesk || !jakarta) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      {/* SettingsProvider afuera de todo: preferencias de notificaciones/seguridad
          persistidas en AsyncStorage, disponibles en toda la app. */}
      <SettingsProvider>
        {/* SessionProvider va afuera: maneja JWT y datos del usuario */}
        <SessionProvider>
          <AppWithProviders />
        </SessionProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}