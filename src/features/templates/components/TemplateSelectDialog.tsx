/**
 * ============================================================================
 * TEMPLATE SELECT DIALOG
 * ============================================================================
 *
 * Dialog pour sélectionner un modèle d'intervention lors de la création
 */

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { TemplatesList } from './TemplatesList';
import type { InterventionTemplate } from '../types/template.types';

interface TemplateSelectDialogProps {
  templates: InterventionTemplate[];
  onSelect: (template: InterventionTemplate) => void;
  trigger?: React.ReactNode;
  isLoading?: boolean;
}

export const TemplateSelectDialog = ({
  templates,
  onSelect,
  trigger,
  isLoading,
}: TemplateSelectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (template: InterventionTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" type="button">
      <Wand2 className="mr-2 h-4 w-4" />
      Utiliser un modèle
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Utiliser un modèle d'intervention</DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle pour pré-remplir les champs de l'intervention
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <TemplatesList templates={templates} onUse={handleSelect} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
