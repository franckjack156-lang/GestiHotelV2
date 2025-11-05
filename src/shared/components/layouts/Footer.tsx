/**
 * Footer Component
 * 
 * Footer de l'application
 */

export const Footer = () => {
  return (
    <footer className="border-t bg-white px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>© 2025 GestiHôtel. Tous droits réservés.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Support
          </a>
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
};
