import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/config/theme';
import { formatHpLabel, getHeartStates } from '@/domain/hp';
import { getLevelProgress } from '@/domain/level';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useSessionStore } from '@/state/useSessionStore';

import { Hud } from './Hud';

interface HudHeaderProps {
  showSettings?: boolean;
}

/**
 * Componente CONTENEDOR (excepción explícita de frontend.md §3): lee los stores,
 * calcula los valores derivados con el dominio y se los pasa al `Hud`.
 * Se usa como cabecera de las cuatro pestañas: el HUD siempre visible (RN-NAV-01).
 * Se actualiza solo en cuanto cambia el store (RN-NAV-03).
 */
export function HudHeader({ showSettings = false }: HudHeaderProps) {
  const insets = useSafeAreaInsets();
  const username = useSessionStore((s) => s.user?.username ?? '');
  const profile = usePlayerStore((s) => s.profile);

  if (!profile) {
    return <View style={{ height: insets.top, backgroundColor: colors.navy }} />;
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.navy }}>
      <Hud
        username={username}
        hearts={getHeartStates(profile.hpHalfUnits)}
        hpLabel={formatHpLabel(profile.hpHalfUnits)}
        levelProgress={getLevelProgress(profile.xpTotal)}
        streak={profile.perfectStreak}
        mateLeaves={profile.mateLeavesBalance}
        onOpenSettings={showSettings ? () => router.push('/settings') : undefined}
      />
    </View>
  );
}
