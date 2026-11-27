import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormScreen } from '@/components/FormScreen';
import { PixelButton } from '@/components/PixelButton';
import { PixelCheckbox } from '@/components/PixelCheckbox';
import { PixelTextInput } from '@/components/PixelTextInput';
import { MIN_PASSWORD_LENGTH, USERNAME_MAX_LENGTH } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import {
  PRIVACY_NOTICE_SECTIONS,
  PRIVACY_NOTICE_TITLE,
  PRIVACY_NOTICE_UPDATED_AT,
} from '@/content/authTexts';
import type { RegistrationField } from '@/domain/auth';
import { checkAccountAvailability } from '@/services/authService';
import { useAppDeps } from '@/services/useAppDeps';
import { useRegistrationDraftStore } from '@/state/useRegistrationDraftStore';

/**
 * RN-AUTH-02, paso 1: usuario, correo, contraseña y aviso de privacidad (C-25).
 * Valida y comprueba que estén libres, pero NO crea la cuenta: eso ocurre al
 * terminar el onboarding (R-34). Al volver atrás, los campos siguen rellenos.
 */
export function RegisterScreen() {
  const deps = useAppDeps();
  const draft = useRegistrationDraftStore((s) => s.draft);
  const setDraft = useRegistrationDraftStore((s) => s.setDraft);
  const [username, setUsername] = useState(draft?.username ?? '');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [privacyAccepted, setPrivacyAccepted] = useState(draft?.privacyAccepted ?? false);
  const [showNotice, setShowNotice] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RegistrationField, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setGeneralError(null);
    try {
      const input = { username, email, password, privacyAccepted };
      const result = await checkAccountAvailability(deps, input);
      if (result.ok) {
        setErrors({});
        setDraft(input);
        router.push('/onboarding');
      } else {
        setErrors(result.errors);
      }
    } catch {
      setGeneralError('No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen title="Crear cuenta" subtitle="Paso 1 de 4. Tus datos se guardan solo en este teléfono.">
      <PixelTextInput
        label="Nombre de usuario"
        value={username}
        onChangeText={setUsername}
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        maxLength={USERNAME_MAX_LENGTH}
      />
      <PixelTextInput
        label="Correo"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
      />
      <PixelTextInput
        label={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
      />

      <PixelButton
        label={showNotice ? `▲ Ocultar el ${PRIVACY_NOTICE_TITLE.toLowerCase()}` : `▼ Leer el ${PRIVACY_NOTICE_TITLE.toLowerCase()}`}
        variant="secondary"
        onPress={() => setShowNotice((v) => !v)}
      />
      {showNotice ? (
        <View style={styles.notice} accessibilityLabel={PRIVACY_NOTICE_TITLE}>
          <Text style={styles.noticeTitle} accessibilityRole="header">
            {PRIVACY_NOTICE_TITLE}
          </Text>
          <Text style={styles.noticeDate}>{PRIVACY_NOTICE_UPDATED_AT}</Text>
          {PRIVACY_NOTICE_SECTIONS.map((section) => (
            <View key={section.heading} style={styles.noticeSection}>
              <Text style={styles.noticeHeading}>{section.heading}</Text>
              <Text style={styles.noticeText}>{section.body}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <PixelCheckbox
        label="He leído y acepto el aviso de privacidad"
        checked={privacyAccepted}
        onToggle={() => setPrivacyAccepted((v) => !v)}
        error={errors.privacy}
      />

      {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
      <PixelButton label="Siguiente" onPress={handleSubmit} loading={submitting} />
      <PixelButton
        label="Ya tengo cuenta: iniciar sesión"
        variant="link"
        onPress={() => router.replace('/login')}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.background,
    borderColor: colors.silver,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.sm,
  },
  noticeTitle: { color: colors.navy, fontSize: 16, fontWeight: 'bold' },
  noticeDate: { color: colors.textMuted, fontSize: 12 },
  noticeSection: { gap: spacing.xs },
  noticeHeading: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  noticeText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
});
