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
  MessageSquare,
  Settings,
  FileText,
  Package,
  Warehouse,
  Ticket,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMemo } from 'react';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlag';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
  superAdminOnly?: boolean;
  editorOnly?: boolean;
}

export const Sidebar = ({ isOpen, isCollapsed = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { currentEstablishment } = useEstablishments();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'editor';
  const isEditor = user?.role === 'editor';

  // Récupérer les features actives
  const features = useFeatureFlags([
    'interventions',
    'rooms',
    'interventionPlanning',
    'pushNotifications',
    'internalChat',
    'interventionTemplates',
    'suppliers',
    'inventory',
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
      translationKey: 'templates',
      href: '/app/templates',
      icon: FileText,
      requiredFeature: 'interventionTemplates',
    },
    {
      translationKey: 'suppliers',
      href: '/app/suppliers',
      icon: Package,
      requiredFeature: 'suppliers',
    },
    {
      translationKey: 'inventory',
      href: '/app/inventory',
      icon: Warehouse,
      requiredFeature: 'inventory',
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
      requiredFeature: 'interventionPlanning',
    },
    {
      translationKey: 'notifications',
      href: '/app/notifications',
      icon: Bell,
      requiredFeature: 'pushNotifications',
    },
    {
      translationKey: 'messaging',
      href: '/app/messaging',
      icon: MessageSquare,
      requiredFeature: 'internalChat',
    },
    {
      translationKey: 'settings',
      href: '/app/settings',
      icon: Settings,
      alwaysVisible: true,
    },
    {
      translationKey: 'adminSupport',
      href: '/app/admin/support',
      icon: Ticket,
      superAdminOnly: true,
    },
  ];

  /**
   * Filtrer selon features activées et rôle utilisateur
   */
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      // Items editor uniquement
      if (item.editorOnly) return isEditor;
      // Items super admin uniquement (inclut editor)
      if (item.superAdminOnly) return isSuperAdmin;
      if (item.alwaysVisible) return true;
      if (!item.requiredFeature) return true;
      return features[item.requiredFeature] === true;
    });
  }, [features, isSuperAdmin, isEditor]);

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
      {/* Overlay mobile - avec animation */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full border-r bg-white shadow-lg transition-all duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700',
          'lg:sticky lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-16' : 'w-72 sm:w-64'
        )}
        aria-label="Menu de navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo mobile - Plus grand et avec padding adaptatif */}
          <div className="flex h-14 sm:h-16 items-center gap-2 border-b px-4 sm:px-6 lg:hidden dark:border-gray-700">
            <Building2
              className="h-6 w-6 flex-shrink-0"
              style={{ color: 'hsl(var(--theme-primary))' }}
            />
            {!isCollapsed && (
              <span className="font-bold text-gray-900 dark:text-white text-lg">GestiHôtel</span>
            )}
          </div>

          {/* Navigation - Scrollable avec meilleur padding */}
          <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 sm:py-2 text-sm font-medium transition-colors touch-manipulation',
                    'hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95',
                    isCollapsed ? 'justify-center' : 'gap-3',
                    'min-h-[44px]' // Touch target minimum size
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
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{t(`nav.${item.translationKey}`)}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Logo établissement horizontal */}
          {!isCollapsed && (
            <div className="border-t p-3 sm:p-4 dark:border-gray-700">
              {/* Logo horizontal de l'établissement (ou fallback sur logo carré + nom) */}
              {currentEstablishment && (
                <div className="mb-3">
                  {currentEstablishment.logoWideUrl ? (
                    // Logo horizontal en pleine largeur
                    <img
                      src={currentEstablishment.logoWideUrl}
                      alt={currentEstablishment.name}
                      className="w-full h-auto max-h-12 object-contain"
                    />
                  ) : currentEstablishment.logoUrl ? (
                    // Fallback: logo carré + nom
                    <div className="flex items-center gap-3">
                      <img
                        src={currentEstablishment.logoUrl}
                        alt={currentEstablishment.name}
                        className="h-10 w-10 rounded-lg object-contain bg-gray-100 dark:bg-gray-700 p-1"
                      />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                        {currentEstablishment.name}
                      </p>
                    </div>
                  ) : (
                    // Fallback: icône + nom
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                        {currentEstablishment.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Version et copyright */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium truncate">{t('footer.version')}</p>
                <p className="mt-1 truncate">{t('footer.copyright')}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
