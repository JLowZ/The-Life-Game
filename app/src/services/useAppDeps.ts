import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

import type { AppDeps } from './deps';
import { expoCryptoProvider, secureSessionStorage, systemClock } from './platformDeps';

/** Dependencias reales para las pantallas: la base de datos abierta por SQLiteProvider. */
export function useAppDeps(): AppDeps {
  const db = useSQLiteContext();
  return useMemo(
    () => ({ db, crypto: expoCryptoProvider, session: secureSessionStorage, now: systemClock }),
    [db],
  );
}
