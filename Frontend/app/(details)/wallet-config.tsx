import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import { colors, fonts } from '@/theme/tokens';
import { metodosPagoApi } from '@/api/metodosPago';
import { ToggleRow } from '@/components/ToggleRow';

// Helper para mapear el nombre de la BD con el tipo que espera tu WalletGlyph ('mp' | 'ua' | 'lm')
const getWalletKey = (entidad: string) => {
    const normalized = entidad.toLowerCase();
    if (normalized.includes('mercado')) return 'mp';
    if (normalized.includes('ual')) return 'ua';
    if (normalized.includes('lemon')) return 'lm';
    // Fallback a mercado pago si no reconoce la billetera
    return 'mp';
};

export default function WalletConfigScreen() {
    // Recibimos los parámetros que le pasemos desde la pantalla anterior
    const params = useLocalSearchParams();
    const metodoId = params.id ? Number(params.id) : 0;
    const entidadEmisora = (params.entidad as string) || 'Billetera';
    const ultimosCuatro = (params.ultimosCuatro as string) || '0000';

    const walletKey = getWalletKey(entidadEmisora);

    // Estados de los toggles
    const [compras, setCompras] = useState(true);
    const [sincronizar, setSincronizar] = useState(true);
    const [notificar, setNotificar] = useState(false);

    const [loading, setLoading] = useState(false);

    // Función para pegarle al endpoint BE-08 (Eliminar)
    const handleDesconectar = () => {
        Alert.alert(
            '¿Desconectar billetera?',
            `Vas a dejar de ver los saldos y movimientos de ${entidadEmisora}. Podés volver a vincularla cuando quieras.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desconectar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await metodosPagoApi.delete(metodoId);
                            router.back(); // Volvemos a la lista anterior cuando se elimina
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo desconectar la billetera en este momento.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.root}>
            <AuroraBackground />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScreenHeader title="Configuración" onBack={() => router.back()} />

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Cabecera de la Billetera (Usa tu WalletGlyph) */}
                    <View style={styles.headerCard}>
                        <WalletGlyph wallet={walletKey as any} size={56} />
                        <Text style={styles.walletName}>{entidadEmisora}</Text>
                        <Text style={styles.walletSub}>Terminada en •••• {ultimosCuatro}</Text>
                    </View>

                    {/* Sección de Permisos */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Permisos y Accesos</Text>

                        <View style={styles.configGroup}>
                            <ToggleRow
                                label="Permitir compras"
                                sub="Usar el saldo para pagos con QR"
                                value={compras}
                                onValueChange={setCompras}
                            />
                            <ToggleRow
                                label="Sincronizar saldos automáticamente"
                                sub="Actualiza tus movimientos en segundo plano"
                                value={sincronizar}
                                onValueChange={setSincronizar}
                            />
                            <ToggleRow
                                label="Notificar movimientos"
                                sub="Avisos cuando ingrese o salga dinero"
                                value={notificar}
                                onValueChange={setNotificar}
                                isLast
                            />
                        </View>
                    </View>

                    {/* Botón de Peligro: Desconectar */}
                    <Pressable
                        style={({ pressed }) => [styles.dangerButton, pressed && { opacity: 0.7 }]}
                        onPress={handleDesconectar}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.red} />
                        ) : (
                            <Text style={styles.dangerText}>Desconectar billetera</Text>
                        )}
                    </Pressable>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}


const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },

    headerCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: 32,
    },
    walletName: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.text, marginTop: 16 },
    walletSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4 },

    section: { marginBottom: 32 },
    sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.dim, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

    configGroup: {
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
    },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    toggleBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
    },
    toggleTextContainer: { flex: 1, paddingRight: 16 },
    toggleLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    toggleSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },

    dangerButton: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Fondo rojo sutil
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerText: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        color: colors.red,
    }
});