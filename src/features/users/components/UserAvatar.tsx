/**
 * ============================================================================
 * USER AVATAR COMPONENT
 * ============================================================================
 */

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

interface UserAvatarProps {
  /** URL de la photo */
  photoURL?: string | null;
  /** Nom complet pour les initiales */
  displayName: string;
  /** Taille (sm, md, lg, xl) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Classe CSS additionnelle */
  className?: string;
  /** Afficher un indicateur online */
  showOnline?: boolean;
  /** Utilisateur en ligne */
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

/**
 * Obtenir les initiales d'un nom
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Générer une couleur de fond basée sur le nom
 */
function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  photoURL,
  displayName,
  size = 'md',
  className,
  showOnline = false,
  isOnline = false,
}) => {
  const initials = getInitials(displayName);
  const bgColor = getColorFromName(displayName);

  return (
    <div className={cn('relative', className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={photoURL || undefined} alt={displayName} />
        <AvatarFallback className={cn(bgColor, 'text-white font-semibold')}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-4 w-4',
            isOnline ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
};
