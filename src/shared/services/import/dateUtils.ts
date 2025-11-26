/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - DATE UTILS
 * ============================================================================
 *
 * Utilitaires pour parser les dates des fichiers Excel
 */

/**
 * Parse une date aux formats supportés:
 * - JJ/MM/AAAA (ex: 22/04/2025)
 * - M/D/YY (ex: 4/22/25)
 * - MM/DD/YYYY (ex: 04/22/2025)
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;

  const part1 = parseInt(parts[0]);
  const part2 = parseInt(parts[1]);
  const part3 = parseInt(parts[2]);

  if (isNaN(part1) || isNaN(part2) || isNaN(part3)) return null;

  let day: number, month: number, year: number;

  if (parts[2].length <= 2) {
    // Format M/D/YY (ex: 4/22/25)
    month = part1 - 1;
    day = part2;
    year = part3 < 100 ? 2000 + part3 : part3;
  } else {
    // Format avec année sur 4 chiffres
    if (part1 > 12) {
      // Format JJ/MM/AAAA
      day = part1;
      month = part2 - 1;
      year = part3;
    } else if (part2 > 12) {
      // Format MM/DD/YYYY
      month = part1 - 1;
      day = part2;
      year = part3;
    } else {
      // Ambiguïté: on suppose JJ/MM/AAAA (format français par défaut)
      day = part1;
      month = part2 - 1;
      year = part3;
    }
  }

  // Validation des valeurs
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) return null;

  const date = new Date(year, month, day);

  // Vérifier que la date est valide
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
};

/**
 * Parse une date + heure (JJ/MM/AAAA + HH:MM)
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  const date = parseDate(dateStr);
  if (!date) return null;

  if (!timeStr || !timeStr.trim()) return date;

  const timeParts = timeStr.trim().split(':');
  if (timeParts.length !== 2) return date;

  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);

  if (isNaN(hours) || isNaN(minutes)) return date;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return date;

  date.setHours(hours, minutes, 0, 0);
  return date;
};
