// FE-12 · Compartir recibo
// Preview del recibo + PDF real, email, QR y copia de link
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { useWallets } from '@/context/WalletsContext';
import { colors, fonts, radii, spacing, type } from '@/theme/tokens';
import { fmt } from '@/utils/format';

// ─── HTML del recibo ──────────────────────────────────────────────────────────

function buildReceiptHTML(params: {
  reference: string;
  amountFormatted: string;
  isIncoming: boolean;
  title: string;
  categoria: string;
  walletName: string;
  dateLabel: string;
}): string {
  const { reference, amountFormatted, isIncoming, title, categoria, walletName, dateLabel } = params;
  const amountColor = isIncoming ? '#16a34a' : '#111827';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #111827;
      padding: 48px 32px;
    }
    .container { max-width: 480px; margin: 0 auto; }

    /* Encabezado */
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 28px;
    }
    .logo-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #39c3f2;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.4px;
    }

    /* Título */
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    .date-line {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 32px;
    }

    /* Monto */
    .amount {
      font-size: 52px;
      font-weight: 700;
      letter-spacing: -2px;
      color: ${amountColor};
      margin-bottom: 36px;
      line-height: 1;
    }

    /* Separador */
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 20px 0;
    }

    /* Secciones tipo MercadoPago */
    .section {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .section:last-of-type { border-bottom: none; }
    .bullet {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #39c3f2;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .section-body {}
    .section-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .section-value {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }
    .section-sub {
      font-size: 13px;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Badge estado */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #dcfce7;
      color: #15803d;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Pie */
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.8;
    }
    .ref-number {
      font-weight: 600;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div class="logo-circle">S</div>
      <span class="brand-name">SaOT</span>
    </div>

    <h1 class="title">Comprobante de operación</h1>
    <p class="date-line">${dateLabel}</p>

    <p class="amount">${amountFormatted}</p>

    <div class="divider"></div>

    <div class="section">
      <div class="bullet"></div>
      <div class="section-body">
        <p class="section-label">Descripción</p>
        <p class="section-value">${title}</p>
      </div>
    </div>

    <div class="section">
      <div class="bullet"></div>
      <div class="section-body">
        <p class="section-label">Billetera</p>
        <p class="section-value">${walletName}</p>
      </div>
    </div>

    <div class="section">
      <div class="bullet"></div>
      <div class="section-body">
        <p class="section-label">Categoría</p>
        <p class="section-value">${categoria}</p>
      </div>
    </div>

    <div class="section">
      <div class="bullet"></div>
      <div class="section-body">
        <p class="section-label">Estado</p>
        <span class="badge">&#10003; Completado</span>
      </div>
    </div>

    <div class="footer">
      Número de operación SaOT: <span class="ref-number">${reference}</span><br/>
      Documento generado por SaOT &middot; saot.app
    </div>

  </div>
</body>
</html>`;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ReceiptShareScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { activity } = useWallets();

  const tx = activity.find(a => a.id === id) ?? activity[0];

  const [loading, setLoading] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrUri, setQrUri] = useState<string>('');

  if (!tx) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScreenHeader title="Compartir recibo" />
          <View style={styles.emptyWrap}>
            <Text style={type.body}>No se encontró la transacción.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isIncoming = tx.kind === 'in';
  const sign = isIncoming ? '+' : '-';
  const reference = `TX-${String(tx.id).padStart(5, '0').slice(-5)}`;
  const categoria = isIncoming ? 'Ingreso' : tx.title;
  const dateLabel = `${tx.bucket.toLowerCase().replace(/^\w/, c => c.toUpperCase())} · ${tx.time}`;
  // fmt() ya incluye '$', así que solo anteponemos el signo
  const amountFormatted = `${sign}${fmt(Math.abs(tx.amount))}`;

  const receiptHTML = buildReceiptHTML({
    reference,
    amountFormatted,
    isIncoming,
    title: tx.title,
    categoria,
    walletName: tx.walletName,
    dateLabel,
  });

  // Genera PDF y devuelve el URI local
  async function generatePDF(): Promise<string> {
    const { uri } = await Print.printToFileAsync({ html: receiptHTML, base64: false });
    return uri;
  }

  // Abre el HTML del recibo en nueva pestaña y lanza el diálogo de impresión
  const openReceiptInNewTab = () => {
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => newWindow.print(), 300);
      };
    }
  };

  // ── Descargar PDF ──────────────────────────────────────────────────────────
  const handleDescargarPDF = async () => {
    if (Platform.OS === 'web') {
      openReceiptInNewTab();
      return;
    }
    try {
      setLoading(true);
      const uri = await generatePDF();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Recibo ${reference}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF generado', `Guardado en:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copiar link ────────────────────────────────────────────────────────────
  const handleCopiarLink = async () => {
    if (Platform.OS === 'web') {
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      await Clipboard.setStringAsync(url);
      Alert.alert('Link copiado', 'El link del recibo fue copiado. Al abrirlo se descarga el PDF.');
      return;
    }
    try {
      setLoading(true);
      const uri = await generatePDF();
      await Clipboard.setStringAsync(uri);
      Alert.alert('Link copiado', 'La ruta del PDF fue copiada al portapapeles.');
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  // ── Compartir ──────────────────────────────────────────────────────────────
  const handleCompartir = async () => {
    if (Platform.OS === 'web') {
      openReceiptInNewTab();
      return;
    }
    try {
      setLoading(true);
      const uri = await generatePDF();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Recibo ${reference}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Share.share({ message: `Recibo ${reference}: ${amountFormatted}` });
      }
    } catch {
      // usuario canceló
    } finally {
      setLoading(false);
    }
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  const handleEmail = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Email', 'Abrí tu cliente de correo para enviar el recibo.');
      return;
    }
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sin cliente de email', 'Configurá una cuenta de correo en tu dispositivo para usar esta función.');
      return;
    }
    try {
      setLoading(true);
      const uri = await generatePDF();
      await MailComposer.composeAsync({
        subject: `Recibo ${reference} - SaOT`,
        body: `Adjunto encontrás el recibo de tu operación ${reference} por ${amountFormatted}.\n\nGenerado por SaOT · saot.app`,
        attachments: [uri],
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir el compositor de email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Mostrar QR ─────────────────────────────────────────────────────────────
  const handleMostrarQR = () => {
    if (Platform.OS === 'web') {
      Alert.alert('QR', 'El QR está disponible en la app móvil.');
      return;
    }
    // El QR codifica el resumen del recibo como texto legible
    const qrText = [
      'SaOT - Comprobante de operación',
      `Ref: ${reference}`,
      `Monto: ${amountFormatted}`,
      `Descripción: ${tx.title}`,
      `Billetera: ${tx.walletName}`,
      `Fecha: ${dateLabel}`,
      'Estado: Completado',
      'saot.app',
    ].join('\n');
    setQrUri(qrText);
    setQrVisible(true);
  };

  // ── Compartir PDF desde modal QR ───────────────────────────────────────────
  const handleCompartirPDFdesdeQR = async () => {
    try {
      setLoading(true);
      const uri = await generatePDF();
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Recibo ${reference}`,
        UTI: 'com.adobe.pdf',
      });
    } catch {
      Alert.alert('Error', 'No se pudo compartir el PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />

      {/* Modal QR */}
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQrVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Escaneá para ver el recibo</Text>
            <View style={styles.qrWrap}>
              {qrUri ? (
                <QRCode
                  value={qrUri}
                  size={220}
                  color={colors.text}
                  backgroundColor="transparent"
                />
              ) : null}
            </View>
            <Text style={styles.modalSub}>{reference}</Text>
            <Pressable style={styles.modalShareBtn} onPress={handleCompartirPDFdesdeQR}>
              <Text style={styles.modalShareBtnText}>Compartir PDF</Text>
            </Pressable>
            <Pressable style={styles.modalCloseBtn} onPress={() => setQrVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Generando PDF…</Text>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="Compartir recibo" />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta del recibo */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <WalletGlyph wallet={tx.wallet} size={36} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.receiptTitle}>SaOT - Recibo de operación</Text>
              </View>
              <Text style={styles.receiptRef}>{reference}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.importeLabel}>Importe pagado</Text>
            <Text style={[styles.importeAmount, { color: isIncoming ? colors.green : colors.text }]}>
              {amountFormatted}
            </Text>

            <View style={styles.divider} />

            <ReceiptRow label="Descripción" value={tx.title} />
            <ReceiptRow label="Categoría"   value={categoria} />
            <ReceiptRow label="Billetera"   value={tx.walletName} />
            <ReceiptRow label="Fecha"       value={dateLabel} />
            <ReceiptRow label="Estado"      value="Completado" noBorder />

            <View style={styles.divider} />
            <Text style={styles.footer}>Documento generado por SaOT · saot.app</Text>
          </View>

          {/* Compartir vía */}
          <Text style={[type.label, { marginTop: spacing.xxl, marginBottom: spacing.md }]}>
            COMPARTIR VÍA
          </Text>
          <View style={styles.shareGrid}>
            <ShareBtn icon="copy"  label="Copiar link" onPress={handleCopiarLink} />
            <ShareBtn icon="share" label="Compartir"   onPress={handleCompartir} />
            <ShareBtn icon="mail"  label="Email"       onPress={handleEmail} />
            <ShareBtn icon="qr"    label="Mostrar QR"  onPress={handleMostrarQR} />
          </View>
        </ScrollView>

        <View style={styles.footerBar}>
          <Pressable style={styles.pdfBtn} onPress={handleDescargarPDF}>
            <Text style={styles.pdfBtnText}>Descargar PDF</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ReceiptRow({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
  return (
    <View style={[styles.receiptRow, !noBorder && styles.receiptRowBorder]}>
      <Text style={styles.receiptRowLabel}>{label}</Text>
      <Text style={styles.receiptRowValue}>{value}</Text>
    </View>
  );
}

type IconType = 'copy' | 'share' | 'mail' | 'qr';

function ShareBtn({ icon, label, onPress }: { icon: IconType; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.shareBtn} onPress={onPress}>
      <View style={styles.shareBtnIcon}>
        <ShareIcon type={icon} />
      </View>
      <Text style={styles.shareBtnLabel}>{label}</Text>
    </Pressable>
  );
}

function ShareIcon({ type: t }: { type: IconType }) {
  const props = { fill: 'none' as const, stroke: colors.cyan, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (t === 'copy') return (
    <Svg width={20} height={20} viewBox="0 0 24 24" {...props}>
      <Rect x={9} y={9} width={13} height={13} rx={2} />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </Svg>
  );
  if (t === 'share') return (
    <Svg width={20} height={20} viewBox="0 0 24 24" {...props}>
      <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </Svg>
  );
  if (t === 'mail') return (
    <Svg width={20} height={20} viewBox="0 0 24 24" {...props}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" {...props}>
      <Rect x={3} y={3} width={7} height={7} />
      <Rect x={14} y={3} width={7} height={7} />
      <Rect x={3} y={14} width={7} height={7} />
      <Path d="M14 14h3v3M17 17h3v3M14 20h3" />
    </Svg>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 20 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 99,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },

  // Modal QR
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#161c27',
    borderRadius: radii.cardLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    alignItems: 'center',
    width: 300,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  modalShareBtn: {
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  modalShareBtnText: {
    ...type.button,
    color: colors.ctaText,
  },
  modalCloseBtn: {
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalCloseBtnText: {
    ...type.button,
    color: colors.muted,
  },

  // Recibo
  receiptCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.cardLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  receiptRef: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.dim,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.md,
  },
  importeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  importeAmount: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  receiptRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  receiptRowLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  receiptRowValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.dim,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Grid de compartir
  shareGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  shareBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.card,
    backgroundColor: 'rgba(57,195,242,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57,195,242,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },

  footerBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    paddingTop: spacing.sm,
  },
  pdfBtn: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBtnText: {
    ...type.button,
    color: colors.ctaText,
  },
});
