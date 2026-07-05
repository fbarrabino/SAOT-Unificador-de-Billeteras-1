import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

// Sin esto, Expo Router usa el orden alfabético de los archivos como ruta
// inicial del grupo (ej. "email-sent" antes que "login"). Forzamos login
// como entrada por defecto de (auth).
export const unstable_settings = {
  initialRouteName: 'login',
};

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
