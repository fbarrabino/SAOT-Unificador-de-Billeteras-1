import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, fonts, type } from '@/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  password?: boolean;
};

export function Input({ label, password, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!password);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[type.label, styles.label]}>{label}</Text> : null}
      <View style={styles.field}>
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.dim}
          style={[styles.input, style]}
        />
        {password ? (
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
            {/* Ojo abierto cuando la contraseña está visible; cerrado cuando está oculta. */}
            <Feather name={hidden ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 8, marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 50,
    borderRadius: radii.input,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingVertical: 12,
  },
});
