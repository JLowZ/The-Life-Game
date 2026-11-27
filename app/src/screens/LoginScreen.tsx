import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { FormScreen } from '@/components/FormScreen';
import { PixelButton } from '@/components/PixelButton';
import { PixelTextInput } from '@/components/PixelTextInput';
import { colors } from '@/config/theme';
import { FORGOT_PASSWORD_TEXT } from '@/content/authTexts';
import { signIn } from '@/services/authService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

/** RN-AUTH-07: inicio de sesión con nombre de usuario o correo. */
export function LoginScreen() {
  const deps = useAppDeps();
  const setUser = useSessionStore((s) => s.setUser);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn(deps, { identifier, password });
      if (result.ok) {
        // El layout redirige solo según el estado de la sesión.
        setUser(result.user);
      } else {
        setError(result.error);
      }
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen title="Iniciar sesión" subtitle="Entra con tu nombre de usuario o tu correo.">
      <PixelTextInput
        label="Usuario o correo"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
      />
      <PixelTextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        onSubmitEditing={handleSubmit}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <PixelButton label="Entrar" onPress={handleSubmit} loading={submitting} />
      <PixelButton
        label="¿Olvidaste tu contraseña?"
        variant="link"
        onPress={() => setShowForgot((v) => !v)}
      />
      {showForgot ? <Text style={styles.info}>{FORGOT_PASSWORD_TEXT}</Text> : null}
      <PixelButton
        label="No tengo cuenta: crear una"
        variant="link"
        onPress={() => router.replace('/register')}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
  info: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
