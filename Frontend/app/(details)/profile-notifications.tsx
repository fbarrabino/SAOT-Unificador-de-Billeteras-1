import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToggleRow } from '@/components/ToggleRow';
import { colors, fonts } from '@/theme/tokens';

export default function ProfileNotificationsScreen() {
    // Estados PUSH
    const [pushTransacciones, setPushTransacciones] = useState(true);
    const [pushSeguridad, setPushSeguridad] = useState(true);
    const [pushPromociones, setPushPromociones] = useState(false);

    // Estados EMAIL
    const [emailTransacciones, setEmailTransacciones] = useState(true);
    const [emailResumen, setEmailResumen] = useState(true);
    const [emailPromociones, setEmailPromociones] = useState(false);

    // Estados SONIDO Y VIBRACIÓN
    const [sonido, setSonido] = useState(true);
    const [vibracion, setVibracion] = useState(true);

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
                            value={pushTransacciones}
                            onValueChange={setPushTransacciones}
                        />
                        <ToggleRow
                            label="Seguridad"
                            sub="Inicios de sesión, cambios"
                            value={pushSeguridad}
                            onValueChange={setPushSeguridad}
                        />
                        <ToggleRow
                            label="Promociones"
                            sub="Novedades y ofertas"
                            value={pushPromociones}
                            onValueChange={setPushPromociones}
                            isLast
                        />
                    </View>

                    {/* SECCIÓN EMAIL */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>EMAIL</Text>
                    <View style={styles.configGroup}>
                        <ToggleRow
                            label="Cada transacción"
                            value={emailTransacciones}
                            onValueChange={setEmailTransacciones}
                        />
                        <ToggleRow
                            label="Resumen semanal"
                            value={emailResumen}
                            onValueChange={setEmailResumen}
                        />
                        <ToggleRow
                            label="Promociones"
                            value={emailPromociones}
                            onValueChange={setEmailPromociones}
                            isLast
                        />
                    </View>

                    {/* SECCIÓN SONIDO Y VIBRACIÓN */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>SONIDO Y VIBRACIÓN</Text>
                    <View style={styles.configGroup}>
                        <ToggleRow
                            label="Sonido al recibir"
                            value={sonido}
                            onValueChange={setSonido}
                        />
                        <ToggleRow
                            label="Vibración"
                            value={vibracion}
                            onValueChange={setVibracion}
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