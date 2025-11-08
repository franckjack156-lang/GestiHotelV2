/**
 * ============================================================================
 * SETTINGS PAGE
 * ============================================================================
 *
 * Page principale des paramètres avec sous-navigation
 *
 * Destination: src/pages/Settings.tsx
 */

import { NavLink, Outlet } from 'react-router-dom';
import { Card } from '@/shared/components/ui/card';
import { List, Building2, Users, Bell, Shield, Palette } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const SettingsPage = () => {
  const menuItems = [
    {
      name: 'Listes de référence',
      href: '/app/settings/reference-lists',
      icon: List,
      description: 'Types, priorités, catégories',
    },
    {
      name: 'Établissement',
      href: '/app/settings/establishment',
      icon: Building2,
      description: 'Informations générales',
    },
    {
      name: 'Utilisateurs',
      href: '/app/settings/users',
      icon: Users,
      description: 'Gestion des accès',
    },
    {
      name: 'Notifications',
      href: '/app/settings/notifications',
      icon: Bell,
      description: 'Préférences de notification',
    },
    {
      name: 'Sécurité',
      href: '/app/settings/security',
      icon: Shield,
      description: 'Mot de passe et 2FA',
    },
    {
      name: 'Apparence',
      href: '/app/settings/appearance',
      icon: Palette,
      description: 'Thème et personnalisation',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configurez votre établissement et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu latéral */}
        <Card className="lg:col-span-1 p-4 h-fit">
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </Card>

        {/* Contenu */}
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
