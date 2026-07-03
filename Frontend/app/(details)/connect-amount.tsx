import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { WALLET_CATALOG } from '@/data/wallets';
import { vincularCuentaBilletera } from '@/api/cuentas';

export default function ConnectAmountScreen() {
    const { wallet, id } = useLocalSearchParams();
    const paramKey = typeof wallet === 'string' ? wallet : (typeof id === 'string' ? id : 'bb');
    const walletInfo = WALLET_CATALOG[paramKey] || WALLET_CATALOG['bb'];

    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Formateador visual para agregar puntos a los miles
    const formatCurrency = (text: string) => {
        const cleaned = text.replace(/[^0-9,]/g, '');
        const parts = cleaned.split(',');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (parts.length > 2) return amount;
        if (parts[1] && parts[1].length > 2) parts[1] = parts[1].substring(0, 2);
        return parts.join(',');
    };

    const handleTextChange = (text: string) => {
        setAmount(formatCurrency(text));
    };

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount < 0) {
            Alert.alert('Monto inválido', 'Por favor ingresá un saldo válido.');
            return;
        }

        setLoading(true);
        try {
            const aliasName = `Mi ${walletInfo.name}`;
            await vincularCuentaBilletera(walletInfo.dbId, aliasName, numericAmount);
            router.push({ pathname: '/(details)/connect-syncing', params: { wallet: paramKey } });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo vincular la cuenta. Verificá la conexión al servidor.');
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <AuroraBackground />
                    <View style={{ paddingTop: 48 }}>
                        <ScreenHeader title="Saldo Actual" />
                    </View>

                    <View style={styles.content}>
                        <View style={[styles.logoCircle, { backgroundColor: walletInfo.color }]}>
                            <Text style={styles.logoText}>{walletInfo.initials}</Text>
                        </View>

                        <Text style={styles.title}>¿Cuánto dinero tenés en {walletInfo.name}?</Text>
                        <Text style={styles.subtitle}>
                            Ingresá tu saldo actual para que SaOT mantenga tu balance unificado sincronizado.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="decimal-pad"
                                placeholder="0,00"
                                placeholderTextColor={colors.dim}
                                value={amount}
                                onChangeText={handleTextChange}
                                autoFocus
                            />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={[shadow.cta, { borderRadius: radii.button, flex: 1 }]}>
                            <Pressable android_ripple={{ color: 'rgba(0,0,0,0.12)' }} onPress={handleSubmit} disabled={loading}>
                                <LinearGradient colors={gradients.cyan} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={type.button}>Guardar y Sincronizar</Text>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
    logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    logoText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: '#FFFFFF' },
    title: { ...type.h4, fontSize: 22, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...type.body, textAlign: 'center', color: colors.dim, marginBottom: 40 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.cyan, paddingBottom: spacing.sm, minWidth: 200, justifyContent: 'center' },
    currencySymbol: { ...type.display, fontSize: 32, color: colors.cyan, marginRight: spacing.xs },
    input: { ...type.display, fontSize: 40, color: colors.text, minWidth: 120, textAlign: 'center' },
    footer: { padding: spacing.lg, paddingBottom: 60 },
    primaryBtn: { height: 52, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' }
});