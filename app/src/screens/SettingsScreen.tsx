import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoalEditor } from '@/components/GoalEditor';
import { PixelButton } from '@/components/PixelButton';
import { PixelTextInput } from '@/components/PixelTextInput';
import { VolumeControl } from '@/components/VolumeControl';
import { MUSIC_VOLUME_DEFAULT } from '@/config/audio';
import { USERNAME_MAX_LENGTH } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import type { HabitCategory, HabitCategoryId, UserGoal } from '@/domain/types';
import { signOut } from '@/services/authService';
import { listHabitCategories } from '@/services/onboardingService';
import { getMusicVolume, setMusicVolume } from '@/services/preferencesService';
import { clearChallenges } from '@/services/challengeService';
import { clearToday } from '@/services/occurrenceService';
import { clearPlayerProfile } from '@/services/profileService';
import { changeUsername, loadUserGoals, updateGoal } from '@/services/settingsService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Ajustes (se abre con el engranaje de Inicio): usuario, metas, música y cerrar sesión. */
export function SettingsScreen() {
  const deps = useAppDeps();
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);

  const [username, setUsername] = useState(user?.username ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [volume, setVolume] = useState(MUSIC_VOLUME_DEFAULT);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([loadUserGoals(deps.db, userId), listHabitCategories(deps.db), getMusicVolume()])
      .then(([loadedGoals, loadedCategories, loadedVolume]) => {
        if (!active) return;
        setGoals(loadedGoals);
        setCategories(loadedCategories);
        setVolume(loadedVolume);
      })
      .catch(() => active && setLoadError('No se pudieron cargar tus ajustes.'));
    return () => {
      active = false;
    };
  }, [deps.db, userId]);

  if (!user) return null;
  const currentUser = user;

  async function saveUsername() {
    setSavingUsername(true);
    setUsernameSaved(false);
    try {
      const result = await changeUsername(deps, currentUser.id, username);
      if (result.ok) {
        setUsernameError(null);
        setUsername(result.value);
        setUser({ ...currentUser, username: result.value }); // el HUD se actualiza al instante
        setUsernameSaved(true);
      } else {
        setUsernameError(result.error);
      }
    } catch {
      setUsernameError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSavingUsername(false);
    }
  }

  async function saveGoal(goalId: string, text: string, categoryId: HabitCategoryId): Promise<string | null> {
    try {
      const result = await updateGoal(deps, currentUser.id, goalId, { text, categoryId });
      if (!result.ok) return result.error;
      setGoals(result.value);
      return null;
    } catch {
      return 'No se pudo guardar. Inténtalo de nuevo.';
    }
  }

  function changeVolume(next: number) {
    setMusicVolume(next)
      .then(setVolume)
      .catch(() => setLoadError('No se pudo guardar el volumen.'));
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(deps); // RN-AUTH-08: no borra datos
      clearPlayerProfile();
      clearToday();
      clearChallenges();
      setUser(null);
    } catch {
      setLoadError('No se pudo cerrar sesión. Inténtalo de nuevo.');
      setSigningOut(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      <Section title="Nombre de usuario">
        <PixelTextInput
          label="Nombre de usuario"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setUsernameSaved(false);
          }}
          error={usernameError ?? undefined}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX_LENGTH}
        />
        {usernameSaved ? <Text style={styles.ok}>Nombre de usuario guardado.</Text> : null}
        <PixelButton
          label="Guardar nombre"
          onPress={saveUsername}
          loading={savingUsername}
          disabled={username.trim() === currentUser.username}
        />
      </Section>

      <Section title="Mis metas">
        {goals.length === 0 ? <Text style={styles.muted}>No tienes metas guardadas.</Text> : null}
        {goals.map((goal) => (
          <GoalEditor
            key={goal.id}
            goal={goal}
            categories={categories}
            onSave={(text, categoryId) => saveGoal(goal.id, text, categoryId)}
          />
        ))}
      </Section>

      <Section title="Música">
        <VolumeControl volume={volume} onChange={changeVolume} />
        <Text style={styles.muted}>La música llegará pronto. Tu volumen ya queda guardado.</Text>
      </Section>

      <Section title="Cuenta">
        <Text style={styles.muted}>Cerrar sesión no borra tus datos de este teléfono.</Text>
        <PixelButton label="Cerrar sesión" variant="secondary" onPress={handleSignOut} loading={signingOut} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    borderRadius: border.radius,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: 'bold' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  ok: { color: colors.leaf, fontSize: 13, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
});
