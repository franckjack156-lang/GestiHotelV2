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

import { Menu, Bell, Search, User, Settings, LogOut, Building2 } from 'lucide-react';
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

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

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

  // TODO: Récupérer le vrai nombre de notifications non lues
  // Vous pouvez utiliser un hook custom pour ça
  const unreadNotifications = 3; // Placeholder

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

      {/* Barre de recherche */}
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={t('header.search')}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            style={{
              '--tw-ring-color': 'hsl(var(--theme-primary))',
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.borderColor = 'hsl(var(--theme-primary))';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '';
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* 🆕 Network Indicator */}
        <NetworkIndicator />

        {/* 🆕 Notifications - Clic vers le centre de notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/app/notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
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
                    color: 'hsl(var(--theme-primary-dark))'
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
