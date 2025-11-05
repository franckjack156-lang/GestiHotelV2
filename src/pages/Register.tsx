/**
 * Register Page
 * 
 * Page d'inscription de l'application
 */

import { Link } from 'react-router-dom';

export const RegisterPage = () => {
  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inscription</h1>
      <p className="text-gray-600 dark:text-gray-400">
        La page d'inscription sera implémentée dans une future version.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Pour l'instant, veuillez contacter un administrateur pour créer votre compte.
      </p>
      <Link
        to="/login"
        className="inline-block text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        Retour à la connexion
      </Link>
    </div>
  );
};
