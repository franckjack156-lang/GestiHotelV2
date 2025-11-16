/**
 * AuthLayout Component
 *
 * Layout pour les pages d'authentification (Login, Register, etc.)
 */

import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Colonne gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 text-white">
            <Building2 className="h-10 w-10" />
            <span className="text-3xl font-bold">GestiHôtel</span>
          </div>

          {/* Description */}
          <div className="mt-16 text-white">
            <h1 className="text-4xl font-bold leading-tight">
              Gérez vos interventions
              <br />
              en toute simplicité
            </h1>
            <p className="mt-6 text-lg text-indigo-100">
              La solution complète pour la gestion des interventions techniques dans le secteur
              hôtelier.
            </p>

            {/* Features */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  ✓
                </div>
                <span className="text-indigo-100">Multi-établissements</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  ✓
                </div>
                <span className="text-indigo-100">Suivi en temps réel</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  ✓
                </div>
                <span className="text-indigo-100">Analytics avancés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-indigo-200">© 2025 GestiHôtel. Tous droits réservés.</div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="flex flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GestiHôtel</span>
          </div>

          {/* Contenu de la page */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};
