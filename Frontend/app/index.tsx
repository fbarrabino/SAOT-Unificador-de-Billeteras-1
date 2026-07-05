import { Redirect } from 'expo-router';

// Punto de entrada de la app: redirige siempre a la pantalla de login.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}