import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToggleRow } from '@/components/ToggleRow';
import { useSettings } from '@/context/SettingsContext';
import { colors, fonts } from '@/theme/tokens';

// Perfil — pantalla de preferencias de notificaciones (push y email) con toggles.
// Las preferencias viven en SettingsContext (persistidas en AsyncStorage), así se
// mantienen al salir/volver de la pantalla y entre reinicios de la app.
export default function ProfileNotificationsScreen() {
    const { settings, setSetting } = useSettings();

    return (
        <View style={styles.root}>
            <AuroraBackground />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScreenHeader title="Notificaciones" onBack={() => router.back()} />

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* SECCIÓN PUSH */}
                    <Text style={styles.sectionTitle}>PUSH</Text>
                    <View style={styles.configGroup}>
                        <ToggleRow
                            label="Transacciones"
                            sub="Cada vez que recibas o pagues"
                            value={settings.pushTransacciones}
                            onValueChange={(v) => setSetting('pushTransacciones', v)}
                        />
                        <ToggleRow
                            label="Seguridad"
                            sub="Inicios de sesión, cambios"
                            value={settings.pushSeguridad}
                            onValueChange={(v) => setSetting('pushSeguridad', v)}
                        />
                        <ToggleRow
                            label="Promociones"
                            sub="Novedades y ofertas"
                            value={settings.pushPromociones}
                            onValueChange={(v) => setSetting('pushPromociones', v)}
                            isLast
                        />
                    </View>

                    {/* SECCIÓN EMAIL */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>EMAIL</Text>
                    <View style={styles.configGroup}>
                        <ToggleRow
                            label="Cada transacción"
                            value={settings.emailTransacciones}
                            onValueChange={(v) => setSetting('emailTransacciones', v)}
                        />
                        <ToggleRow
                            label="Resumen semanal"
                            value={settings.emailResumen}
                            onValueChange={(v) => setSetting('emailResumen', v)}
                        />
                        <ToggleRow
                            label="Promociones"
                            value={settings.emailPromociones}
                            onValueChange={(v) => setSetting('emailPromociones', v)}
                            isLast
                        />
                    </View>

                    {/* SECCIÓN SONIDO Y VIBRACIÓN */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>SONIDO Y VIBRACIÓN</Text>
                    <View style={styles.configGroup}>
                        <ToggleRow
                            label="Sonido al recibir"
                            value={settings.sonido}
                            onValueChange={(v) => setSetting('sonido', v)}
                        />
                        <ToggleRow
                            label="Vibración"
                            value={settings.vibracion}
                            onValueChange={(v) => setSetting('vibracion', v)}
                            isLast
                        />
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
    configGroup: {
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
    },
});