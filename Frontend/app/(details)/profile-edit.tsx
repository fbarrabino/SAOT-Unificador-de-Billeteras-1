import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radii, spacing, type, gradients, shadow } from '@/theme/tokens';
import { useSession } from '@/context/SessionContext';
import { actualizarPerfil, subirFotoPerfil, urlFotoPerfil } from '@/api/usuarios';
import { ApiError } from '@/api/client';

// Separa "Nombre Apellido" en sus dos partes para el body del PUT
// (la pantalla usa un único input de nombre completo).
function separarNombreApellido(nombreCompleto: string): { nombre: string; apellido: string } {
    const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    return { nombre: partes[0] ?? '', apellido: partes.slice(1).join(' ') };
}

export default function ProfileEditScreen() {
    // D2 — los datos arrancan del usuario logueado, no de valores hardcodeados.
    const { usuario, actualizarUsuario } = useSession();

    const nombreCompleto = usuario
        ? `${usuario.nombre} ${usuario.apellido}`.trim()
        : '';
    const usuarioHandle = usuario
        ? '@' + usuario.email.split('@')[0]
        : '';

    const [name, setName] = useState(nombreCompleto);
    const [user, setUser] = useState(usuarioHandle);
    const [email, setEmail] = useState(usuario?.email ?? '');
    const [phone, setPhone] = useState(usuario?.telefono ?? '');
    const [country, setCountry] = useState(usuario?.pais ?? 'Argentina');
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const iniciales = (usuario
        ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`
        : 'SA'
    ).toUpperCase();

    const fotoUri = urlFotoPerfil(usuario?.fotoPerfilUrl ?? null);

    async function handleGuardar() {
        const { nombre, apellido } = separarNombreApellido(name);

        if (!nombre) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'El email es obligatorio.');
            return;
        }

        setGuardando(true);
        try {
            const actualizado = await actualizarPerfil({
                nombre,
                apellido,
                email: email.trim(),
                pais: country.trim() || null,
                telefono: phone.trim() || null,
            });
            actualizarUsuario(actualizado);
            router.back();
        } catch (err) {
            let mensaje: string;
            if (err instanceof ApiError) {
                switch (err.status) {
                    case 0:
                        mensaje = 'Sin conexión al servidor. Verificá tu red o que el backend esté activo.';
                        break;
                    case 400:
                        mensaje = err.mensaje || 'Datos inválidos. Revisá los campos ingresados.';
                        break;
                    case 401:
                        mensaje = 'Tu sesión expiró. Iniciá sesión nuevamente.';
                        break;
                    case 500:
                    case 502:
                    case 503:
                        mensaje = 'El servidor tuvo un problema interno. Intentá más tarde.';
                        break;
                    default:
                        mensaje = err.mensaje || `Error inesperado (${err.status}).`;
                }
            } else if (err instanceof Error) {
                mensaje = err.message;
            } else {
                mensaje = 'Ocurrió un error desconocido al guardar los cambios.';
            }
            Alert.alert('Error', mensaje);
        } finally {
            setGuardando(false);
        }
    }

    async function elegirYSubirFoto() {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
            Alert.alert('Permiso necesario', 'Habilitá el acceso a tus fotos para cambiar la imagen de perfil.');
            return;
        }

        const resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
        });

        if (resultado.canceled || !resultado.assets[0]?.base64) return;

        setSubiendoFoto(true);
        try {
            const actualizado = await subirFotoPerfil(resultado.assets[0].base64);
            actualizarUsuario(actualizado);
        } catch (err) {
            const mensaje = err instanceof ApiError ? err.mensaje : 'No se pudo subir la foto. Intentá de nuevo.';
            Alert.alert('Error', mensaje);
        } finally {
            setSubiendoFoto(false);
        }
    }

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={{ paddingTop: 48 }}>
                <ScreenHeader title="Editar perfil" />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >

                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        {fotoUri ? (
                            <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFillObject} />
                        ) : (
                            <>
                                <LinearGradient
                                    colors={gradients.lime}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <Text style={styles.avatarText}>{iniciales}</Text>
                            </>
                        )}

                        <Pressable style={styles.editIconBadge} onPress={elegirYSubirFoto} disabled={subiendoFoto}>
                            <Feather name={subiendoFoto ? 'loader' : 'image'} size={14} color="#FFFFFF" />
                        </Pressable>
                    </View>
                    <Pressable onPress={elegirYSubirFoto} disabled={subiendoFoto}>
                        <Text style={[type.small, { color: colors.cyan, marginTop: spacing.md }]}>
                            {subiendoFoto ? 'Subiendo...' : 'Cambiar foto'}
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

                <View style={styles.footer}>
                    <View style={[shadow.cta, { borderRadius: radii.button }]}>
                        {/* El botón va DENTRO del scroll para que no flote sobre el teclado. */}
                        <Pressable
                            android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                            onPress={handleGuardar}
                            disabled={guardando}
                        >
                            <LinearGradient
                                colors={gradients.cyan}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.primaryBtn, guardando && { opacity: 0.7 }]}
                            >
                                <Text style={[type.button, { color: '#06121A' }]}>
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
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
        marginTop: spacing.xl,
    },
    primaryBtn: {
        height: 52,
        borderRadius: radii.button,
        alignItems: 'center',
        justifyContent: 'center',
    }
});