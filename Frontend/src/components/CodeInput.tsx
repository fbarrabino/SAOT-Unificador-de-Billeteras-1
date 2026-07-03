import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Keyboard, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

type Props = {
  length?: number;
  onChange?: (code: string) => void;
};

export function CodeInput({ length = 6, onChange }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<TextInput | null>>([]);

  function handleChange(index: number, text: string) {
    const ch = text.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[index] = ch;
    setValues(next);
    onChange?.(next.join(''));
    if (ch && index < length - 1) {
      refs.current[index + 1]?.focus();
    } else if (ch && index === length - 1) {
      // Último dígito: el teclado numérico no tiene botón "Listo",
      // así que lo cerramos solos para dejar libre el CTA.
      Keyboard.dismiss();
    }
  }

  function handleKey(index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {values.map((v, i) => (
        <TextInput
          key={i}
          ref={r => {
            refs.current[i] = r;
          }}
          value={v}
          onChangeText={t => handleChange(i, t)}
          onKeyPress={e => handleKey(i, e)}
          keyboardType="number-pad"
          maxLength={1}
          style={[styles.cell, v ? styles.cellFilled : null]}
          selectionColor={colors.cyan}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderRadius: radii.input,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fonts.displayBold,
    fontSize: 22,
  },
  cellFilled: {
    borderColor: 'rgba(57,195,242,0.5)',
    backgroundColor: 'rgba(57,195,242,0.10)',
  },
});
