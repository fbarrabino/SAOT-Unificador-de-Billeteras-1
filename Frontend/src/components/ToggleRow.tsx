import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type ToggleRowProps = {
    label: string;
    sub?: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
    isLast?: boolean;
};

export function ToggleRow({ label, sub, value, onValueChange, isLast = false }: ToggleRowProps) {
    return (
        <View style={[styles.toggleRow, !isLast && styles.toggleBorder]}>
            <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>{label}</Text>
                {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
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

const styles = StyleSheet.create({
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
});