/**
 * ============================================================================
 * KEYBOARD SHORTCUTS DIALOG
 * ============================================================================
 *
 * Dialog affichant tous les raccourcis clavier disponibles
 */

import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  {
    keys: ['Ctrl', 'K'],
    description: 'Recherche globale',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'B'],
    description: 'Basculer la sidebar',
    category: 'Navigation',
  },
  {
    keys: ['G', 'D'],
    description: 'Aller au dashboard',
    category: 'Navigation',
  },
  {
    keys: ['G', 'I'],
    description: 'Aller aux interventions',
    category: 'Navigation',
  },

  // Actions
  {
    keys: ['C'],
    description: 'Créer une intervention',
    category: 'Actions',
  },
  {
    keys: ['T'],
    description: 'Basculer le thème',
    category: 'Actions',
  },

  // Général
  {
    keys: ['?'],
    description: 'Afficher les raccourcis',
    category: 'Général',
  },
  {
    keys: ['Esc'],
    description: 'Fermer les dialogs',
    category: 'Général',
  },
];

const KeyBadge = ({ keyName }: { keyName: string }) => (
  <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-gray-300 bg-gray-100 px-2 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
    {keyName}
  </kbd>
);

export const KeyboardShortcutsDialog = () => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Raccourcis clavier (?)">
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raccourcis Clavier</DialogTitle>
          <DialogDescription>Gagnez du temps avec ces raccourcis clavier utiles</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <KeyBadge keyName={key} />
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Astuce</strong> : Appuyez sur <KeyBadge keyName="?" /> à tout moment pour
            afficher cette aide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
