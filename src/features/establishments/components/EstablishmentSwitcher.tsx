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

export const EstablishmentSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { establishments, currentEstablishment, switchEstablishment } = useEstablishments();
  const { canSwitchEstablishment } = useCurrentEstablishment();

  // Si l'utilisateur ne peut pas changer d'établissement, ne rien afficher
  if (!canSwitchEstablishment()) {
    return null;
  }

  // Si un seul établissement, afficher juste le nom
  if (establishments.length === 1) {
    const establishment = establishments[0];
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <Building2 className="h-4 w-4 text-gray-500" />
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
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <span className="truncate text-sm">{currentEstablishment?.name || 'Sélectionner'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {establishments.map(establishment => (
          <DropdownMenuItem
            key={establishment.id}
            onClick={() => handleSelect(establishment.id)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium text-sm">{establishment.name}</span>
                <span className="truncate text-xs text-gray-500">
                  {ESTABLISHMENT_TYPE_LABELS[establishment.type]}
                </span>
              </div>
              {currentEstablishment?.id === establishment.id && (
                <Check className="ml-2 h-4 w-4 flex-shrink-0 text-indigo-600" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
