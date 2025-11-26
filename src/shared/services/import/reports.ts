/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * ============================================================================
 * IMPORT SERVICE - REPORTS
 * ============================================================================
 *
 * Génération de rapports d'erreurs pour l'import
 */

import type { ImportError } from './types';

/**
 * Génère un rapport d'erreurs lisible
 */
export const generateErrorReport = (errors: ImportError[]): string => {
  if (errors.length === 0) {
    return 'Aucune erreur';
  }

  const lines = ["RAPPORT D'ERREURS D'IMPORT", '='.repeat(50), ''];

  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row]) {
        acc[error.row] = [];
      }
      acc[error.row].push(error);
      return acc;
    },
    {} as Record<number, ImportError[]>
  );

  Object.entries(errorsByRow).forEach(([row, rowErrors]) => {
    lines.push(`Ligne ${row}:`);
    rowErrors.forEach(error => {
      if (error.field) {
        lines.push(`  - Champ "${error.field}": ${error.message}`);
        if (error.value !== undefined) {
          lines.push(`    Valeur reçue: "${error.value}"`);
        }
      } else {
        lines.push(`  - ${error.message}`);
      }
    });
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Télécharge un rapport d'erreurs en fichier texte
 */
export const downloadErrorReport = (errors: ImportError[], filename = 'erreurs-import.txt') => {
  const report = generateErrorReport(errors);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
