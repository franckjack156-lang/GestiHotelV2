/**
 * Header Component - VERSION CORRIGÉE
 *
 * Header principal de l'application avec menu utilisateur
 *
 * ✅ Corrections :
 * - Import correct de EstablishmentSwitcher
 * - Lien vers le centre de notifications
 * - Compteur notifications non lues
 */

import { Menu, Bell, User, Settings, LogOut, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

import { EstablishmentSwitcher } from '@/features/establishments/components/EstablishmentSwitcher';
import { NetworkIndicator } from '@/shared/components/indicators/NetworkIndicator';
import { useUnreadNotifications } from '@/shared/hooks/useUnreadNotifications';
import { ThemeToggle } from '@/shared/components/theme';
import { SearchButton } from '@/shared/components/search';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useUnreadNotifications();

  /**
   * Obtenir les initiales de l'utilisateur
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-white px-3 sm:px-4 md:px-6 dark:bg-gray-800 dark:border-gray-700">
      {/* Bouton menu mobile */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden flex-shrink-0">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <Link to="/app/dashboard" className="flex items-center gap-2 flex-shrink-0">
        <Building2 className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: 'hsl(var(--theme-primary))' }} />
        <span className="hidden font-bold text-gray-900 dark:text-white sm:inline-block">
          GestiHôtel
        </span>
      </Link>

      {/* 🆕 ESTABLISHMENT SWITCHER - Masqué sur mobile et tablette */}
      <div className="hidden xl:block flex-shrink-0">
        <EstablishmentSwitcher />
      </div>

      {/* Barre de recherche globale - Cmd+K - Responsive */}
      <div className="flex-1 max-w-xs sm:max-w-md">
        <SearchButton />
      </div>

      {/* Actions - Responsive gap */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* 🆕 Network Indicator - Masqué sur mobile */}
        <div className="hidden sm:block">
          <NetworkIndicator />
        </div>

        {/* 🆕 Theme Toggle - Masqué sur très petit mobile */}
        <div className="hidden xs:block">
          <ThemeToggle />
        </div>

        {/* 🆕 Notifications - Clic vers le centre de notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative flex-shrink-0"
          onClick={() => navigate('/app/notifications')}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </Button>

        {/* Menu utilisateur - Avatar plus petit sur mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'hsl(var(--theme-primary-light) / 0.2)',
                    color: 'hsl(var(--theme-primary-dark))',
                  }}
                  className="text-xs sm:text-sm"
                >
                  {user?.displayName ? getInitials(user.displayName) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                {t('header.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                {t('nav.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              {t('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
