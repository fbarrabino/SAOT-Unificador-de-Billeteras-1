import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/theme/tokens';
import { AuroraBackground } from '@/components/AuroraBackground';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor, completá todas las contraseñas.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Atención', 'La nueva contraseña no puede ser igual a la actual.');
      return;
    }

    setIsLoading(true);

    try {
      // MOCK: Simulación de petición al backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('¡Éxito!', 'Tu contraseña fue actualizada correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la contraseña. Intentá más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cambiar contraseña</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA ACTUAL</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Ingresá tu contraseña actual"
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                  <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={22} color={colors.dim} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ingresá tu nueva contraseña"
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                  <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={22} color={colors.dim} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>REPETIR NUEVA CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repetí tu nueva contraseña"
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={22} color={colors.dim} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Botón CTA */}
          <TouchableOpacity
            style={[
              styles.button,
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={[
              styles.buttonText,
              isLoading && styles.buttonTextDisabled
            ]}>
              {isLoading ? 'Guardando...' : 'Cambiar contraseña'}
            </Text>
          </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  formContainer: {
    flex: 1,
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.body,
  },
  eyeIcon: {
    padding: 12,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.cyan,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#06121A',
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  buttonTextDisabled: {
    color: colors.dim,
  },
});