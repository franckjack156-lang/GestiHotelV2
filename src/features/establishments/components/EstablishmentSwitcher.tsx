/**
 * EstablishmentSwitcher Component
 *
 * Sélecteur d'établissement dans le Header (VERSION SIMPLIFIÉE)
 */

import { useState } from 'react';
import { Check, Building2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { useEstablishments } from '../hooks/useEstablishments';
import { useCurrentEstablishment } from '../hooks/useCurrentEstablishment';
import { ESTABLISHMENT_TYPE_LABELS } from '@/shared/types/establishment.types';
import type { Establishment } from '@/shared/types/establishment.types';

/**
 * Composant pour afficher le logo ou l'icône par défaut
 */
const EstablishmentIcon = ({
  establishment,
  size = 'sm',
}: {
  establishment: Establishment | null;
  size?: 'sm' | 'md';
}) => {
  const sizeClasses = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  if (establishment?.logoUrl) {
    return (
      <img
        src={establishment.logoUrl}
        alt={establishment.name}
        className={`${sizeClasses} rounded object-contain flex-shrink-0`}
      />
    );
  }

  return <Building2 className={`${sizeClasses} text-gray-500 flex-shrink-0`} />;
};

export const EstablishmentSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { establishments, currentEstablishment, switchEstablishment } = useEstablishments();
  const { canSwitchEstablishment } = useCurrentEstablishment();

  // Si l'utilisateur ne peut pas changer d'établissement, ne rien afficher
  if (!canSwitchEstablishment()) {
    return null;
  }

  // Si un seul établissement, afficher juste le nom avec le logo
  if (establishments.length === 1) {
    const establishment = establishments[0];
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <EstablishmentIcon establishment={establishment} />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {establishment.name}
        </span>
      </div>
    );
  }

  // Gérer le changement d'établissement
  const handleSelect = async (establishmentId: string) => {
    if (establishmentId === currentEstablishment?.id) {
      setOpen(false);
      return;
    }

    const success = await switchEstablishment(establishmentId);
    if (success) {
      setOpen(false);
      window.location.reload();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <EstablishmentIcon establishment={currentEstablishment} />
            <span className="truncate text-sm">{currentEstablishment?.name || 'Sélectionner'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        {establishments.map(establishment => (
          <DropdownMenuItem
            key={establishment.id}
            onClick={() => handleSelect(establishment.id)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center gap-3">
              <EstablishmentIcon establishment={establishment} size="md" />
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="truncate font-medium text-sm">{establishment.name}</span>
                <span className="truncate text-xs text-gray-500">
                  {ESTABLISHMENT_TYPE_LABELS[establishment.type]}
                </span>
              </div>
              {currentEstablishment?.id === establishment.id && (
                <Check className="h-4 w-4 flex-shrink-0 text-indigo-600" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
