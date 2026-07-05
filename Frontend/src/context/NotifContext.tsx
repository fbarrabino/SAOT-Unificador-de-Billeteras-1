/**
 * NotifContext — Notificaciones in-app tipo "banner del sistema".
 *
 * ¿Por qué no expo-notifications? En Expo Go (SDK 54) las notificaciones OS están
 * muy limitadas y en web directamente no andan. Este banner se renderiza dentro
 * de la app (overlay arriba de todo), así aparece igual en teléfono, emulador y
 * web. Se dispara con notify({ emoji, title, subtitle }) desde cualquier pantalla
 * tras un evento (enviar, cambiar, pagar, conectar, desconectar).
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme/tokens';

type NotifInput = { emoji?: string; title: string; subtitle?: string };
type Notif = { id: number; emoji: string; title: string; subtitle?: string };

const NotifContext = createContext<{ notify: (n: NotifInput) => void } | null>(null);

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif debe usarse dentro de <NotifProvider>.');
  return ctx;
}

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Notif | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setCurrent(null);
    });
  }, [anim]);

  const notify = useCallback(
    (n: NotifInput) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      idRef.current += 1;
      setCurrent({ id: idRef.current, emoji: n.emoji ?? '🔔', title: n.title, subtitle: n.subtitle });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 55 }).start();
      hideTimer.current = setTimeout(dismiss, 3600);
    },
    [anim, dismiss],
  );

  return (
    <NotifContext.Provider value={{ notify }}>
      {children}

      {current ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              top: insets.top + 8,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) }],
            },
          ]}
        >
          <Pressable style={styles.card} onPress={dismiss}>
            <Text style={styles.emoji}>{current.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
              {current.subtitle ? (
                <Text style={styles.sub} numberOfLines={2}>{current.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </NotifContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 9999 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: { fontSize: 22 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
});
