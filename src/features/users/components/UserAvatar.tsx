/**
 * ============================================================================
 * USER AVATAR COMPONENT - VERSION CORRIGÉE
 * ============================================================================
 *
 * Corrections :
 * - ✅ Protection contre displayName undefined
 * - ✅ Gestion des valeurs null/undefined
 * - ✅ Valeurs par défaut si données manquantes
 */

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

interface UserAvatarProps {
  /** URL de la photo */
  photoURL?: string | null;
  /** Nom complet pour les initiales */
  displayName?: string | null;
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
 * ✅ CORRECTION : Gère les valeurs undefined/null
 */
function getInitials(name?: string | null): string {
  // ✅ Protection contre undefined/null/empty
  if (!name || typeof name !== 'string') {
    return '??';
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return '??';
  }

  const parts = trimmedName.split(' ').filter(part => part.length > 0);

  if (parts.length === 0) {
    return '??';
  }

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Générer une couleur de fond basée sur le nom
 * ✅ CORRECTION : Gère les valeurs undefined/null
 */
function getColorFromName(name?: string | null): string {
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

  // ✅ Protection contre undefined/null
  if (!name || typeof name !== 'string') {
    return colors[0]; // Rouge par défaut
  }

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
  // ✅ CORRECTION : Fournir une valeur par défaut
  const safeName = displayName || 'Utilisateur';
  const initials = getInitials(safeName);
  const bgColor = getColorFromName(safeName);

  return (
    <div className={cn('relative', className)}>
      <Avatar className={cn(sizeClasses[size])}>
        {photoURL && <AvatarImage src={photoURL} alt={safeName} />}
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
