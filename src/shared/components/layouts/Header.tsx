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

// 🆕 Import corrigé de EstablishmentSwitcher depuis le bon fichier
import { EstablishmentSwitcher } from '@/pages/establishments/EstablishmentsPages';
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
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-gray-800 dark:border-gray-700">
      {/* Bouton menu mobile */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <Link to="/app/dashboard" className="flex items-center gap-2">
        <Building2 className="h-6 w-6" style={{ color: 'hsl(var(--theme-primary))' }} />
        <span className="hidden font-bold text-gray-900 dark:text-white sm:inline-block">
          GestiHôtel
        </span>
      </Link>

      {/* 🆕 ESTABLISHMENT SWITCHER */}
      <div className="hidden lg:block">
        <EstablishmentSwitcher />
      </div>

      {/* Barre de recherche globale - Cmd+K */}
      <div className="flex-1 max-w-md">
        <SearchButton />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* 🆕 Network Indicator */}
        <NetworkIndicator />

        {/* 🆕 Theme Toggle */}
        <ThemeToggle />

        {/* 🆕 Notifications - Clic vers le centre de notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/app/notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </Button>

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'hsl(var(--theme-primary-light) / 0.2)',
                    color: 'hsl(var(--theme-primary-dark))',
                  }}
                >
                  {user?.displayName ? getInitials(user.displayName) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
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
