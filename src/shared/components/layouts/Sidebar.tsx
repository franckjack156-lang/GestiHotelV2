/**
 * Sidebar Component
 *
 * Barre latérale de navigation de l'application
 */

import { NavLink } from 'react-router-dom';
import {
  X,
  Home,
  ClipboardList,
  BarChart,
  Calendar,
  Building2,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Items de navigation
 */
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    icon: Home,
  },
  {
    name: 'Interventions',
    href: '/app/interventions',
    icon: ClipboardList,
  },
  {
    name: 'Analytics',
    href: '/app/analytics',
    icon: BarChart,
  },
  {
    name: 'Planning',
    href: '/app/planning',
    icon: Calendar,
  },
  {
    name: 'Établissements',
    href: '/app/establishments',
    icon: Building2,
  },
  {
    name: 'Utilisateurs',
    href: '/app/users',
    icon: Users,
  },
  {
    name: 'Paramètres',
    href: '/app/settings',
    icon: Settings,
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-200 ease-in-out dark:bg-gray-800 lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-6 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => {
                  // Fermer la sidebar sur mobile après clic
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">GestiHôtel v2.0.0</p>
        </div>
      </aside>
    </>
  );
};
