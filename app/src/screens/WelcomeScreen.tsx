import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelButton } from '@/components/PixelButton';
import { colors, spacing } from '@/config/theme';

const LOGO_SIZE = 220;

/** RN-AUTH-01: primera apertura → registro o inicio de sesión. */
export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo de The Life Game"
        />
        <Text style={styles.tagline}>
          La constancia no significa avanzar siempre con la misma intensidad. Incluso un pequeño
          escalón representa progreso.
        </Text>
        <View style={styles.actions}>
          <PixelButton label="Crear cuenta" onPress={() => router.push('/register')} />
          <PixelButton label="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, alignSelf: 'center' },
  tagline: { color: colors.navy, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  actions: { gap: spacing.md },
});
