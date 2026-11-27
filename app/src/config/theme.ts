/**
 * Tema pixel art provisional, tomado del logo (assets/Logo.png): marco azul
 * marino, letras crema y dorado, mate marrón, hojas verdes y vapor azul.
 * Es la base de la Fase 3; el acabado visual llega después (C-22, P-38).
 */
export const colors = {
  navy: '#1F2A44',
  navyLight: '#2E3D5F',
  cream: '#F3E3BE',
  gold: '#D9A441',
  gourd: '#8A4B22',
  leaf: '#4E8A3A',
  leafLight: '#7DB45F',
  steam: '#8FB3D0',
  silver: '#B9C4CC',
  heart: '#C8413B',
  background: '#FBF6EA',
  surface: '#FFFFFF',
  text: '#1F2A44',
  textMuted: '#5A6478',
  skin: '#E9B98F',
  error: '#B0302A',
} as const;

/** Rejilla de píxel: todos los espaciados son múltiplos de 4 dp. */
export const GRID = 4;
export const spacing = {
  xs: GRID,
  sm: GRID * 2,
  md: GRID * 4,
  lg: GRID * 6,
  xl: GRID * 8,
} as const;

/** Bordes rectos y gruesos, al estilo pixel art. */
export const border = {
  width: 3,
  radius: 0,
} as const;

/** Zona táctil mínima (accesibilidad, frontend.md §9). */
export const MIN_TOUCH_SIZE = 48;
