// Perfil — pantalla de ajustes de seguridad (Face ID, PIN, 2FA, pagos biométricos).
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type } from '@/theme/tokens';

export default function ProfileSecurityScreen() {
    const [faceId, setFaceId] = useState(true);
    const [pin, setPin] = useState(true);
    const [twoFactor, setTwoFactor] = useState(true);
    const [bioPayments, setBioPayments] = useState(false);

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={{ paddingTop: 48 }}>
                <ScreenHeader title="Seguridad" />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionLabel}>ACCESO</Text>
                <View style={styles.card}>
                    <ToggleRow
                        icon="lock" title="Face ID" subtitle="Desbloquear con tu rostro"
                        value={faceId} onValueChange={setFaceId}
                    />
                    <ToggleRow
                        icon="lock" title="PIN de la app" subtitle="Pedir PIN al abrir"
                        value={pin} onValueChange={setPin}
                    />
                    <ToggleRow
                        icon="lock" title="Autenticación en dos pasos" subtitle="Código adicional al ingresar"
                        value={twoFactor} onValueChange={setTwoFactor} noBorder
                    />
                </View>

                <Text style={styles.sectionLabel}>PAGOS</Text>
                <View style={styles.card}>
                    <ToggleRow
                        icon="credit-card" title="Confirmar con biometría" subtitle="Pedir Face ID al pagar"
                        value={bioPayments} onValueChange={setBioPayments} noBorder
                    />
                </View>

                <Text style={styles.sectionLabel}>CUENTA</Text>
                <View style={styles.card}>
                    <LinkRow icon="lock" title="Cambiar contraseña" onPress={() => router.push('/change-password')} />
                    <LinkRow icon="smartphone" title="Dispositivos conectados" subtitle="Ver sesiones activas" onPress={() => router.push('/connected-devices')} />
                    <LinkRow
                        icon="log-out"
                        title="Cerrar sesión en todos lados"
                        isDestructive
                        noBorder
                        onPress={() => router.push('/profile-logout')}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

function ToggleRow({ icon, title, subtitle, value, onValueChange, noBorder }: any) {
    return (
        <View style={[styles.row, !noBorder && styles.rowBorder]}>
            <View style={styles.rowIcon}>
                <Feather name={icon} size={18} color={colors.cyan} />
            </View>
            <View style={styles.rowInfo}>
                <Text style={type.bodyText}>{title}</Text>
                {subtitle && <Text style={type.small}>{subtitle}</Text>}
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

function LinkRow({ icon, title, subtitle, isDestructive, noBorder, onPress }: any) {
    const textColor = isDestructive ? colors.red : colors.text;
    const iconColor = isDestructive ? colors.red : colors.cyan;

    return (
        <Pressable style={[styles.row, !noBorder && styles.rowBorder]} onPress={onPress}>
            <View style={styles.rowIcon}>
                <Feather name={icon} size={18} color={iconColor} />
            </View>
            <View style={styles.rowInfo}>
                <Text style={[type.bodyText, { color: textColor }]}>{title}</Text>
                {subtitle && <Text style={type.small}>{subtitle}</Text>}
            </View>
            <Feather name="chevron-right" size={20} color={isDestructive ? colors.red : colors.dim} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: 40,
    },
    sectionLabel: {
        ...type.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
        marginTop: spacing.lg,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingHorizontal: spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    rowInfo: {
        flex: 1,
        justifyContent: 'center',
    }
});