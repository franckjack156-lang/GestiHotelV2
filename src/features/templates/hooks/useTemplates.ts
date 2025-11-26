/**
 * ============================================================================
 * USE TEMPLATES HOOK
 * ============================================================================
 *
 * Hook pour gérer les modèles d'interventions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import {
  getTemplates,
  createTemplate as createTemplateService,
  updateTemplate as updateTemplateService,
  deleteTemplate as deleteTemplateService,
  duplicateTemplate as duplicateTemplateService,
  toggleTemplateActive as toggleTemplateActiveService,
  incrementTemplateUsage as incrementTemplateUsageService,
} from '../services/templateService';
import { logger } from '@/core/utils/logger';
import type {
  InterventionTemplate,
  CreateTemplateData,
  UpdateTemplateData,
} from '../types/template.types';

export const useTemplates = (establishmentId: string | null) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<InterventionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les templates
   */
  const loadTemplates = useCallback(
    async (filters?: { category?: string; isActive?: boolean }) => {
      if (!establishmentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getTemplates(establishmentId, filters);
        setTemplates(data);
      } catch (err: any) {
        logger.error('Error loading templates:', err);
        setError(err.message);
        toast.error('Erreur de chargement', {
          description: 'Impossible de charger les modèles',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [establishmentId]
  );

  /**
   * Charger au montage
   */
  useEffect(() => {
    if (establishmentId) {
      loadTemplates({ isActive: true }); // Charger seulement les templates actifs par défaut
    }
  }, [establishmentId, loadTemplates]);

  /**
   * Récupérer un template par ID
   */
  const getTemplate = useCallback(
    (templateId: string): InterventionTemplate | undefined => {
      return templates.find(t => t.id === templateId);
    },
    [templates]
  );

  /**
   * Créer un template
   */
  const createTemplate = useCallback(
    async (data: CreateTemplateData): Promise<string | null> => {
      if (!establishmentId || !user) {
        toast.error('Erreur', { description: 'Établissement ou utilisateur non défini' });
        return null;
      }

      try {
        const id = await createTemplateService(establishmentId, user.id, data);
        toast.success('Modèle créé avec succès');
        await loadTemplates({ isActive: true });
        return id;
      } catch (err: any) {
        logger.error('Error creating template:', err);
        toast.error('Erreur de création', { description: err.message });
        return null;
      }
    },
    [establishmentId, user, loadTemplates]
  );

  /**
   * Mettre à jour un template
   */
  const updateTemplate = useCallback(
    async (templateId: string, data: UpdateTemplateData): Promise<boolean> => {
      if (!establishmentId) {
        toast.error('Erreur', { description: 'Établissement non défini' });
        return false;
      }

      try {
        await updateTemplateService(establishmentId, templateId, data);
        toast.success('Modèle mis à jour');
        await loadTemplates({ isActive: true });
        return true;
      } catch (err: any) {
        logger.error('Error updating template:', err);
        toast.error('Erreur de mise à jour', { description: err.message });
        return false;
      }
    },
    [establishmentId, loadTemplates]
  );

  /**
   * Supprimer un template
   */
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      if (!establishmentId) {
        toast.error('Erreur', { description: 'Établissement non défini' });
        return false;
      }

      try {
        await deleteTemplateService(establishmentId, templateId);
        toast.success('Modèle supprimé');
        await loadTemplates({ isActive: true });
        return true;
      } catch (err: any) {
        logger.error('Error deleting template:', err);
        toast.error('Erreur de suppression', { description: err.message });
        return false;
      }
    },
    [establishmentId, loadTemplates]
  );

  /**
   * Dupliquer un template
   */
  const duplicateTemplate = useCallback(
    async (templateId: string): Promise<string | null> => {
      if (!establishmentId || !user) {
        toast.error('Erreur', { description: 'Établissement ou utilisateur non défini' });
        return null;
      }

      try {
        const id = await duplicateTemplateService(establishmentId, templateId, user.id);
        toast.success('Modèle dupliqué');
        await loadTemplates({ isActive: true });
        return id;
      } catch (err: any) {
        logger.error('Error duplicating template:', err);
        toast.error('Erreur de duplication', { description: err.message });
        return null;
      }
    },
    [establishmentId, user, loadTemplates]
  );

  /**
   * Activer/Désactiver un template
   */
  const toggleActive = useCallback(
    async (templateId: string, isActive: boolean): Promise<boolean> => {
      if (!establishmentId) {
        toast.error('Erreur', { description: 'Établissement non défini' });
        return false;
      }

      try {
        await toggleTemplateActiveService(establishmentId, templateId, isActive);
        toast.success(isActive ? 'Modèle activé' : 'Modèle désactivé');
        await loadTemplates({ isActive: true });
        return true;
      } catch (err: any) {
        logger.error('Error toggling template:', err);
        toast.error('Erreur', { description: err.message });
        return false;
      }
    },
    [establishmentId, loadTemplates]
  );

  /**
   * Incrémenter le compteur d'utilisation
   */
  const incrementUsage = useCallback(
    async (templateId: string): Promise<void> => {
      if (!establishmentId) return;

      try {
        await incrementTemplateUsageService(establishmentId, templateId);
        // Pas de toast pour ne pas spammer l'utilisateur
        // Juste recharger silencieusement
        await loadTemplates({ isActive: true });
      } catch (err: any) {
        logger.error('Error incrementing template usage:', err);
        // Erreur silencieuse, pas critique
      }
    },
    [establishmentId, loadTemplates]
  );

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleActive,
    incrementUsage,
  };
};
