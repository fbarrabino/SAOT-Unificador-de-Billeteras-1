// Pagar QR — escaneo real con expo-camera (C4).
// Estados:
//   1. Pidiendo permiso de cámara (Camera.requestCameraPermissionsAsync)
//   2. Permiso denegado → mensaje + botón "Reintentar"
//   3. Permiso OK → CameraView con onBarcodeScanned
//
// Cuando lee un QR, intenta parsearlo como JSON del formato SaOT
// (el que genera (request)/qr.tsx). Si no es JSON o no matchea, igual
// avanza con datos genéricos para que el flow de pago QR no se rompa.
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radii, spacing, type } from '@/theme/tokens';

type QRPayload = {
  tipo?: string;
  alias?: string;
  monto?: number | string;
  ref?: string;
  cuentaId?: number;
};

export default function PayQRScanningScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 240,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanLineY]);

  // Pedimos permiso apenas se monta la pantalla. Si el usuario ya lo otorgó
  // antes, viene directo en true y no muestra el prompt.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScanned = ({ data }: { data: string }) => {
    if (scanned) return; // evita dispararlo dos veces mientras animamos
    setScanned(true);

    // Intentamos parsear el payload. Si no es nuestro formato, usamos defaults
    // para que el flow no se trabe en un QR de cualquier app.
    let parsed: QRPayload | null = null;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = null;
    }

    const esPayloadSaot = parsed?.tipo === 'pago_saot';
    router.push({
      pathname: '/payqr-detected',
      params: {
        merchant: esPayloadSaot
          ? `Cobro a ${parsed?.alias ?? 'usuario'}`
          : 'Comercio externo',
        merchantSub: esPayloadSaot
          ? `Pedido SaOT · ${parsed?.ref ?? '—'}`
          : 'QR genérico',
        amount: String(parsed?.monto ?? 0),
        reference: String(parsed?.ref ?? data.slice(0, 24)),
        qr: data,
        wallet: 'mp',
      },
    });
  };

  // ─── Estados visuales ───────────────────────────────────────────────────────

  // permiso aún no consultado
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Preparando cámara…</Text>
        </View>
      </View>
    );
  }

  // permiso denegado
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Escanear QR</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.placeholder}>
          <Feather name="camera-off" size={32} color={colors.muted} />
          <Text style={styles.placeholderText}>
            Necesitamos acceso a tu cámara para escanear códigos QR.
          </Text>
          <Pressable
            style={styles.permBtn}
            onPress={() => {
              if (permission.canAskAgain) {
                requestPermission();
              } else {
                Alert.alert(
                  'Permiso bloqueado',
                  'Activá la cámara desde los ajustes del sistema.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
                  ],
                );
              }
            }}
          >
            <Text style={styles.permBtnText}>
              {permission.canAskAgain ? 'Dar permiso' : 'Abrir ajustes'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // permiso OK → render de la cámara
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />

      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Escanear QR</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.scanAreaContainer} pointerEvents="none">
        <View style={styles.scanBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineY }] },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.instructionPill}>
          <Text style={styles.instructionText}>Enfocá el código QR para pagar</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.h4,
    fontSize: 18,
  },
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBox: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.cyan,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radii.card,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radii.card,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radii.card,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: radii.card,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  instructionText: {
    ...type.body,
    fontWeight: '500',
    color: colors.text,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: '#11141A',
  },
  placeholderText: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  permBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.cyan,
  },
  permBtnText: {
    ...type.button,
    color: colors.ctaText,
  },
});
