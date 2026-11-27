/**
 * Migración 002 (P-59, 2026-11-27): categoría "Desarrollo personal general",
 * que abarca todas las demás. Va la PRIMERA de la lista (sort_order 0) sin
 * renumerar las otras 16.
 *
 * Nunca se edita la 001: los teléfonos que ya la aplicaron no la repetirían.
 * `INSERT OR IGNORE` hace que ejecutarla dos veces no falle ni duplique.
 */
export const MIGRATION_002_PERSONAL_DEVELOPMENT_CATEGORY = `
INSERT OR IGNORE INTO habit_categories (id, name, sort_order) VALUES
  ('PERSONAL_DEVELOPMENT', 'Desarrollo personal general', 0);
`;
