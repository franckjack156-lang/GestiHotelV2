/**
 * ============================================================================
 * TECHNICIAN SELECT
 * ============================================================================
 *
 * Composant de sélection de techniciens pour l'assignation d'interventions
 * Charge uniquement les utilisateurs marqués comme techniciens (isTechnician = true)
 *
 * Utilisation:
 * ```tsx
 * <TechnicianSelect
 *   value={selectedTechnicianIds}
 *   onChange={(ids) => setSelectedTechnicianIds(ids)}
 *   multiple={true}
 *   requiredSkills={['plumbing', 'electricity']}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Loader2, AlertCircle, Check, ChevronsUpDown, X } from 'lucide-react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { UserAvatar } from '@/features/users/components';
import { cn } from '@/shared/utils/cn';
import type { User as UserType, UserProfile } from '@/features/users/types/user.types';

// ============================================================================
// TYPES
// ============================================================================

export interface TechnicianSelectProps {
  /** Valeur(s) sélectionnée(s) - ID(s) du/des technicien(s) */
  value?: string | string[];

  /** Callback au changement */
  onChange: (value: string | string[]) => void;

  /** Sélection multiple */
  multiple?: boolean;

  /** Placeholder */
  placeholder?: string;

  /** Désactivé */
  disabled?: boolean;

  /** Compétences requises (filtre les techniciens) */
  requiredSkills?: string[];

  /** Afficher les compétences dans la liste */
  showSkills?: boolean;

  /** Afficher les avatars */
  showAvatars?: boolean;

  /** Nombre maximum de sélections (pour mode multiple) */
  maxSelections?: number;

  /** Message d'erreur */
  error?: string;

  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder = 'Sélectionner un technicien',
  disabled = false,
  requiredSkills = [],
  showSkills = true,
  showAvatars = true,
  maxSelections,
  error,
  className,
}) => {
  const [open, setOpen] = useState(false);

  // Charger tous les utilisateurs (utiliser allUsers pour avoir la liste complète, pas paginée)
  const { allUsers: users, isLoading, error: loadError } = useUsers();

  // Filtrer uniquement les techniciens
  const technicians = useMemo(() => {
    if (!users) return [];

    // Cast to UserProfile to access skills property
    const userProfiles = users as UserProfile[];
    let filtered = userProfiles.filter(u => u.isTechnician && u.isActive);

    // Filtrer par compétences requises
    if (requiredSkills.length > 0) {
      filtered = filtered.filter(tech => {
        if (!tech.skills || tech.skills.length === 0) return false;
        return requiredSkills.some(required => tech.skills?.includes(required));
      });
    }

    return filtered;
  }, [users, requiredSkills]);

  // Normaliser la valeur en array pour faciliter le traitement
  const selectedIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelect = (technicianId: string) => {
    if (multiple) {
      const isSelected = selectedIds.includes(technicianId);

      if (isSelected) {
        // Désélectionner
        const newValue = selectedIds.filter(id => id !== technicianId);
        onChange(newValue);
      } else {
        // Sélectionner si pas de limite ou limite non atteinte
        if (!maxSelections || selectedIds.length < maxSelections) {
          onChange([...selectedIds, technicianId]);
        }
      }
    } else {
      // Mode simple : fermer et sélectionner
      onChange(technicianId);
      setOpen(false);
    }
  };

  const handleRemove = (technicianId: string) => {
    if (multiple) {
      onChange(selectedIds.filter(id => id !== technicianId));
    } else {
      onChange('');
    }
  };

  const handleClearAll = () => {
    onChange(multiple ? [] : '');
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getSelectedTechnicians = (): UserType[] => {
    if (!technicians) return [];
    return selectedIds.map(id => technicians.find(t => t.id === id)).filter(Boolean) as UserType[];
  };

  const getTechnicianLabel = (tech: UserType): string => {
    return tech.displayName;
  };

  const hasRequiredSkills = (tech: UserType): boolean => {
    const techProfile = tech as UserProfile;
    if (requiredSkills.length === 0) return true;
    if (!techProfile.skills || techProfile.skills.length === 0) return false;
    return requiredSkills.some(required => techProfile.skills?.includes(required));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // État de chargement
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-2 border rounded-md', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement des techniciens...</span>
      </div>
    );
  }

  // Erreur de chargement
  if (loadError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  // Aucun technicien disponible
  if (!technicians || technicians.length === 0) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {requiredSkills.length > 0
            ? `Aucun technicien disponible avec les compétences requises : ${requiredSkills.join(', ')}`
            : 'Aucun technicien disponible. Vous devez créer des utilisateurs et cocher "Cet utilisateur est un technicien".'}
        </AlertDescription>
      </Alert>
    );
  }

  const selectedTechnicians = getSelectedTechnicians();

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between', error && 'border-red-500', className)}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              {selectedIds.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : multiple ? (
                <span className="text-sm">
                  {selectedIds.length}{' '}
                  {selectedIds.length === 1 ? 'technicien sélectionné' : 'techniciens sélectionnés'}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  {showAvatars && selectedTechnicians[0] && (
                    <UserAvatar
                      photoURL={selectedTechnicians[0].photoURL}
                      displayName={selectedTechnicians[0].displayName}
                      size="sm"
                    />
                  )}
                  <span className="truncate">
                    {selectedTechnicians[0] ? getTechnicianLabel(selectedTechnicians[0]) : ''}
                  </span>
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un technicien..." />
            <CommandEmpty>Aucun technicien trouvé.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {technicians.map(tech => {
                const isSelected = selectedIds.includes(tech.id);
                const meetsSkillRequirement = hasRequiredSkills(tech);
                const isDisabled = Boolean(
                  !isSelected && multiple && maxSelections && selectedIds.length >= maxSelections
                );

                return (
                  <CommandItem
                    key={tech.id}
                    value={tech.id}
                    onSelect={() => !isDisabled && handleSelect(tech.id)}
                    disabled={isDisabled}
                    className={cn(isDisabled && 'opacity-50 cursor-not-allowed')}
                  >
                    {multiple && (
                      <Check
                        className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      {showAvatars && (
                        <UserAvatar
                          photoURL={tech.photoURL}
                          displayName={tech.displayName}
                          size="sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{getTechnicianLabel(tech)}</span>
                          {meetsSkillRequirement && requiredSkills.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              Compétent
                            </Badge>
                          )}
                        </div>
                        {showSkills &&
                          (tech as UserProfile).skills &&
                          (tech as UserProfile).skills!.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(tech as UserProfile).skills!.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {(tech as UserProfile).skills!.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{(tech as UserProfile).skills!.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Badges des sélections (mode multiple) */}
      {multiple && selectedTechnicians.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTechnicians.map(tech => (
            <Badge key={tech.id} variant="secondary" className="gap-2 pr-1">
              {showAvatars && (
                <UserAvatar photoURL={tech.photoURL} displayName={tech.displayName} size="sm" />
              )}
              <span className="text-xs">{getTechnicianLabel(tech)}</span>
              <button
                type="button"
                onClick={() => handleRemove(tech.id)}
                className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedTechnicians.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs"
              disabled={disabled}
            >
              Tout effacer
            </Button>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Information sur la limite */}
      {multiple && maxSelections && !error && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelections} {maxSelections === 1 ? 'technicien' : 'techniciens'}
          {selectedIds.length > 0 && ` (${selectedIds.length}/${maxSelections})`}
        </p>
      )}

      {/* Information sur les compétences requises */}
      {requiredSkills.length > 0 && !error && (
        <p className="text-xs text-muted-foreground">
          Compétences requises : {requiredSkills.join(', ')}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default TechnicianSelect;
