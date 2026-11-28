import type { HabitCategoryId } from '@/domain/types';

import { formatQuantity } from './habitTexts';

/** Textos de desafíos y misiones secundarias. Contenido propio (CLAUDE.md §9.10). */

/** Acción concreta y medible del desafío (RN-DES-03): "Leer: 10 páginas". */
export function challengeTitle(habitName: string, quantity: number, unit: string): string {
  return `${habitName}: ${formatQuantity(quantity, unit)}`;
}

/** Botón de autodeclaración (RN-DES-12): "Lo hice: 10 páginas". */
export function selfDeclarationLabel(quantity: number | null, unit: string | null): string {
  return quantity !== null && unit !== null ? `Lo hice: ${formatQuantity(quantity, unit)}` : 'Lo hice';
}

/** "2 d 5 h", "5 h 12 min", "8 min", "menos de 1 min" (RN-DES-16). */
export function formatTimeLeft(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return 'menos de 1 min';
}

export const MISSION_CONGRATULATION =
  '¡Qué bien que quieras ir más allá de lo programado! Elige un área y una misión medible para hoy.';

/**
 * Sugerencia por categoría cuando no hay hábitos ni metas de esa categoría
 * (RN-MIS-04). Siempre medible y editable por el usuario.
 */
export const DEFAULT_MISSION_SUGGESTIONS: Record<HabitCategoryId, { description: string; targetQuantity: number; unit: string }> = {
  PERSONAL_DEVELOPMENT: { description: 'Escribir tres cosas que aprendiste hoy', targetQuantity: 3, unit: 'ideas' },
  EXERCISE: { description: 'Caminar a paso ligero', targetQuantity: 20, unit: 'minutos' },
  STUDY: { description: 'Repasar apuntes sin distracciones', targetQuantity: 25, unit: 'minutos' },
  READING: { description: 'Leer un libro que te guste', targetQuantity: 10, unit: 'páginas' },
  ART: { description: 'Dibujar o crear algo libre', targetQuantity: 15, unit: 'minutos' },
  MINDFULNESS: { description: 'Respirar con calma y atención', targetQuantity: 5, unit: 'minutos' },
  HEALTH: { description: 'Beber agua a lo largo del día', targetQuantity: 2, unit: 'vasos' },
  SELF_CARE: { description: 'Dedicarte un momento solo para ti', targetQuantity: 15, unit: 'minutos' },
  HOME: { description: 'Ordenar un espacio de tu casa', targetQuantity: 15, unit: 'minutos' },
  FINANCE: { description: 'Anotar tus gastos del día', targetQuantity: 1, unit: 'vez' },
  SOCIAL: { description: 'Escribir a alguien que aprecias', targetQuantity: 1, unit: 'mensaje' },
  WORK: { description: 'Avanzar en una tarea pendiente', targetQuantity: 25, unit: 'minutos' },
  SPIRITUALITY: { description: 'Reflexionar en silencio', targetQuantity: 10, unit: 'minutos' },
  DIGITAL_WELLBEING: { description: 'Pasar tiempo sin pantallas', targetQuantity: 30, unit: 'minutos' },
  HOBBIES: { description: 'Practicar tu pasatiempo favorito', targetQuantity: 20, unit: 'minutos' },
  COMMUNITY: { description: 'Ayudar a alguien de tu entorno', targetQuantity: 1, unit: 'vez' },
  OTHER: { description: 'Dar un pequeño paso hacia algo que te importa', targetQuantity: 1, unit: 'vez' },
};
