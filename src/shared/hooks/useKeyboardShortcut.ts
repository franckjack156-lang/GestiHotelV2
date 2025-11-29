/**
 * ============================================================================
 * USE KEYBOARD SHORTCUT HOOK
 * ============================================================================
 *
 * Hook pour gérer les raccourcis clavier
 * - Support Ctrl/Cmd multi-plateforme
 * - Combinaisons complexes (Ctrl+Shift+K)
 * - Désactivation automatique dans les inputs
 */

import { useEffect } from 'react';

export interface KeyboardShortcutOptions {
  /**
   * Touche principale (ex: 'k', 'Enter', 'Escape')
   */
  key: string;

  /**
   * Modificateurs
   */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;

  /**
   * Activer dans les inputs/textareas
   */
  enableInInputs?: boolean;

  /**
   * Description du raccourci (pour l'aide)
   */
  description?: string;
}

/**
 * Hook pour gérer un raccourci clavier
 */
export const useKeyboardShortcut = (
  options: KeyboardShortcutOptions,
  callback: () => void,
  deps: unknown[] = []
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Vérifier si on est dans un input/textarea
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInput && !options.enableInInputs) {
        return;
      }

      // Vérifier la touche
      const keyMatch =
        event.key.toLowerCase() === options.key.toLowerCase() ||
        event.code.toLowerCase() === options.key.toLowerCase();

      if (!keyMatch) return;

      // Vérifier les modificateurs
      const ctrlMatch = options.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
      const shiftMatch = options.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = options.alt ? event.altKey : !event.altKey;
      const metaMatch = options.meta ? event.metaKey : true;

      if (ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.key, options.ctrl, options.shift, options.alt, options.meta, ...deps]);
};
