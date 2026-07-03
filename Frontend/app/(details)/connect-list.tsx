import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuroraBackground } from '@/components/AuroraBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WalletGlyph } from '@/components/WalletGlyph';
import type { WalletGlyphKey } from '@/components/WalletGlyph';
import { colors, radii, spacing, type } from '@/theme/tokens';

// B3 — Código de Fabricio: Solo muestra billeteras con logo real en assets.
type AvailableWallet = {
    id: string;
    glyph: WalletGlyphKey;
    name: string;
    desc: string;
    color: string;
    short: string;
};

const AVAILABLE_WALLETS: AvailableWallet[] = [
    { id: 'bb', glyph: 'bb', name: 'Brubank', desc: 'Banco digital · ARG', color: '#6842FF', short: 'BB' },
    { id: 'nx', glyph: 'nx', name: 'Naranja X', desc: 'Billetera virtual · ARG', color: '#FF5C00', short: 'NX' },
];

export default function ConnectListScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredWallets = AVAILABLE_WALLETS.filter((wallet) => {
        const q = searchQuery.toLowerCase();
        return (
            wallet.name.toLowerCase().includes(q) ||
            wallet.short.toLowerCase().includes(q)
        );
    });

    return (
        <View style={styles.container}>
            <AuroraBackground />

            <View style={{ paddingTop: 48 }}>
                <ScreenHeader title="Conectar billetera" />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <Text style={styles.description}>
                    Vinculá tu billetera o cuenta digital para ver tu balance y operar desde SaOT.
                    La conexión es segura y podés desconectarla cuando quieras.
                </Text>

                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color={colors.dim} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar billetera"
                        placeholderTextColor={colors.dim}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <Text style={type.label}>DISPONIBLES</Text>

                <View style={styles.listContainer}>
                    {filteredWallets.length > 0 ? (
                        filteredWallets.map((wallet) => (
                            <ConnectRow
                                key={wallet.id}
                                wallet={wallet}
                                // Lógica de Franco (B4-FE): Pasamos un único parámetro limpio.
                                onPress={() => router.push({ pathname: '/(details)/connect-permissions', params: { wallet: wallet.id } })}
                            />
                        ))
                    ) : (
                        <Text style={styles.noResultsText}>No se encontraron resultados.</Text>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

function ConnectRow({ wallet, onPress }: { wallet: AvailableWallet; onPress?: () => void }) {
    return (
        <Pressable style={styles.row} onPress={onPress}>
            {/* Componente visual de Fabricio */}
            <WalletGlyph wallet={wallet.glyph} size={44} />

            <View style={styles.rowInfo}>
                <Text style={type.bodyText}>{wallet.name}</Text>
                <Text style={type.small}>{wallet.desc}</Text>
            </View>

            <Feather name="chevron-right" size={20} color={colors.dim} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 40 },
    description: { ...type.small, marginBottom: spacing.xl, lineHeight: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.input, paddingHorizontal: spacing.lg, height: 52, marginBottom: spacing.xxl },
    searchInput: { flex: 1, marginLeft: spacing.sm, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, color: colors.text },
    listContainer: { marginTop: spacing.md },
    noResultsText: { ...type.body, textAlign: 'center', marginTop: spacing.xl },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.hairline },
    rowInfo: { flex: 1 },
});