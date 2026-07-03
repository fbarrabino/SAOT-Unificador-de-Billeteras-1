import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { useSession } from '@/context/SessionContext';

export default function ProfileEditScreen() {
    // D2 — los datos arrancan del usuario logueado, no de valores hardcodeados.
    // El guardado real (PUT), país y foto de perfil los implementa Franco.
    const { usuario } = useSession();

    const nombreCompleto = usuario
        ? `${usuario.nombre} ${usuario.apellido}`.trim()
        : '';
    const usuarioHandle = usuario
        ? '@' + usuario.email.split('@')[0]
        : '';

    const [name, setName] = useState(nombreCompleto);
    const [user, setUser] = useState(usuarioHandle);
    const [email, setEmail] = useState(usuario?.email ?? '');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('Argentina');

    const iniciales = (usuario
        ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`
        : 'SA'
    ).toUpperCase();

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={{ paddingTop: 48 }}>
                <ScreenHeader title="Editar perfil" />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <LinearGradient
                            colors={gradients.lime}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Text style={styles.avatarText}>{iniciales}</Text>

                        <Pressable style={styles.editIconBadge}>
                            <Feather name="image" size={14} color="#FFFFFF" />
                        </Pressable>
                    </View>
                    <Pressable>
                        <Text style={[type.small, { color: colors.cyan, marginTop: spacing.md }]}>
                            Cambiar foto
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.formSection}>
                    <FormInput label="NOMBRE COMPLETO" value={name} onChange={setName} />
                    <FormInput label="USUARIO" value={user} onChange={setUser} />
                    <FormInput label="EMAIL" value={email} onChange={setEmail} keyboardType="email-address" />
                    <FormInput label="TELÉFONO" value={phone} onChange={setPhone} keyboardType="phone-pad" />
                    <FormInput label="PAÍS" value={country} onChange={setCountry} editable={false} />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <View style={[shadow.cta, { borderRadius: radii.button }]}>
                    {/* Al presionar Guardar, vuelve a la pantalla de Perfil simulando éxito */}
                    <Pressable android_ripple={{ color: 'rgba(0,0,0,0.12)' }} onPress={() => router.back()}>
                        <LinearGradient
                            colors={gradients.cyan}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryBtn}
                        >
                            <Text style={[type.button, { color: '#06121A' }]}>Guardar cambios</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

function FormInput({ label, value, onChange, keyboardType = 'default', editable = true }: any) {
    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.inputWrapper, !editable && { opacity: 0.6 }]}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                    editable={editable}
                    placeholderTextColor={colors.dim}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 28,
        color: '#06121A',
        zIndex: 1,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.surface2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.bg,
        zIndex: 2,
    },
    formSection: {
        gap: spacing.lg,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        ...type.label,
        fontSize: 11,
        marginBottom: spacing.xs,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: radii.input,
        borderWidth: 1,
        borderColor: colors.hairline,
        height: 52,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
    },
    input: {
        ...type.bodyText,
        color: colors.text,
        height: '100%',
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
    }
});