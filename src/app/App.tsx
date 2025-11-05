/**
 * App Component
 * 
 * Composant racine de l'application avec routing et providers
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export const App = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <RouterProvider router={router} />
    </div>
  );
};
