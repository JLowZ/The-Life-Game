import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View, type ColorValue } from 'react-native';

import { HudHeader } from '@/components/HudHeader';
import { colors } from '@/config/theme';
import { refreshPlayerProfile } from '@/services/profileService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

const ICON_SIZE = 14;

/** Icono provisional: un bloque de píxel. El arte definitivo llega con P-38. */
function PixelIcon({ color }: { color: ColorValue }) {
  return <View style={{ width: ICON_SIZE, height: ICON_SIZE, backgroundColor: color }} />;
}

/** Pestañas con el HUD como cabecera, siempre visible (RN-NAV-01), con el engranaje de Ajustes en todas. */
export default function TabsLayout() {
  const { db } = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);

  // Carga el HUD al entrar con una cuenta.
  useEffect(() => {
    if (userId) refreshPlayerProfile(db, userId).catch(() => undefined);
  }, [db, userId]);

  return (
    <Tabs
      screenOptions={{
        header: () => <HudHeader showSettings />,
        tabBarStyle: { backgroundColor: colors.navy, borderTopColor: colors.gold },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.silver,
        tabBarIcon: ({ color }) => <PixelIcon color={color} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="shop" options={{ title: 'Tienda' }} />
      <Tabs.Screen name="challenges" options={{ title: 'Desafíos' }} />
    </Tabs>
  );
}
