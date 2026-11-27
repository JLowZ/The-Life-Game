import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { CategoryPicker } from '@/components/CategoryPicker';
import { FormScreen } from '@/components/FormScreen';
import { PixelAvatar } from '@/components/PixelAvatar';
import { PixelButton } from '@/components/PixelButton';
import { PixelTextInput } from '@/components/PixelTextInput';
import {
  GOAL_TEXT_MAX_LENGTH,
  INITIAL_HP_HALF_UNITS,
  INITIAL_LEVEL,
  INITIAL_MATE_LEAVES,
  INITIAL_XP,
  MAX_HP_HALF_UNITS,
  PURPOSE_MAX_LENGTH,
} from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { halfUnitsToHearts } from '@/domain/hp';
import { validateGoal, validatePurpose, type GoalDraft } from '@/domain/onboarding';
import type { HabitCategory, HabitCategoryId } from '@/domain/types';
import { registerUser, signOut } from '@/services/authService';
import { completeOnboarding, listHabitCategories } from '@/services/onboardingService';
import { useAppDeps } from '@/services/useAppDeps';
import { useRegistrationDraftStore } from '@/state/useRegistrationDraftStore';
import { useSessionStore } from '@/state/useSessionStore';

type Step = 'PURPOSE' | 'GOALS' | 'AVATAR';
const PREVIOUS_STEP: Record<Step, Step | null> = { PURPOSE: null, GOALS: 'PURPOSE', AVATAR: 'GOALS' };

/**
 * Onboarding (RN-AUTH-02): propósito → metas con categoría → avatar fijo + perfil inicial.
 *
 * Dos modos:
 * - Registro nuevo (R-34): hay un borrador de la cuenta. Al pulsar "Comenzar"
 *   se crea TODO a la vez. "Atrás" en el propósito vuelve al formulario.
 * - Cuenta antigua sin onboarding (estado NEEDS_ONBOARDING): solo guarda el
 *   propósito y las metas. "Atrás" en el propósito cierra la sesión.
 */
export function OnboardingScreen() {
  const deps = useAppDeps();
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const draft = useRegistrationDraftStore((s) => s.draft);
  const clearDraft = useRegistrationDraftStore((s) => s.clearDraft);
  const isExistingAccount = status === 'NEEDS_ONBOARDING' && user !== null;

  const [step, setStep] = useState<Step>('PURPOSE');
  const [purpose, setPurpose] = useState('');
  const [purposeError, setPurposeError] = useState<string | null>(null);

  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [goals, setGoals] = useState<GoalDraft[]>([]);
  const [goalText, setGoalText] = useState('');
  const [goalCategory, setGoalCategory] = useState<HabitCategoryId | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listHabitCategories(deps.db)
      .then((list) => active && setCategories(list))
      .catch(() => active && setGeneralError('No se pudieron cargar las categorías.'));
    return () => {
      active = false;
    };
  }, [deps.db]);

  /** Atrás (botón en pantalla o del sistema). Devuelve true si lo gestionó aquí. */
  const goBack = useCallback((): boolean => {
    const previous = PREVIOUS_STEP[step];
    if (previous) {
      setStep(previous);
      return true;
    }
    if (isExistingAccount) {
      // Cuenta antigua: salir del onboarding es cerrar sesión (no borra datos).
      signOut(deps)
        .then(() => setUser(null))
        .catch(() => setGeneralError('No se pudo cerrar sesión.'));
      return true;
    }
    if (router.canGoBack()) {
      router.back(); // → formulario de registro, con los datos del borrador
      return true;
    }
    router.replace('/register');
    return true;
  }, [deps, isExistingAccount, setUser, step]);

  // Botón atrás de Android: retrocede un paso en vez de salir de la app.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
      return () => subscription.remove();
    }, [goBack]),
  );

  // Registro nuevo sin borrador (p. ej., la app se recargó): vuelve al paso 1.
  if (!isExistingAccount && draft === null) return <Redirect href="/register" />;

  function goToGoals() {
    const error = validatePurpose(purpose);
    setPurposeError(error);
    if (!error) setStep('GOALS');
  }

  function addGoal() {
    const goalDraft: GoalDraft = { text: goalText, categoryId: goalCategory ?? '' };
    const error = validateGoal(goalDraft);
    setGoalError(error);
    if (error) return;
    setGoals((current) => [...current, { text: goalText.trim(), categoryId: goalDraft.categoryId }]);
    setGoalText('');
    setGoalCategory(null);
  }

  function goToAvatar() {
    if (goals.length === 0) {
      setGoalError('Añade al menos una meta.');
      return;
    }
    setStep('AVATAR');
  }

  async function finish() {
    setSubmitting(true);
    setGeneralError(null);
    try {
      const onboarding = { purpose, goals };
      const result =
        isExistingAccount && user
          ? await completeOnboarding(deps, user.id, onboarding)
          : draft
            ? await registerUser(deps, draft, onboarding)
            : null;
      if (!result) return;
      if (result.ok) {
        // Primero la sesión (→ Inicio) y después el borrador: al revés, la
        // pantalla vería un instante "sin borrador" y redirigiría al paso 1.
        setUser(result.user);
        clearDraft();
        return;
      }
      const errors: Record<string, string | undefined> = result.errors;
      if (errors.username || errors.email || errors.password || errors.privacy) {
        setGeneralError(
          `${errors.username ?? errors.email ?? 'Revisa los datos de la cuenta.'} Vuelve al paso 1 para cambiarlo.`,
        );
      } else {
        setGeneralError(errors.purpose ?? errors.goals ?? 'Revisa los datos.');
        setStep(errors.purpose ? 'PURPOSE' : 'GOALS');
      }
    } catch {
      setGeneralError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const stepLabel = (n: number) => (isExistingAccount ? `Paso ${n - 1} de 3.` : `Paso ${n} de 4.`);
  const backLabel = isExistingAccount ? 'Cerrar sesión' : 'Atrás: datos de la cuenta';

  if (step === 'PURPOSE') {
    return (
      <FormScreen
        title="Tu propósito"
        subtitle={`${stepLabel(2)} ¿Para qué quieres crear hábitos? Lo usaremos para motivarte en los días difíciles.`}
      >
        <PixelTextInput
          label="Propósito personal"
          value={purpose}
          onChangeText={setPurpose}
          error={purposeError ?? undefined}
          placeholder="Ej.: Sentirme con más energía cada día"
          multiline
          maxLength={PURPOSE_MAX_LENGTH}
        />
        {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
        <PixelButton label="Siguiente" onPress={goToGoals} />
        <PixelButton label={backLabel} variant="link" onPress={goBack} />
      </FormScreen>
    );
  }

  if (step === 'GOALS') {
    return (
      <FormScreen
        title="Tus metas"
        subtitle={`${stepLabel(3)} Escribe una o varias metas y elige la categoría de cada una.`}
      >
        {goals.map((goal, index) => (
          <View key={`${goal.text}-${index}`} style={styles.goalRow}>
            <Text style={styles.goalText}>
              {goal.text} · {categoryName(goal.categoryId)}
            </Text>
            <PixelButton
              label="Quitar"
              variant="link"
              onPress={() => setGoals((current) => current.filter((_, i) => i !== index))}
            />
          </View>
        ))}
        <PixelTextInput
          label="Meta"
          value={goalText}
          onChangeText={setGoalText}
          placeholder="Ej.: Leer 12 libros este año"
          maxLength={GOAL_TEXT_MAX_LENGTH}
        />
        <Text style={styles.label}>Categoría</Text>
        <CategoryPicker categories={categories} selected={goalCategory} onSelect={setGoalCategory} />
        {goalError ? <Text style={styles.error}>{goalError}</Text> : null}
        {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
        <PixelButton label="Añadir meta" variant="secondary" onPress={addGoal} />
        <PixelButton label="Siguiente" onPress={goToAvatar} />
        <PixelButton label="Atrás" variant="link" onPress={goBack} />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Tu avatar"
      subtitle={`${stepLabel(4)} Así empiezas tu aventura. Más adelante podrás personalizar tu avatar.`}
    >
      <PixelAvatar pixelSize={10} />
      <View style={styles.stats}>
        <Text style={styles.stat}>
          ♥ HP: {halfUnitsToHearts(INITIAL_HP_HALF_UNITS)} de {halfUnitsToHearts(MAX_HP_HALF_UNITS)}
        </Text>
        <Text style={styles.stat}>Nivel: {INITIAL_LEVEL}</Text>
        <Text style={styles.stat}>XP: {INITIAL_XP}</Text>
        <Text style={styles.stat}>Hojas de mate: {INITIAL_MATE_LEAVES}</Text>
      </View>
      {generalError ? <Text style={styles.error}>{generalError}</Text> : null}
      <PixelButton label="Comenzar" onPress={finish} loading={submitting} />
      <PixelButton label="Atrás" variant="link" onPress={goBack} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: border.width,
    borderColor: colors.silver,
    paddingLeft: spacing.sm,
  },
  goalText: { flex: 1, color: colors.text, fontSize: 14 },
  label: { color: colors.navy, fontSize: 14, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 14 },
  stats: { gap: spacing.xs, alignSelf: 'center' },
  stat: { color: colors.navy, fontSize: 16, fontWeight: 'bold' },
});
