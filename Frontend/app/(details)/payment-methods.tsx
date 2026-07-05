// Perfil — pantalla que lista las billeteras/métodos de pago del usuario.
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { colors, fonts } from '@/theme/tokens';
import { fmt } from '@/utils/format';
import { useWallets } from '@/context/WalletsContext';

export default function PaymentMethodsScreen() {
    // Billeteras REALES del contexto (las mismas que la tab Billeteras), así
    // conectar/desconectar se refleja también acá.
    const { wallets, isLoading, refresh } = useWallets();

    // Refresca al enfocar la pantalla (aparece la recién conectada / desaparece la desvinculada).
    useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

    return (
        <View style={styles.root}>
            <AuroraBackground />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScreenHeader title="Métodos de Pago" onBack={() => router.back()} />

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.cyan} />
                    }
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billeteras vinculadas</Text>

                        {wallets.length === 0 && !isLoading ? (
                            <Text style={styles.empty}>Todavía no vinculaste ninguna billetera.</Text>
                        ) : (
                            wallets.map((w) => (
                                <Pressable
                                    key={w.key}
                                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                                    onPress={() =>
                                        router.push({ pathname: '/wallet-detail', params: { wallet: w.key } })
                                    }
                                >
                                    <WalletGlyph wallet={w.key} size={40} />
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.entity}>{w.name}</Text>
                                        <Text style={styles.detailText}>Vinculada · {fmt(w.bal)}</Text>
                                    </View>
                                    <Text style={styles.chev}>›</Text>
                                </Pressable>
                            ))
                        )}
                    </View>

                    <Pressable style={styles.addButton} onPress={() => router.push('/connect-list')}>
                        <View style={styles.plusCircle}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.text} strokeWidth={2.2} fill="none">
                                <Path d="M12 5v14M5 12h14" />
                            </Svg>
                        </View>
                        <Text style={styles.addText}>Conectar nueva billetera</Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    section: { marginBottom: 24 },
    sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.cyan, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    empty: { fontFamily: fonts.body, fontSize: 13, color: colors.dim, marginTop: 4 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: 10,
    },
    itemDetails: { flex: 1, marginLeft: 14 },
    entity: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    detailText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
    chev: { fontFamily: fonts.body, fontSize: 20, color: colors.dim, marginLeft: 8 },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        marginTop: 10,
    },
    plusCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addText: { marginLeft: 14, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
});
