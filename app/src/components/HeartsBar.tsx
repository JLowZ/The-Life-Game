import { StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';
import type { HeartState } from '@/domain/hp';

import { PixelSprite } from './PixelSprite';

/**
 * Corazón de 7×6 píxeles. El medio corazón pinta la mitad izquierda (columnas
 * 0-3) en rojo y el resto vacío. Lleno, medio y vacío se distinguen también
 * por la forma, no solo por el color (frontend.md §9).
 */
const HEART_ROWS = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'] as const;
const HALF_SPLIT_COLUMN = 3;

function heartRows(state: HeartState): string[] {
  return HEART_ROWS.map((row) =>
    Array.from(row)
      .map((cell, x) => {
        if (cell !== '#') return '.';
        if (state === 'FULL') return 'F';
        if (state === 'HALF' && x <= HALF_SPLIT_COLUMN) return 'F';
        return 'E';
      })
      .join(''),
  );
}

const PALETTE = { F: colors.heart, E: colors.silver };

interface HeartsBarProps {
  hearts: HeartState[];
  /** Texto accesible, p. ej. "HP 7,5 de 10" (calculado por el dominio). */
  label: string;
  pixelSize?: number;
}

/** Diez corazones del HUD (RN-NAV-02). Recibe los estados ya calculados. */
export function HeartsBar({ hearts, label, pixelSize = 3 }: HeartsBarProps) {
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={label}>
      {hearts.map((state, index) => (
        <PixelSprite key={index} rows={heartRows(state)} palette={PALETTE} pixelSize={pixelSize} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, flexWrap: 'wrap' },
});
