// Pagar QR — pantalla de código detectado.
// FE-03: la pantalla ya existía con datos hardcodeados. Acá:
//  - leemos `merchant`, `merchantSub`, `amount`, `reference`, `qr`, `wallet`
//    desde los params del router (los inyecta /payqr-scanning).
//  - usamos WalletsContext para resolver la billetera origen y su cuentaId
//    real (necesario para invocar BE-05 con un id válido del backend).
//  - el CTA Pagar dispara POST /api/operaciones/pagar-qr; ante un error de
//    negocio (saldo insuficiente, etc.) mostramos el mensaje y no avanzamos.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { fmt } from '@/utils/format';
import { useWallets } from '@/context/WalletsContext';
import { pagarQr, CATEGORIA_EGRESO_DEFAULT } from '@/api/operaciones';
import { ApiError } from '@/api/client';
import { confirmarConBiometria } from '@/utils/biometrics';
import type { WalletKey } from '@/data/wallets';

export default function PayQRDetectedScreen() {
    const params = useLocalSearchParams<{
        merchant?: string;
        merchantSub?: string;
        amount?: string;
        reference?: string;
        qr?: string;
        wallet?: WalletKey;
    }>();

    const { wallets, refresh } = useWallets();
    const [submitting, setSubmitting] = useState(false);

    const merchant = params.merchant ?? 'Comercio';
    const merchantSub = params.merchantSub ?? '';
    const reference = params.reference ?? '—';
    const monto = Number(params.amount ?? 0);
    const qr = params.qr ?? '';

    const walletKey: WalletKey = (params.wallet ?? 'mp') as WalletKey;
    const wallet = wallets.find((w) => w.key === walletKey) ?? wallets[0];

    const cuentaId = wallet?.cuentaId;
    const saldoInsuficiente = wallet ? wallet.bal < monto : false;
    const canPay = !!cuentaId && monto > 0 && !saldoInsuficiente && !submitting;

    async function pagar() {
        if (!cuentaId) {
            Alert.alert('No se puede pagar', 'No se encontró la cuenta vinculada en el servidor.');
            return;
        }

        // D5 — confirmación biométrica antes de pagar.
        const bio = await confirmarConBiometria(`Pagar ${fmt(monto)} a ${merchant}`);
        if (!bio.ok) {
            Alert.alert('Verificación cancelada', bio.motivo ?? 'No se confirmó el pago.');
            return;
        }

        setSubmitting(true);
        try {
            await pagarQr({
                cuentaOrigenId: cuentaId,
                categoriaId: CATEGORIA_EGRESO_DEFAULT,
                monto,
                descripcion: `Pago QR · ${merchant}`,
                codigoQR: qr || null,
            });
            await refresh();
            router.replace('/payqr-success');
        } catch (err) {
            const mensaje =
                err instanceof ApiError ? err.mensaje : 'No se pudo procesar el pago.';
            Alert.alert('No se pudo pagar', mensaje);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={styles.header}>
                <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>Código detectado</Text>
                <View style={{ width: 44, height: 44 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.merchantCard}>
                    <View style={styles.merchantIconBox}>
                        <Feather name="grid" size={20} color={colors.cyan} />
                    </View>
                    <View style={styles.merchantInfo}>
                        <Text style={[type.small, { marginBottom: 2 }]}>Pagar a</Text>
                        <Text style={type.bodyText}>{merchant}</Text>
                        {merchantSub ? (
                            <Text style={[type.small, { color: colors.dim, marginTop: 2 }]}>
                                {merchantSub}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={type.small}>Cobro</Text>
                    <Text style={[type.display, { color: colors.green, fontSize: 40, marginTop: spacing.xs }]}>
                        {fmt(monto)}
                    </Text>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Text style={type.body}>Desde</Text>
                        <View style={styles.walletBadge}>
                            {wallet ? <WalletGlyph wallet={wallet.key} size={16} /> : null}
                            <Text style={[type.bodyText, { marginLeft: 6 }]}>
                                {wallet?.name ?? 'Sin billetera'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={type.body}>Referencia</Text>
                        <Text style={type.bodyText}>{reference}</Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <Text style={type.body}>Comisión</Text>
                        <Text style={type.bodyText}>$0.00</Text>
                    </View>
                </View>

                {saldoInsuficiente ? (
                    <Text style={styles.errorText}>
                        Saldo insuficiente en {wallet?.name ?? 'la billetera'}.
                    </Text>
                ) : null}
            </View>

            <View style={styles.footer}>
                <View style={[shadow.cta, { borderRadius: radii.button, opacity: canPay ? 1 : 0.5 }]}>
                    <Pressable
                        disabled={!canPay}
                        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                        onPress={pagar}
                    >
                        <LinearGradient
                            colors={gradients.cyan}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryBtn}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#06121A" />
                            ) : (
                                <Text style={[type.button, { color: '#06121A' }]}>
                                    {saldoInsuficiente ? 'Saldo insuficiente' : `Pagar ${fmt(monto)}`}
                                </Text>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...type.h4,
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xxl,
    },
    merchantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: radii.card,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
    },
    merchantIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(57,195,242,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    merchantInfo: {
        flex: 1,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    detailsContainer: {
        marginTop: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
    },
    walletBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 999,
    },
    errorText: {
        ...type.small,
        color: colors.red,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    primaryBtn: {
        height: 52,
        borderRadius: radii.button,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
