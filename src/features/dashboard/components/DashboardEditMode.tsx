/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * DashboardEditMode Component
 *
 * Mode édition pour gérer les widgets du dashboard avec drag & drop
 */

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Eye, EyeOff, GripVertical, Save, X, Plus, Layout as LayoutIcon } from 'lucide-react';
import type { DashboardPreferences, WidgetConfig } from '../types/dashboard.types';
import { WidgetConfigDialog } from './WidgetConfigDialog';
import { DashboardGrid } from './DashboardGrid';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

interface DashboardEditModeProps {
  preferences: DashboardPreferences;
  onUpdatePreferences: (updates: Partial<DashboardPreferences>) => Promise<void>;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => Promise<void>;
  onExit: () => void;
}

// Labels pour les types de widgets
const WIDGET_TYPE_LABELS: Record<string, string> = {
  stats_card: 'Carte statistique',
  line_chart: 'Graphique en ligne',
  bar_chart: 'Graphique en barres',
  pie_chart: 'Graphique circulaire',
  area_chart: 'Graphique en aires',
  table: 'Tableau',
  list: 'Liste',
  clock: 'Horloge',
  quick_links: 'Liens rapides',
  button_grid: 'Grille de boutons',
  note: 'Note',
  custom_list: 'Liste personnalisée',
  iframe: 'Site web (iframe)',
};

const DATA_SOURCE_LABELS: Record<string, string> = {
  interventions_by_status: 'Interventions par statut',
  interventions_by_priority: 'Interventions par priorité',
  interventions_by_type: 'Interventions par type',
  interventions_timeline: 'Chronologie des interventions',
  rooms_by_status: 'Chambres par statut',
  technician_performance: 'Performance des techniciens',
  recent_interventions: 'Interventions récentes',
  urgent_interventions: 'Interventions urgentes',
};

export const DashboardEditMode = ({
  preferences,
  onUpdateWidget,
  onUpdatePreferences,
  onExit,
}: DashboardEditModeProps) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(preferences.widgets);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleToggleVisibility = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newVisible = !widget.visible;

    // Mise à jour locale optimiste
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, visible: newVisible } : w))
    );

    try {
      await onUpdateWidget(widgetId, { visible: newVisible });
      toast.success(newVisible ? 'Widget affiché' : 'Widget masqué');
    } catch (error) {
      // Rollback en cas d'erreur
      setWidgets(prev =>
        prev.map(w => (w.id === widgetId ? { ...w, visible: !newVisible } : w))
      );
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();

    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Réorganiser
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Mettre à jour les positions
    newWidgets.forEach((widget, index) => {
      widget.position = { row: index, col: 0 };
    });

    setWidgets(newWidgets);
  };

  const handleDragEnd = async () => {
    if (!draggedWidget) return;

    try {
      setIsSaving(true);
      await onUpdatePreferences({ widgets });
      toast.success('Ordre des widgets sauvegardé');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      logger.error(error);
      // Recharger depuis les préférences originales
      setWidgets(preferences.widgets);
    } finally {
      setDraggedWidget(null);
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      await onUpdatePreferences({ widgets });
      toast.success('Modifications sauvegardées');
      onExit();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      logger.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurer les widgets originaux
    setWidgets(preferences.widgets);
    onExit();
  };

  const handleAddWidget = async (newWidgetConfig: Partial<WidgetConfig>) => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: newWidgetConfig.type!,
      dataSource: newWidgetConfig.dataSource || 'static',
      title: newWidgetConfig.title!,
      size: newWidgetConfig.size || 'medium',
      position: { row: widgets.length, col: 0 },
      visible: true,
      ...newWidgetConfig,
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);

    try {
      await onUpdatePreferences({ widgets: updatedWidgets });
      toast.success('Widget ajouté avec succès');
      setIsAddWidgetDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du widget');
      setWidgets(widgets); // Rollback
      logger.error(error);
    }
  };

  const handleGridLayoutChange = async (updatedWidgets: WidgetConfig[]) => {
    setWidgets(updatedWidgets);
  };

  const visibleCount = widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-20">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full mx-4 my-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mode Édition du Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Réorganisez vos widgets par glisser-déposer et gérez leur visibilité
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Statistiques et Actions */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Widgets affichés
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {visibleCount}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Widgets masqués
                </p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {hiddenCount}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <GripVertical className="w-4 h-4 mr-2" />
                  Liste
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <LayoutIcon className="w-4 h-4 mr-2" />
                  Grille
                </Button>
              </div>

              <Button onClick={() => setIsAddWidgetDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un widget
              </Button>
            </div>
          </div>
        </div>

        {/* Liste/Grille des widgets */}
        <div className="p-6">
          {widgets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun widget configuré
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {widgets.map((widget, index) => (
                <Card
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={e => handleDragOver(e, widget.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-all ${
                    draggedWidget === widget.id
                      ? 'opacity-50 scale-95'
                      : 'hover:shadow-md'
                  } ${
                    !widget.visible
                      ? 'bg-gray-50 dark:bg-gray-800 border-dashed'
                      : 'border-solid'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Drag handle */}
                      <div className="flex-shrink-0">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Numéro d'ordre */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          {index + 1}
                        </span>
                      </div>

                      {/* Informations du widget */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {widget.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {WIDGET_TYPE_LABELS[widget.type] || widget.type} •{' '}
                          {DATA_SOURCE_LABELS[widget.dataSource] || widget.dataSource}
                        </p>
                      </div>

                      {/* Badge de visibilité */}
                      <div className="flex-shrink-0">
                        {widget.visible ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Masqué
                          </span>
                        )}
                      </div>

                      {/* Bouton toggle visibilité */}
                      <Button
                        variant={widget.visible ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleVisibility(widget.id)}
                        className="flex-shrink-0"
                      >
                        {widget.visible ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Masquer
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Afficher
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <DashboardGrid
                widgets={widgets}
                onLayoutChange={handleGridLayoutChange}
                isEditMode={true}
              />
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Mode Grille :</strong> Faites glisser les widgets pour les réorganiser et redimensionnez-les en tirant sur le coin inférieur droit.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              💡 Glissez-déposez pour réorganiser • Cliquez sur l'œil pour masquer/afficher
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSaveAndExit} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder et quitter'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue d'ajout de widget */}
      <WidgetConfigDialog
        open={isAddWidgetDialogOpen}
        onClose={() => setIsAddWidgetDialogOpen(false)}
        onSave={handleAddWidget}
      />
    </div>
  );
};
