import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { WalletGlyph } from '@/components/WalletGlyph';
import type { WalletGlyphKey } from '@/components/WalletGlyph';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { WALLET_CATALOG } from '@/data/wallets';

const GLYPH_KEYS: WalletGlyphKey[] = ['mp', 'ua', 'lm', 'bb', 'nx'];

export default function ConnectSuccessScreen() {
    // 1. LÓGICA DE FRANCO: Lectura de catálogo
    const { wallet } = useLocalSearchParams();
    const paramKey = typeof wallet === 'string' ? wallet : 'bb';
    const walletInfo = WALLET_CATALOG[paramKey] || WALLET_CATALOG['bb'];

    // 2. LÓGICA DE FABRICIO: Validación de imagen
    const walletGlyph = GLYPH_KEYS.includes(paramKey as WalletGlyphKey)
        ? (paramKey as WalletGlyphKey)
        : null;

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={styles.header}>
                <Pressable style={styles.closeBtn} onPress={() => router.replace('/(tabs)/wallets')}>
                    <Feather name="x" size={24} color="#FFFFFF" />
                </Pressable>
            </View>

            <View style={styles.content}>
                <View style={styles.successCircle}>
                    <Feather name="check" size={32} color="#FFFFFF" />
                </View>

                {/* TEXTO BLANCO (Fix de Franco) + NOMBRE DINÁMICO (Franco) */}
                <Text style={styles.title}>{walletInfo.name}{'\n'}¡Conectada!</Text>
                <Text style={styles.subtitle}>
                    Ya podés ver el balance desde tu dashboard.
                </Text>

                <View style={styles.card}>
                    <View style={styles.cardLeft}>
                        {/* 3. VISUAL DE FABRICIO: Renderizar logo real o fallback */}
                        {walletGlyph ? (
                            <View style={{ marginRight: spacing.md }}>
                                <WalletGlyph wallet={walletGlyph} size={40} />
                            </View>
                        ) : (
                            <View style={[styles.logoCircle, { backgroundColor: walletInfo.color }]}>
                                <Text style={styles.logoText}>{walletInfo.initials}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={[type.bodyBold, { color: '#FFFFFF' }]}>{walletInfo.name}</Text>
                            <Text style={type.small}>Listo para usar</Text>
                        </View>
                    </View>
                    <Text style={styles.statusText}>ACTIVA</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={[shadow.cta, { borderRadius: radii.button, marginBottom: spacing.md }]}>
                    <Pressable android_ripple={{ color: 'rgba(0,0,0,0.12)' }} onPress={() => router.replace('/(tabs)/wallets')}>
                        <LinearGradient colors={gradients.cyan} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                            <Text style={type.button}>Ver mis billeteras</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
                <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(details)/connect-list')}>
                    <Text style={styles.secondaryBtnText}>Conectar otra</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingTop: 60, paddingHorizontal: spacing.xl, alignItems: 'flex-end', zIndex: 10 },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.icon, backgroundColor: 'rgba(255,255,255,0.05)' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginTop: -60 },
    successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00D287', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, shadowColor: '#00D287', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    title: { ...type.h3, textAlign: 'center', marginBottom: spacing.sm, color: '#FFFFFF' },
    subtitle: { ...type.body, color: colors.dim, textAlign: 'center', marginBottom: spacing.xxl },
    card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    logoCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    logoText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, color: '#FFFFFF' },
    statusText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#00D287', letterSpacing: 1 },
    footer: { padding: spacing.lg, paddingBottom: 60 },
    primaryBtn: { height: 52, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' },
    secondaryBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
    secondaryBtnText: { ...type.button, color: '#FFFFFF' }
});