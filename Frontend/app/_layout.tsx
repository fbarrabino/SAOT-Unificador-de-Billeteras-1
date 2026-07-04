import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { NotifProvider } from '@/context/NotifContext';

/**
 * Wrapper interno que conecta el estado de autenticación con WalletsProvider.
 * Necesita estar dentro de SessionProvider para poder llamar useSession().
 */
function AppWithProviders() {
  const { isAuthenticated } = useSession();

  return (
    // enabled={isAuthenticated} hace que WalletsProvider cargue datos
    // solo cuando hay sesión activa y los limpie al desloguearse.
    <WalletsProvider enabled={isAuthenticated}>
      <NotifProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        />
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
      {/* SessionProvider va afuera: maneja JWT y datos del usuario */}
      <SessionProvider>
        <AppWithProviders />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
