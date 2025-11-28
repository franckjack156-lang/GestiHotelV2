/**
 * ============================================================================
 * AVATAR UPLOAD COMPONENT
 * ============================================================================
 *
 * Composant pour uploader une photo de profil avec :
 * - Preview de l'image
 * - Upload vers Firebase Storage
 * - Support mobile (prise de photo / galerie)
 */

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/cn';
import storageService from '@/shared/services/storageService';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface AvatarUploadProps {
  /** ID de l'utilisateur (pour le stockage) */
  userId: string;
  /** URL actuelle de la photo */
  currentPhotoURL?: string | null;
  /** Nom pour les initiales en fallback */
  displayName?: string | null;
  /** Callback quand l'URL change */
  onPhotoChange: (url: string | null) => void;
  /** Taille de l'avatar (px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Désactivé */
  disabled?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

// =============================================================================
// TAILLES
// =============================================================================

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

const buttonSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
  xl: 'h-9 w-9',
};

// =============================================================================
// COMPOSANT
// =============================================================================

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentPhotoURL,
  displayName,
  onPhotoChange,
  size = 'lg',
  disabled = false,
  className,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Obtenir les initiales
   */
  const getInitials = useCallback((name?: string | null): string => {
    if (!name) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  /**
   * Générer une couleur basée sur le nom
   */
  const getColorFromName = useCallback((name?: string | null): string => {
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
    ];
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  /**
   * Ouvrir le sélecteur de fichiers
   */
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * Gérer la sélection d'un fichier
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Valider le type
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }

      // Créer une preview locale
      const localPreviewURL = URL.createObjectURL(file);
      setPreviewURL(localPreviewURL);

      // Uploader vers Firebase Storage
      setIsUploading(true);
      try {
        const result = await storageService.uploadProfilePhoto(userId, file, {
          maxWidth: 256,
          maxHeight: 256,
          quality: 0.85,
        });

        // Nettoyer la preview locale
        URL.revokeObjectURL(localPreviewURL);
        setPreviewURL(null);

        // Notifier le parent
        onPhotoChange(result.url);
        toast.success('Photo de profil mise à jour');
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de l'upload";
        toast.error(message);
        setPreviewURL(null);
      } finally {
        setIsUploading(false);
        // Reset l'input pour permettre de re-sélectionner le même fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [userId, onPhotoChange]
  );

  /**
   * Supprimer la photo
   */
  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      // Supprimer l'URL (la suppression du fichier dans Storage peut être faite côté serveur)
      onPhotoChange(null);
      setPreviewURL(null);
      toast.success('Photo de profil supprimée');
    },
    [onPhotoChange]
  );

  // URL à afficher (preview locale ou photo actuelle)
  const displayURL = previewURL || currentPhotoURL;
  const initials = getInitials(displayName);
  const bgColor = getColorFromName(displayName);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {/* Avatar cliquable */}
      <div
        onClick={handleClick}
        className={cn('relative cursor-pointer group', disabled && 'cursor-not-allowed opacity-60')}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-gray-200 dark:border-gray-700')}>
          {displayURL && <AvatarImage src={displayURL} alt={displayName || 'Photo'} />}
          <AvatarFallback className={cn(bgColor, 'text-white font-semibold text-lg')}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay au hover */}
        {!disabled && !isUploading && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
          >
            {displayURL ? (
              <Camera className="h-6 w-6 text-white" />
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
          </div>
        )}

        {/* Indicateur de chargement */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Bouton supprimer */}
      {displayURL && !disabled && !isUploading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className={cn('absolute -top-1 -right-1 rounded-full shadow-md', buttonSizeClasses[size])}
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Texte indicatif */}
      {!displayURL && !isUploading && !disabled && (
        <p className="text-xs text-gray-500 text-center mt-2">Cliquer pour ajouter</p>
      )}
    </div>
  );
};

// =============================================================================
// EXPORT
// =============================================================================

export default AvatarUpload;
