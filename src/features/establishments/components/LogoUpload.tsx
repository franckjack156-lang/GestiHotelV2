/**
 * ============================================================================
 * LOGO UPLOAD COMPONENT
 * ============================================================================
 *
 * Composant pour uploader un logo d'établissement avec :
 * - Preview de l'image
 * - Upload vers Firebase Storage
 * - Affichage placeholder avec icône si pas de logo
 */

import React, { useState, useRef, useCallback } from 'react';
import { Building2, Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import storageService from '@/shared/services/storageService';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface LogoUploadProps {
  /** ID de l'établissement */
  establishmentId: string;
  /** URL actuelle du logo */
  currentLogoUrl?: string | null;
  /** Nom de l'établissement (pour le placeholder) */
  establishmentName?: string;
  /** Callback quand l'URL change */
  onLogoChange: (url: string | null) => void;
  /** Désactivé */
  disabled?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

// =============================================================================
// COMPOSANT
// =============================================================================

export const LogoUpload: React.FC<LogoUploadProps> = ({
  establishmentId,
  currentLogoUrl,
  establishmentName,
  onLogoChange,
  disabled = false,
  className,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const result = await storageService.uploadEstablishmentLogo(establishmentId, file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.9,
        });

        // Nettoyer la preview locale
        URL.revokeObjectURL(localPreviewURL);
        setPreviewURL(null);

        // Notifier le parent
        onLogoChange(result.url);
        toast.success('Logo mis à jour');
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'upload");
        setPreviewURL(null);
      } finally {
        setIsUploading(false);
        // Reset l'input pour permettre de re-sélectionner le même fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [establishmentId, onLogoChange]
  );

  /**
   * Supprimer le logo
   */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLogoChange(null);
      setPreviewURL(null);
      toast.success('Logo supprimé');
    },
    [onLogoChange]
  );

  // URL à afficher (preview locale ou logo actuel)
  const displayURL = previewURL || currentLogoUrl;

  return (
    <div className={cn('relative', className)}>
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {/* Zone d'upload cliquable */}
      <div
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer group',
          'w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600',
          'flex items-center justify-center overflow-hidden',
          'transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        {displayURL ? (
          // Afficher le logo
          <img
            src={displayURL}
            alt={establishmentName || 'Logo'}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          // Placeholder
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Building2 className="h-10 w-10 mb-2" />
            <span className="text-xs text-center px-2">Ajouter un logo</span>
          </div>
        )}

        {/* Overlay au hover */}
        {!disabled && !isUploading && (
          <div
            className={cn(
              'absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2',
              'opacity-0 group-hover:opacity-100 transition-opacity rounded-lg'
            )}
          >
            {displayURL ? (
              <ImageIcon className="h-6 w-6 text-white" />
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
            <span className="text-xs text-white">{displayURL ? 'Modifier' : 'Uploader'}</span>
          </div>
        )}

        {/* Indicateur de chargement */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Bouton supprimer */}
      {displayURL && !disabled && !isUploading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Texte d'aide */}
      <p className="text-xs text-gray-500 text-center mt-2 max-w-[128px]">
        JPG, PNG, GIF ou WebP
        <br />
        (max 5MB)
      </p>
    </div>
  );
};

export default LogoUpload;
