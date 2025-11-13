/**
 * Sidebar Component - VERSION SIMPLIFIÉE
 *
 * Menu de navigation latéral
 * Mode réduit = icônes seulement (64px) | Mode normal = icônes + labels (256px)
 */

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  DoorClosed,
  Calendar,
  Bell,
  Settings,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMemo } from 'react';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlag';
import type { EstablishmentFeatures } from '@/shared/types/establishment.types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

interface NavItem {
  translationKey: string; // Clé de traduction (ex: "dashboard")
  href: string;
  icon: React.ElementType;
  requiredFeature?: keyof EstablishmentFeatures;
  alwaysVisible?: boolean;
}

export const Sidebar = ({ isOpen, isCollapsed = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  // Récupérer les features actives
  const features = useFeatureFlags([
    'interventions',
    'rooms',
    'planning',
    'notifications',
  ]);

  /**
   * Navigation items
   */
  const allNavItems: NavItem[] = [
    {
      translationKey: 'dashboard',
      href: '/app/dashboard',
      icon: LayoutDashboard,
      alwaysVisible: true,
    },
    {
      translationKey: 'interventions',
      href: '/app/interventions',
      icon: ClipboardList,
      requiredFeature: 'interventions',
    },
    {
      translationKey: 'rooms',
      href: '/app/rooms',
      icon: DoorClosed,
      requiredFeature: 'rooms',
    },
    {
      translationKey: 'planning',
      href: '/app/planning',
      icon: Calendar,
      requiredFeature: 'planning',
    },
    {
      translationKey: 'notifications',
      href: '/app/notifications',
      icon: Bell,
      requiredFeature: 'notifications',
    },
    {
      translationKey: 'settings',
      href: '/app/settings',
      icon: Settings,
      alwaysVisible: true,
    },
  ];

  /**
   * Filtrer selon features activées
   */
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (item.alwaysVisible) return true;
      if (!item.requiredFeature) return true;
      return features[item.requiredFeature] === true;
    });
  }, [features]);

  /**
   * Vérifier si un lien est actif
   */
  const isActive = (href: string) => {
    if (href === '/app/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full border-r bg-white transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 lg:sticky lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo mobile */}
          <div className="flex h-16 items-center gap-2 border-b px-6 lg:hidden dark:border-gray-700">
            <Building2 className="h-6 w-6" style={{ color: 'hsl(var(--theme-primary))' }} />
            {!isCollapsed && (
              <span className="font-bold text-gray-900 dark:text-white">GestiHôtel</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    isCollapsed ? 'justify-center' : 'gap-3'
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: 'hsl(var(--theme-primary-light) / 0.15)',
                          color: 'hsl(var(--theme-primary-dark))',
                        }
                      : undefined
                  }
                  title={isCollapsed ? t(`nav.${item.translationKey}`) : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{t(`nav.${item.translationKey}`)}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="border-t p-4 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium">{t('footer.version')}</p>
                <p className="mt-1">{t('footer.copyright')}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
