import React from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuroraBackground } from '@/components/AuroraBackground';
import { colors, radii, spacing, type } from '@/theme/tokens';
import { useSession } from '@/context/SessionContext';

// Perfil — pantalla de confirmación para cerrar sesión y volver al login.
export default function ProfileLogoutScreen() {
    const { logout } = useSession();
    return (
        <View style={styles.container}>
            <AuroraBackground />

            {/* Cabecera con zIndex para que la X sea clickeable */}
            <View style={styles.header}>
                <Pressable style={styles.closeBtn} onPress={() => router.back()}>
                    <Feather name="x" size={24} color={colors.text} />
                </Pressable>
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircleOuter}>
                    <View style={styles.iconCircleInner}>
                        <Feather name="log-out" size={32} color={colors.red} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>¿Cerrar{'\n'}sesión?</Text>
                    <Text style={styles.subtitle}>
                        Vas a tener que volver a ingresar con tu email y contraseña la próxima vez.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={styles.dangerBtn}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                    onPress={() => { logout(); router.replace('/(auth)/login'); }}
                >
                    <Text style={[type.button, { color: '#FFFFFF' }]}>Cerrar sesión</Text>
                </Pressable>

                <Pressable style={styles.ghostBtn} onPress={() => router.back()}>
                    <Text style={[type.button, { color: colors.text }]}>Cancelar</Text>
                </Pressable>
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
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
        alignItems: 'flex-end',
        zIndex: 10, // EL FIX: Fuerza a la cabecera a estar por encima del contenido
    },
    closeBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.icon,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        marginTop: -60,
    },
    iconCircleOuter: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(248,113,113,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    iconCircleInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(248,113,113,0.2)',
        borderWidth: 1,
        borderColor: colors.red,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        ...type.display,
        fontSize: 32,
        color: colors.text,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: spacing.md,
    },
    subtitle: {
        ...type.body,
        textAlign: 'center',
        color: colors.dim,
        lineHeight: 22,
        paddingHorizontal: spacing.lg,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
        gap: spacing.sm,
    },
    dangerBtn: {
        height: 52,
        borderRadius: radii.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.red,
        shadowColor: colors.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    ghostBtn: {
        height: 52,
        borderRadius: radii.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    }
});