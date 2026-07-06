import { useEffect, useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { colors } from '@/theme/tokens';

// Sin esto, Expo Router usa el orden alfabético de los archivos como ruta
// inicial del grupo (ej. "email-sent" antes que "login"). Forzamos login
// como entrada por defecto de (auth).
export const unstable_settings = {
  initialRouteName: 'login',
};

// Pantallas intermedias del flujo de "olvidé mi contraseña": solo tienen
// sentido si se llega navegando desde forgot-password, no como punto de
// entrada. En web, recargar la página reabre la última URL tal cual (Expo
// Router respeta la URL del navegador, ignorando initialRouteName), así que
// si el usuario recargó estando en /email-sent o similar, lo mandamos a login.
const MID_FLOW_SCREENS = ['/email-sent', '/reset-code', '/reset-new-password', '/reset-success'];

export default function AuthLayout() {
  const pathname = usePathname();
  const checked = useRef(false);

  useEffect(() => {
    // Corre una sola vez, al montar el layout (o sea, en la carga/recarga
    // inicial de la app). No se dispara de nuevo con la navegación interna
    // normal, porque este layout no se desmonta al cambiar de pantalla.
    if (!checked.current) {
      checked.current = true;
      if (MID_FLOW_SCREENS.some(screen => pathname.endsWith(screen))) {
        router.replace('/login');
      }
    }
  }, []);

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
