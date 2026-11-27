import { View } from 'react-native';

import { colors } from '@/config/theme';

import { PixelSprite } from './PixelSprite';

/**
 * Avatar FIJO de la Entrega 1 (C-20, P-38): sprite de 12×12 píxeles.
 * La creación y personalización del avatar llegan después de la entrega.
 */
const SPRITE = [
  '....HHHH....',
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..SSESSESS..',
  '..SSSSSSSS..',
  '...SSMMSS...',
  '....SSSS....',
  '..GGGGGGGG..',
  '.SGGGGGGGGS.',
  '.S.GGGGGG.S.',
  '...NN..NN...',
] as const;

const PALETTE = {
  H: colors.gourd,
  S: colors.skin,
  E: colors.navy,
  M: colors.heart,
  G: colors.leaf,
  N: colors.navy,
};

interface PixelAvatarProps {
  /** Tamaño en dp de cada píxel del sprite. */
  pixelSize?: number;
}

export function PixelAvatar({ pixelSize = 6 }: PixelAvatarProps) {
  return (
    <View accessibilityRole="image" accessibilityLabel="Tu avatar" style={{ alignSelf: 'center' }}>
      <PixelSprite rows={SPRITE} palette={PALETTE} pixelSize={pixelSize} />
    </View>
  );
}
