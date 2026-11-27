import { Stack } from 'expo-router';

import { useSessionStore } from '@/state/useSessionStore';

/**
 * Sin sesión: bienvenida, inicio de sesión y el asistente de registro
 * (formulario → onboarding, R-34). Cuenta antigua sin onboarding: solo el
 * onboarding. Destinos explícitos: ver el comentario del layout raíz.
 */
export default function AuthLayout() {
  const status = useSessionStore((s) => s.status);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'SIGNED_OUT'} redirectTo="/onboarding">
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected
        guard={status === 'SIGNED_OUT' || status === 'NEEDS_ONBOARDING'}
        redirectTo="/welcome"
      >
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
