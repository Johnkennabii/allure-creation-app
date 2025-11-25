/**
 * Utilitaires pour la manipulation de dates
 */

/**
 * Ajoute un nombre de jours à une date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calcule le nombre de jours entre deux dates (inclusif)
 * Si start === end, retourne 1 jour
 */
export const calculateRentalDays = (start: Date, end: Date): number => {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Minimum 1 jour même si start === end
  return Math.max(1, diffDays + 1);
};

/**
 * Vérifie si une date est dans une plage donnée (inclusif)
 */
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

/**
 * Calcule le chevauchement en jours entre deux plages de dates
 */
export const getDateRangeOverlap = (
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): number => {
  const start = new Date(Math.max(range1Start.getTime(), range2Start.getTime()));
  const end = new Date(Math.min(range1End.getTime(), range2End.getTime()));

  if (start > end) return 0;
  return calculateRentalDays(start, end);
};

/**
 * Convertit une string en date ISO sûre (ou null si invalide)
 */
export const toISOStringSafe = (value: string): string | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Vérifie si une date est "nouvelle" (créée il y a moins de N millisecondes)
 */
export const isDateRecent = (dateString?: string | null, thresholdMs: number = 3 * 24 * 60 * 60 * 1000): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const now = Date.now();
  const diff = now - date.getTime();
  return diff >= 0 && diff <= thresholdMs;
};
