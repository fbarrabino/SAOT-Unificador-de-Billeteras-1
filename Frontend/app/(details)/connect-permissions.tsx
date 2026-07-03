import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import type { WalletGlyphKey } from '@/components/WalletGlyph';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { WALLET_CATALOG } from '@/data/wallets';

// Claves de billeteras que Fabricio tiene configuradas con imágenes reales (logo.webp)
const GLYPH_KEYS: WalletGlyphKey[] = ['mp', 'ua', 'lm', 'bb', 'nx'];

export default function ConnectPermissionsScreen() {
    // 1. LÓGICA DE FRANCO: Recibimos un solo ID y leemos del catálogo central
    const { wallet, id } = useLocalSearchParams();
    const paramKey = typeof wallet === 'string' ? wallet : (typeof id === 'string' ? id : 'bb');
    const walletInfo = WALLET_CATALOG[paramKey] || WALLET_CATALOG['bb'];

    // 2. LÓGICA DE FABRICIO: Validar si la billetera elegida tiene imagen real
    const walletGlyph = GLYPH_KEYS.includes(paramKey as WalletGlyphKey)
        ? (paramKey as WalletGlyphKey)
        : null;

    const [balanceEnabled, setBalanceEnabled] = useState(true);
    const [historyEnabled, setHistoryEnabled] = useState(true);
    const [operateEnabled, setOperateEnabled] = useState(false);

    // 3. NAVEGACIÓN DE FRANCO (B4-FE): Dirigir a la nueva pantalla de monto
    const handleContinue = () => {
        router.push({ pathname: '/(details)/connect-amount', params: { wallet: paramKey } });
    };

    return (
        <View style={styles.container}>
            <AuroraBackground />
            <View style={{ paddingTop: 48 }}>
                <ScreenHeader title="Permisos" />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.logosRow}>
                    <View style={[styles.logoCircle, { backgroundColor: colors.teal }]}>
                        <Text style={[styles.logoText, { color: colors.bg }]}>S</Text>
                    </View>
                    <View style={styles.connectorContainer}>
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>

                    {/* 4. VISUAL DE FABRICIO: Renderizar logo real o fallback */}
                    {walletGlyph ? (
                        <WalletGlyph wallet={walletGlyph} size={64} />
                    ) : (
                        <View style={[styles.logoCircle, { backgroundColor: walletInfo.color }]}>
                            <Text style={styles.logoText}>{walletInfo.initials}</Text>
                        </View>
                    )}
                </View>

                {/* 5. TEXTOS DINÁMICOS BASADOS EN EL CATÁLOGO DE FRANCO */}
                <Text style={styles.title}>SaOT quiere conectarse con {walletInfo.name}</Text>
                <Text style={styles.subtitle}>
                    Vamos a recibir los datos que vos elijas. Podés revocar el acceso desde Perfil → Seguridad.
                </Text>

                <View style={styles.permissionsCard}>
                    <PermissionRow icon="credit-card" label="Ver balance disponible" value={balanceEnabled} onValueChange={setBalanceEnabled} />
                    <PermissionRow icon="activity" label="Ver historial de transacciones" value={historyEnabled} onValueChange={setHistoryEnabled} />
                    <PermissionRow icon="send" label="Operar (enviar y pagar)" value={operateEnabled} onValueChange={setOperateEnabled} noBorder />
                </View>

                <View style={styles.securityNote}>
                    <Feather name="lock" size={14} color={colors.dim} />
                    <Text style={styles.securityText}>
                        Conexión cifrada · OAuth 2.0 · No guardamos tu contraseña
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={[shadow.cta, { borderRadius: radii.button, flex: 1 }]}>
                    <Pressable android_ripple={{ color: 'rgba(0,0,0,0.12)' }} onPress={handleContinue}>
                        <LinearGradient colors={gradients.cyan} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                            <Text style={type.button}>Conectar {walletInfo.name}</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

function PermissionRow({ icon, label, value, onValueChange, noBorder }: any) {
    return (
        <View style={[styles.permissionRow, !noBorder && styles.permissionRowBorder]}>
            <View style={styles.permissionLeft}>
                <View style={styles.iconBox}>
                    <Feather name={icon} size={18} color={colors.cyan} />
                </View>
                <Text style={type.bodyText}>{label}</Text>
            </View>
            <Switch
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.cyan }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.1)"
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 20 },
    logosRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
    logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    logoText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: '#FFFFFF' },
    connectorContainer: { flexDirection: 'row', gap: 6, marginHorizontal: spacing.md },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.dim },
    title: { ...type.h4, fontSize: 20, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...type.small, textAlign: 'center', marginBottom: spacing.xxl, paddingHorizontal: spacing.md },
    permissionsCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.card, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg },
    permissionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
    permissionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(57,195,242,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    securityNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
    securityText: { ...type.small, fontSize: 11 },
    footer: { padding: spacing.lg, paddingBottom: 60 },
    primaryBtn: { height: 52, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' }
});