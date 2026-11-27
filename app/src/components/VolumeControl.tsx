import { StyleSheet, Text, View } from 'react-native';

import { MUSIC_VOLUME_MAX, MUSIC_VOLUME_MIN } from '@/config/audio';
import { border, colors, spacing } from '@/config/theme';

import { PixelButton } from './PixelButton';

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
}

const SEGMENT_SIZE = 14;

/** Volumen en pasos de 0 a 10 con botones − / + y una barra de bloques pixel art. */
export function VolumeControl({ volume, onChange }: VolumeControlProps) {
  const segments = Array.from({ length: MUSIC_VOLUME_MAX }, (_, i) => i < volume);
  return (
    <View style={styles.row}>
      <PixelButton
        label="−"
        variant="secondary"
        accessibilityHint="Baja el volumen de la música"
        disabled={volume <= MUSIC_VOLUME_MIN}
        onPress={() => onChange(volume - 1)}
      />
      <View
        style={styles.bar}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Volumen de la música"
        accessibilityValue={{ min: MUSIC_VOLUME_MIN, max: MUSIC_VOLUME_MAX, now: volume }}
      >
        {segments.map((on, i) => (
          <View key={i} style={[styles.segment, on && styles.segmentOn]} />
        ))}
      </View>
      <Text style={styles.value}>{volume}</Text>
      <PixelButton
        label="+"
        variant="secondary"
        accessibilityHint="Sube el volumen de la música"
        disabled={volume >= MUSIC_VOLUME_MAX}
        onPress={() => onChange(volume + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { flex: 1, flexDirection: 'row', gap: 2, justifyContent: 'center' },
  segment: {
    width: SEGMENT_SIZE,
    height: SEGMENT_SIZE,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.surface,
    borderRadius: border.radius,
  },
  segmentOn: { backgroundColor: colors.leaf },
  value: { color: colors.navy, fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
});
