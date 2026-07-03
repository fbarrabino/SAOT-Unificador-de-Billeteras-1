// Pedir #2 — QR de cobro real.
// C2: QR codifica un JSON con { tipo, usuarioId, alias, monto, ref } usando
// react-native-qrcode-svg, en lugar de la grilla decorativa anterior.
// C3: "Copiar link" usa expo-clipboard y "Compartir" usa el Share nativo.
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { AmountDisplay } from '@/components/AmountDisplay';
import { TxHeader } from '@/components/TxHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { useWallets } from '@/context/WalletsContext';
import { useSession } from '@/context/SessionContext';
import { type WalletKey } from '@/data/wallets';
import { fmt } from '@/utils/format';
import { colors, fonts, radii } from '@/theme/tokens';

const QR_TILE = 220;
const QR_INNER = QR_TILE - 28;

export default function RequestQR() {
  const { into, amt } = useLocalSearchParams<{ into?: WalletKey; amt?: string }>();
  const { wallets } = useWallets();
  const { usuario } = useSession();

  // Si el usuario eligió una wallet en (request)/amount.tsx la usamos; si no,
  // tomamos la primera que tenga. Sin billeteras, no debería llegar acá (el
  // home las bloquea), pero por las dudas hacemos fallback al primer wallet.
  const wallet =
    wallets.find((w) => w.key === ((into as WalletKey) ?? 'mp')) ?? wallets[0];

  const n = Number(amt ?? 0);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ref único por sesión de pantalla — sirve de identificador del cobro.
  // Formato corto: "<initials>-<4 dígitos>" para que el link sea legible.
  const { payload, link, alias } = useMemo(() => {
    const initials = (usuario?.nombre ?? 'saot')
      .toLowerCase()
      .replace(/\s+/g, '');
    const ref = Math.floor(1000 + Math.random() * 9000);
    const aliasCorto = `${initials}-${ref}`;
    const linkCorto = `saot.app/r/${aliasCorto}`;
    const data = {
      tipo: 'pago_saot',
      usuarioId: usuario?.usuarioId ?? null,
      alias: aliasCorto,
      walletKey: wallet?.key ?? null,
      cuentaId: wallet?.cuentaId ?? null,
      monto: n,
      ref: String(ref),
    };
    return { payload: JSON.stringify(data), link: linkCorto, alias: aliasCorto };
  }, [usuario, wallet, n]);

  async function handleCopiar() {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  async function handleCompartir() {
    try {
      await Share.share({
        title: `Pedido de pago de ${usuario?.nombre ?? 'SaOT'}`,
        message: `${usuario?.nombre ?? 'Te'} te está pidiendo ${fmt(n)}.\nPagar: https://${link}`,
        url: `https://${link}`, // iOS usa "url" además del message
      });
    } catch (err) {
      Alert.alert('No se pudo compartir', 'Intentá de nuevo en un momento.');
    }
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <TxHeader title="Pedir pago" />

        <View style={styles.body}>
          <Text style={styles.label}>Pedir</Text>
          <AmountDisplay text={fmt(n)} variant="cyan" size={32} />

          <View style={styles.qrTile}>
            <QRCode
              value={payload}
              size={QR_INNER}
              backgroundColor="#FFFFFF"
              color="#06121A"
              ecl="M"
            />
            {wallet ? (
              <View style={styles.qrCenter}>
                <WalletGlyph wallet={wallet.key} size={28} />
              </View>
            ) : null}
          </View>

          <Text style={styles.helper}>
            Escaneá con SaOT o cualquier billetera asociada para pagar
          </Text>
          <Text style={styles.link}>{link}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.action} onPress={handleCopiar}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M8 4h10a2 2 0 012 2v12M4 8v12a2 2 0 002 2h12"
                stroke={colors.text}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.actionText}>
              {copied ? '¡Copiado!' : 'Copiar link'}
            </Text>
          </Pressable>
          <Pressable style={styles.action} onPress={handleCompartir}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 16V4M7 9l5-5 5 5M5 20h14"
                stroke={colors.text}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.actionText}>Compartir</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 18, paddingTop: 4 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  qrTile: {
    width: QR_TILE,
    height: QR_TILE,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 24,
  },
  link: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  action: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
});
