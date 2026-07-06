/**
 * ConfirmContext — Confirmación in-app (modal dentro del dispositivo).
 *
 * ¿Por qué no Alert.alert / window.confirm? Alert.alert es un no-op en
 * react-native-web y window.confirm muestra el diálogo feo del navegador,
 * fuera del marco de la app. Este overlay se renderiza dentro del árbol de la
 * app (igual que NotifProvider), así el popup aparece adentro del dispositivo
 * en teléfono, emulador y web.
 *
 * Uso:
 *   const { confirmar } = useConfirm();
 *   const ok = await confirmar({ titulo, mensaje, textoConfirmar: 'Desconectar', destructivo: true });
 *   if (!ok) return;
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

export interface ConfirmarOpciones {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Pinta el botón de confirmar en rojo (acciones destructivas). */
  destructivo?: boolean;
}

type Pendiente = ConfirmarOpciones & { resolve: (v: boolean) => void };

const ConfirmContext = createContext<{
  confirmar: (opts: ConfirmarOpciones) => Promise<boolean>;
} | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>.');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Pendiente | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const cerrar = useCallback(
    (valor: boolean) => {
      setCurrent((c) => {
        c?.resolve(valor);
        return c;
      });
      Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setCurrent(null);
      });
    },
    [anim],
  );

  const confirmar = useCallback(
    (opts: ConfirmarOpciones) =>
      new Promise<boolean>((resolve) => {
        setCurrent({ ...opts, resolve });
        anim.setValue(0);
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 70 }).start();
      }),
    [anim],
  );

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}

      {current ? (
        <View style={styles.overlay}>
          {/* Scrim: tocar afuera = cancelar. */}
          <Animated.View style={[styles.scrim, { opacity: anim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => cerrar(false)} />
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: anim,
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
              },
            ]}
          >
            <Text style={styles.title}>{current.titulo}</Text>
            <Text style={styles.message}>{current.mensaje}</Text>

            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => cerrar(false)}>
                <Text style={styles.btnCancelText}>{current.textoCancelar ?? 'Cancelar'}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, current.destructivo ? styles.btnDanger : styles.btnPrimary]}
                onPress={() => cerrar(true)}
              >
                <Text style={[styles.btnConfirmText, current.destructivo && { color: colors.red }]}>
                  {current.textoConfirmar ?? 'Aceptar'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 28,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface2,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  message: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 19,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnCancel: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.cardBorder },
  btnPrimary: { backgroundColor: 'rgba(57,195,242,0.16)', borderColor: 'rgba(57,195,242,0.4)' },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  btnCancelText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  btnConfirmText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.cyan },
});
