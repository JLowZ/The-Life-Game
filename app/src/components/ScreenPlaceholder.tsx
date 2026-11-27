import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';

interface ScreenPlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

/** Marco provisional de las pestañas hasta que cada fase las construya. */
export function ScreenPlaceholder({ title, description, children }: ScreenPlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    borderRadius: border.radius,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: 'bold',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
});
