import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, fonts } from '@/theme/tokens';

// MOCK DATA: Tarjetas simuladas para poder probar la navegación a la FE-06
// TODO: FE-18 - Remover MOCK_METHODS y usar datos reales al integrar con la API
const MOCK_METHODS = [
    {
        metodoId: 101,
        tipo: 'Cuenta',
        entidadEmisora: 'Mercado Pago',
        ultimosCuatro: '1234'
    },
    {
        metodoId: 102,
        tipo: 'Cuenta',
        entidadEmisora: 'Ualá',
        ultimosCuatro: '5678'
    },
    {
        metodoId: 103,
        tipo: 'Cuenta',
        entidadEmisora: 'Lemon',
        ultimosCuatro: '9999'
    }
];

export default function PaymentMethodsScreen() {

    // Función de renderizado conectada a tu nueva pantalla FE-06
    const renderItem = (item: any) => (
        <Pressable
            key={item.metodoId}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            onPress={() => router.push({
                pathname: '/wallet-config',
                params: {
                    id: item.metodoId,
                    entidad: item.entidadEmisora,
                    ultimosCuatro: item.ultimosCuatro
                }
            })}
        >
            <View style={styles.iconCircle}>
                <Svg width={20} height={20} viewBox="0 0 24 24" stroke={colors.cyan} strokeWidth={2} fill="none">
                    <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
                </Svg>
            </View>
            <View style={styles.itemDetails}>
                <Text style={styles.entity}>{item.entidadEmisora}</Text>
                <Text style={styles.detailText}>{item.tipo} vinculada •••• {item.ultimosCuatro}</Text>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.root}>
            <AuroraBackground />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScreenHeader title="Métodos de Pago" onBack={() => router.back()} />

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cuentas Vinculadas (Entorno de Prueba)</Text>
                        {MOCK_METHODS.map(renderItem)}
                    </View>

                    {/* Botón ahora conectado a la pantalla connect-list.tsx que vi en tus carpetas */}
                    <Pressable
                        style={styles.addButton}
                        onPress={() => router.push('/connect-list')}
                    >
                        <View style={styles.plusCircle}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" stroke={colors.text} strokeWidth={2.2} fill="none">
                                <Path d="M12 5v14M5 12h14" />
                            </Svg>
                        </View>
                        <Text style={styles.addText}>Agregar nuevo método</Text>
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
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemDetails: { flex: 1, marginLeft: 14 },
    entity: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    detailText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
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