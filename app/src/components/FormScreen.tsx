import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { border, colors, spacing } from '@/config/theme';

interface FormScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Marco de las pantallas de autenticación: área segura, teclado y desplazamiento. */
export function FormScreen({ title, subtitle, children }: FormScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    borderRadius: border.radius,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.navy, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
});
