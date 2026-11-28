import type { DayClassification, GameDate, MoodValue } from '@/domain/types';

/**
 * Textos del cierre de jornada y del Mapa (RN-MSG-03, RN-MAP-06, RN-MAP-07,
 * P-32, P-34). Contenido propio (C-33, CLAUDE.md §9.10). Tono empático en los
 * días difíciles y nunca culpabilizador (RN-MSG-04). Nunca "castigo".
 */

/** RN-MAP-07: la clasificación nunca se comunica solo con color: lleva icono y texto. */
export const CLASSIFICATION_LABELS: Record<DayClassification, { label: string; icon: string }> = {
  PERFECT: { label: 'Perfecto', icon: '★' },
  VERY_GOOD: { label: 'Muy bueno', icon: '▲' },
  PARTIAL: { label: 'Parcial', icon: '◆' },
  CRITICAL: { label: 'Crítico', icon: '▼' },
  NO_ACTIVITY: { label: 'Sin actividades programadas', icon: '·' },
  PAUSED: { label: 'En pausa', icon: 'Ⅱ' },
};

export const MOOD_LABELS: Record<MoodValue, string> = {
  VERY_HAPPY: 'Muy feliz',
  GOOD: 'Bien',
  NEUTRAL: 'Normal',
  DOWN: 'Decaído',
  VERY_BAD: 'Muy mal',
};

/**
 * Mensajes de cierre según el rendimiento (P-34). `{purpose}` se sustituye por
 * el propósito del usuario ("la meta"). El id que se guarda es
 * `close.<CLASIFICACIÓN>.<índice>`, así el resumen de un día no cambia (RN-MAP-05).
 */
export const CLOSE_MESSAGES: Record<DayClassification, readonly string[]> = {
  PERFECT: [
    '¡Jornada perfecta! Cumpliste todo lo que te propusiste. Así se construye «{purpose}».',
    'Todo hecho. Hoy subiste un escalón entero hacia «{purpose}».',
    '¡Pleno! Disfruta este día: es la prueba de que puedes.',
    'Perfecto. La constancia de hoy es la base de mañana.',
  ],
  VERY_GOOD: [
    '¡Muy buen día! Casi todo cumplido: «{purpose}» está cada vez más cerca.',
    'Gran jornada. Lo que faltó no borra todo lo que lograste.',
    'Muy bien. Mañana tienes otra oportunidad para el pleno.',
    'Un día sólido. Sigue a este ritmo.',
  ],
  PARTIAL: [
    'Avanzaste, y eso cuenta. Incluso un pequeño escalón es progreso hacia «{purpose}».',
    'Hoy hiciste una parte. La constancia no es avanzar siempre con la misma intensidad.',
    'Un paso es un paso. Mañana puedes darle otro empujón.',
    'Día a medias, pero no en blanco. Eso también suma.',
  ],
  CRITICAL: [
    'Hoy costó, y está bien: no todos los días son iguales. Mañana empieza de nuevo.',
    'Un día difícil no define tu camino hacia «{purpose}». Descansa y vuelve con calma.',
    'Lo importante es no soltar el hilo. Tus desafíos te ayudan a recuperar el ritmo.',
    'Sé amable contigo. Mañana elige una sola cosa y empieza por ahí.',
  ],
  NO_ACTIVITY: [
    'Hoy no tenías actividades programadas. Puedes planear tus próximos días en el Mapa.',
    'Jornada libre. Cuando quieras, asigna hábitos a tus días en el Mapa.',
  ],
  PAUSED: [
    'Jornada en pausa: recupera tus vidas con los desafíos y vuelve a tu ritmo.',
    'Tu progreso está en pausa, no perdido. Cada desafío de recuperación te devuelve medio corazón.',
  ],
};

/** Elección determinista: la misma jornada siempre recibe el mismo mensaje. */
export function pickCloseMessageId(classification: DayClassification, gameDate: GameDate): string {
  const options = CLOSE_MESSAGES[classification];
  const seed = gameDate.split('-').reduce((sum, part) => sum + Number(part), 0);
  return `close.${classification}.${seed % options.length}`;
}

/** Texto del mensaje guardado; si no hay propósito, usa una expresión genérica. */
export function renderCloseMessage(messageId: string | null, purpose: string | null): string | null {
  if (!messageId) return null;
  const [, classification, index] = messageId.split('.');
  const options = CLOSE_MESSAGES[classification as DayClassification];
  const template = options?.[Number(index)];
  if (!template) return null;
  return template.replace('{purpose}', purpose?.trim() || 'tu meta');
}

export function formatPercent(percent: number | null): string {
  if (percent === null) return '—';
  // Solo para mostrar: un decimal como máximo, con coma ("84,6 %").
  return `${(Math.floor(percent * 10) / 10).toString().replace('.', ',')} %`;
}

const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export function formatMonthTitle(year: number, monthIndex: number): string {
  const name = MONTHS_LONG[monthIndex] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}
