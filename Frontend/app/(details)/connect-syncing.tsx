import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import type { WalletGlyphKey } from '@/components/WalletGlyph';
import { colors, radii, spacing, type } from '@/theme/tokens';
import { WALLET_CATALOG } from '@/data/wallets';

const SYNC_DURATION_MS = 2200;
const GLYPH_KEYS: WalletGlyphKey[] = ['mp', 'ua', 'lm', 'bb', 'nx'];

export default function ConnectSyncingScreen() {
    // 1. LÓGICA DE FRANCO: Lectura de catálogo
    const { wallet, id } = useLocalSearchParams();
    const paramKey = typeof wallet === 'string' ? wallet : (typeof id === 'string' ? id : 'bb');
    const walletInfo = WALLET_CATALOG[paramKey] || WALLET_CATALOG['bb'];

    // 2. LÓGICA DE FABRICIO: Validación de imagen
    const walletGlyph = GLYPH_KEYS.includes(paramKey as WalletGlyphKey)
        ? (paramKey as WalletGlyphKey)
        : null;

    useEffect(() => {
        const t = setTimeout(() => {
            // 3. NAVEGACIÓN DE FRANCO: Arrastramos el ID limpio a la pantalla final
            router.replace({ pathname: '/(details)/connect-success', params: { wallet: paramKey } });
        }, SYNC_DURATION_MS);
        return () => clearTimeout(t);
    }, [paramKey]);

    return (
        <View style={styles.container}>
            <AuroraBackground />
            <View style={styles.header}>
                <Pressable style={styles.closeBtn} onPress={() => router.replace('/(tabs)/wallets')}>
                    <Feather name="x" size={24} color={colors.text} />
                </Pressable>
            </View>

            <View style={styles.content}>
                <View style={styles.syncCircleOuter}>
                    <View style={styles.syncCircleInner}>
                        <ActivityIndicator color="#FFFFFF" size="large" />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={type.display}>{walletInfo.name}</Text>
                    <Text style={styles.syncLabel}>Sincronizando…</Text>
                    <Text style={styles.subtitle}>
                        Estamos recibiendo el balance y los últimos movimientos.
                    </Text>
                </View>

                <View style={styles.statusCard}>
                    <View style={styles.statusLeft}>
                        {/* 4. VISUAL DE FABRICIO: Renderizar logo real o fallback */}
                        {walletGlyph ? (
                            <View style={{ marginRight: spacing.md }}>
                                <WalletGlyph wallet={walletGlyph} size={40} />
                            </View>
                        ) : (
                            <View style={[styles.walletIcon, { backgroundColor: walletInfo.color }]}>
                                <Text style={styles.walletIconText}>{walletInfo.initials}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={type.h4}>{walletInfo.name}</Text>
                            <Text style={type.small}>Recibiendo datos…</Text>
                        </View>
                    </View>
                    <ActivityIndicator color={colors.cyan} size="small" />
                </View>
            </View>

            <View style={styles.footerNote}>
                <Feather name="lock" size={14} color={colors.dim} />
                <Text style={styles.securityText}>
                    Conexión cifrada · OAuth 2.0
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingTop: 60, paddingHorizontal: spacing.xl, alignItems: 'flex-end', zIndex: 10 },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.icon, backgroundColor: 'rgba(255,255,255,0.05)' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginTop: -60 },
    syncCircleOuter: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(57,195,242,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
    syncCircleInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', shadowColor: colors.cyan, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    textContainer: { alignItems: 'center', marginBottom: 40 },
    syncLabel: { ...type.display, fontSize: 22, color: colors.text, marginTop: spacing.xs, marginBottom: spacing.md },
    subtitle: { ...type.body, textAlign: 'center' },
    statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg },
    statusLeft: { flexDirection: 'row', alignItems: 'center' },
    walletIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    walletIconText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    footerNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingBottom: 40 },
    securityText: { ...type.small, fontSize: 11 }
});