import { StyleSheet, View } from 'react-native';

interface PixelSpriteProps {
  /** Filas del sprite; cada carácter es un píxel. */
  rows: readonly string[];
  /** Color de cada carácter. Los que no estén (p. ej. '.') son transparentes. */
  palette: Readonly<Record<string, string>>;
  pixelSize: number;
}

/**
 * Dibuja un sprite pixel art con vistas: siempre nítido, sin imágenes que
 * escalar (frontend.md §5). Lo usan el avatar, los corazones y la hoja de mate.
 */
export function PixelSprite({ rows, palette, pixelSize }: PixelSpriteProps) {
  return (
    <View>
      {rows.map((row, y) => (
        <View key={y} style={styles.row}>
          {Array.from(row).map((cell, x) => (
            <View
              key={x}
              style={{ width: pixelSize, height: pixelSize, backgroundColor: palette[cell] ?? 'transparent' }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
