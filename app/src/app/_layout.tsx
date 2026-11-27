import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/database/migrate';
import { restoreSession } from '@/services/authService';
import { useAppDeps } from '@/services/useAppDeps';
import { useSessionStore } from '@/state/useSessionStore';

/** Cabecera de las pantallas que se abren encima de las pestañas. */
const PAGE_HEADER = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.cream,
} as const;

/** Se ejecuta antes de pintar ninguna pantalla: abre SQLite y lo migra. */
async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDbIfNeeded(db);
}

/**
 * Navegación según la sesión (RN-AUTH-04). `Stack.Protected` oculta las rutas
 * cuya guarda es falsa y, si el usuario está en una de ellas, lo lleva a la
 * primera ruta disponible. No hace falta navegar a mano al iniciar o cerrar
 * sesión: basta con cambiar el estado del store.
 */
function RootNavigator() {
  const deps = useAppDeps();
  const status = useSessionStore((s) => s.status);
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    restoreSession(deps)
      .then(setUser)
      .catch(() => setUser(null));
  }, [deps, setUser]);

  if (status === 'LOADING') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} accessibilityLabel="Cargando" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*
        `redirectTo` SIEMPRE con una ruta concreta. Sin él, expo-router 58
        redirige a "/(auth)", que no tiene `index`: esa dirección se resuelve
        como "/" (la pestaña Inicio, protegida), que vuelve a redirigir a
        "/(auth)"… Bucle infinito = pantalla negra al cerrar sesión.
        "/welcome" funciona en los dos casos: si falta el onboarding, el
        layout de (auth) lo lleva a "/onboarding".
      */}
      <Stack.Protected guard={status === 'SIGNED_IN'} redirectTo="/welcome">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ ...PAGE_HEADER, title: 'Ajustes' }} />
        <Stack.Screen name="habits" options={{ ...PAGE_HEADER, title: 'Mis hábitos' }} />
        <Stack.Screen name="habit-form" options={{ ...PAGE_HEADER, title: 'Hábito' }} />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'SIGNED_IN'} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <StatusBar style="dark" />
      <RootNavigator />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
