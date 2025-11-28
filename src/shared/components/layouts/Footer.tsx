/**
 * Footer Component
 *
 * Footer de l'application
 */

import { Link } from 'react-router-dom';
import { Book, HelpCircle, Ticket } from 'lucide-react';
import { SupportDialog } from '@/shared/components/support';

export const Footer = () => {
  return (
    <footer className="border-t bg-white px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>© 2025 GestiHôtel. Tous droits réservés.</p>
        <div className="flex items-center gap-4">
          <Link
            to="/app/support"
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Ticket className="h-4 w-4" />
            Mes demandes
          </Link>
          <SupportDialog>
            <button className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <HelpCircle className="h-4 w-4" />
              Support
            </button>
          </SupportDialog>
          <Link
            to="/app/documentation"
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Book className="h-4 w-4" />
            Documentation
          </Link>
        </div>
      </div>
    </footer>
  );
};
