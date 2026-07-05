import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

// Layout del grupo de autenticación (login, registro, recuperar contraseña, verificar email).
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
