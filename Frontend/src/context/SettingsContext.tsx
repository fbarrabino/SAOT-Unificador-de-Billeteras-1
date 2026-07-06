/**
 * SettingsContext — Preferencias de notificaciones y seguridad del usuario.
 *
 * Persiste en AsyncStorage (localStorage en web, storage nativo en teléfono), así
 * las opciones sobreviven al navegar entre pantallas Y a recargas/reinicios de la
 * app. Antes cada pantalla guardaba los toggles en useState local: al desmontarse
 * (Expo Router desmonta la pantalla al salir) se perdían y volvían al default.
 *
 * Uso:
 *   const { settings, setSetting } = useSettings();
 *   <ToggleRow value={settings.pushTransacciones}
 *              onValueChange={(v) => setSetting('pushTransacciones', v)} />
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@saot/settings';

// Todas las preferencias en un único objeto plano de booleanos.
export interface AppSettings {
  // Notificaciones — PUSH
  pushTransacciones: boolean;
  pushSeguridad: boolean;
  pushPromociones: boolean;
  // Notificaciones — EMAIL
  emailTransacciones: boolean;
  emailResumen: boolean;
  emailPromociones: boolean;
  // Notificaciones — SONIDO Y VIBRACIÓN
  sonido: boolean;
  vibracion: boolean;
  // Seguridad — ACCESO
  faceId: boolean;
  pin: boolean;
  twoFactor: boolean;
  // Seguridad — PAGOS
  bioPayments: boolean;
}

// Valores por defecto (los mismos que estaban hardcodeados en las pantallas).
const DEFAULT_SETTINGS: AppSettings = {
  pushTransacciones: true,
  pushSeguridad: true,
  pushPromociones: false,
  emailTransacciones: true,
  emailResumen: true,
  emailPromociones: false,
  sonido: true,
  vibracion: true,
  faceId: true,
  pin: true,
  twoFactor: true,
  bioPayments: false,
};

interface SettingsState {
  settings: AppSettings;
  /** true mientras se leen las preferencias guardadas (primer render). */
  isLoading: boolean;
  /** Cambia una preferencia y la persiste. */
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde el almacenamiento. Si no hay nada guardado o falla la
  // lectura, quedamos con los defaults (no rompemos la UI).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (activo && raw) {
          const guardado = JSON.parse(raw) as Partial<AppSettings>;
          // Merge con defaults: si en el futuro se agrega una preferencia nueva,
          // los datos viejos no la tienen y toma el default en vez de undefined.
          setSettings({ ...DEFAULT_SETTINGS, ...guardado });
        }
      } catch (err) {
        console.warn('[settings] No se pudieron leer las preferencias:', err);
      } finally {
        if (activo) setIsLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        // Persistimos el objeto completo. No await: el estado ya se actualizó y
        // la escritura es "fire and forget" (si falla, solo logueamos).
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
          console.warn('[settings] No se pudo guardar la preferencia:', err),
        );
        return next;
      });
    },
    [],
  );

  return (
    <SettingsContext.Provider value={{ settings, isLoading, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings() debe usarse dentro de <SettingsProvider>.');
  }
  return ctx;
}
