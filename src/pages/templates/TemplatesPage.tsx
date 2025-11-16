/**
 * ============================================================================
 * TEMPLATES PAGE
 * ============================================================================
 *
 * Page de gestion des modèles d'interventions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useTemplates } from '@/features/templates/hooks/useTemplates';
import { TemplatesList, TemplateForm } from '@/features/templates/components';
import type {
  InterventionTemplate,
  CreateTemplateData,
} from '@/features/templates/types/template.types';

export const TemplatesPage = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useTemplates(establishmentId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InterventionTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Créer un template
   */
  const handleCreate = async (data: CreateTemplateData) => {
    setIsSubmitting(true);
    const id = await createTemplate(data);
    setIsSubmitting(false);

    if (id) {
      setIsCreateDialogOpen(false);
    }
  };

  /**
   * Mettre à jour un template
   */
  const handleUpdate = async (data: CreateTemplateData) => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    const success = await updateTemplate(selectedTemplate.id, data);
    setIsSubmitting(false);

    if (success) {
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  /**
   * Supprimer un template
   */
  const handleDelete = async (template: InterventionTemplate) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`)) {
      return;
    }

    await deleteTemplate(template.id);
  };

  /**
   * Dupliquer un template
   */
  const handleDuplicate = async (template: InterventionTemplate) => {
    await duplicateTemplate(template.id);
  };

  /**
   * Ouvrir le dialog d'édition
   */
  const handleEdit = (template: InterventionTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  /**
   * Utiliser un template (rediriger vers création intervention)
   */
  const handleUse = (template: InterventionTemplate) => {
    // Passer les données du template via l'état de navigation
    navigate('/app/interventions/create', {
      state: { template },
    });
  };

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez sélectionner un établissement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/interventions')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modèles d'interventions</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Créez et gérez vos modèles réutilisables
            </p>
          </div>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {/* Info */}
      <Alert>
        <AlertDescription>
          Les modèles vous permettent de créer rapidement des interventions en pré-remplissant les
          informations récurrentes. Utilisez-les pour gagner du temps !
        </AlertDescription>
      </Alert>

      {/* Liste des templates */}
      <TemplatesList
        templates={templates}
        onUse={handleUse}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onCreate={() => setIsCreateDialogOpen(true)}
        isLoading={isLoading}
      />

      {/* Dialog Création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un modèle d'intervention</DialogTitle>
            <DialogDescription>
              Définissez les informations qui seront pré-remplies lors de l'utilisation de ce modèle
            </DialogDescription>
          </DialogHeader>

          <TemplateForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le modèle</DialogTitle>
            <DialogDescription>
              Modifiez les informations pré-remplies de ce modèle
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <TemplateForm
              template={selectedTemplate}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedTemplate(null);
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
