/**
 * DashboardEditMode Component
 *
 * Mode édition pour gérer les widgets du dashboard
 * - Drag & drop pour réorganiser
 * - Sélecteur visuel de taille
 * - Toggle visibilité
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Eye, EyeOff, GripVertical, Save, X, Plus, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import type {
  DashboardPreferences,
  WidgetConfig,
  WidgetSize,
  WidgetHeight,
} from '../types/dashboard.types';
import { WidgetConfigDialog } from './WidgetConfigDialog';
import { WidgetRenderer } from './WidgetRenderer';
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
  weather: 'Météo',
};

// Ordre des tailles pour le cycle
const SIZE_ORDER: WidgetSize[] = ['small', 'medium', 'large', 'full'];

const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
  full: 'Pleine largeur',
};

// Options de hauteur
const HEIGHT_ORDER: WidgetHeight[] = ['normal', 'tall', 'extra-tall'];

const HEIGHT_LABELS: Record<WidgetHeight, string> = {
  normal: '1 ligne',
  tall: '2 lignes',
  'extra-tall': '3 lignes',
};

// Convertir la taille de widget en classes CSS Grid (largeur)
const getSizeClasses = (size: WidgetSize): string => {
  switch (size) {
    case 'small':
      return 'col-span-6 lg:col-span-3';
    case 'medium':
      return 'col-span-6';
    case 'large':
      return 'col-span-12 lg:col-span-9';
    case 'full':
      return 'col-span-12';
    default:
      return 'col-span-6';
  }
};

// Convertir la hauteur en classe CSS
const getHeightClasses = (height?: WidgetHeight): string => {
  switch (height) {
    case 'tall':
      return 'row-span-2';
    case 'extra-tall':
      return 'row-span-3';
    default:
      return 'row-span-1';
  }
};

// Hauteur minimale selon la propriété height
const getMinHeight = (height?: WidgetHeight): string => {
  switch (height) {
    case 'tall':
      return 'min-h-[420px]';
    case 'extra-tall':
      return 'min-h-[640px]';
    default:
      return 'min-h-[200px]';
  }
};

export const DashboardEditMode = ({
  preferences,
  onUpdateWidget: _onUpdateWidget,
  onUpdatePreferences,
  onExit,
}: DashboardEditModeProps) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(preferences.widgets);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    const original = JSON.stringify(preferences.widgets);
    const current = JSON.stringify(widgets);
    setHasChanges(original !== current);
  }, [widgets, preferences.widgets]);

  // === TOGGLE VISIBILITÉ ===
  const handleToggleVisibility = useCallback(async (widgetId: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w));
      return updated;
    });
  }, []);

  // === CHANGEMENT DE TAILLE (direct) ===
  const handleSetSize = useCallback((widgetId: string, newSize: WidgetSize) => {
    setWidgets(prev => prev.map(w => (w.id === widgetId ? { ...w, size: newSize } : w)));
  }, []);

  // === CHANGEMENT DE HAUTEUR (direct) ===
  const handleSetHeight = useCallback((widgetId: string, newHeight: WidgetHeight) => {
    setWidgets(prev => prev.map(w => (w.id === widgetId ? { ...w, height: newHeight } : w)));
  }, []);

  // === SUPPRESSION ===
  const handleDeleteWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  // === DRAG & DROP ===
  const handleDragStart = useCallback((widgetId: string) => {
    setDraggedWidget(widgetId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetWidgetId: string) => {
      e.preventDefault();
      if (!draggedWidget || draggedWidget === targetWidgetId) return;
      setDragOverWidget(targetWidgetId);
    },
    [draggedWidget]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverWidget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetWidgetId: string) => {
      e.preventDefault();
      if (!draggedWidget || draggedWidget === targetWidgetId) return;

      setWidgets(prev => {
        const newWidgets = [...prev];
        const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget);
        const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId);

        if (draggedIndex === -1 || targetIndex === -1) return prev;

        const [removed] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(targetIndex, 0, removed);

        // Mettre à jour les positions
        return newWidgets.map((widget, index) => ({
          ...widget,
          position: { row: Math.floor(index / 4), col: index % 4 },
        }));
      });

      setDraggedWidget(null);
      setDragOverWidget(null);
    },
    [draggedWidget]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragOverWidget(null);
  }, []);

  // === SAUVEGARDE ===
  const handleSave = async () => {
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
    if (hasChanges) {
      const confirm = window.confirm('Annuler les modifications non sauvegardées ?');
      if (!confirm) return;
    }
    onExit();
  };

  // === AJOUT WIDGET ===
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

    setWidgets(prev => [...prev, newWidget]);
    setIsAddWidgetDialogOpen(false);
    toast.success('Widget ajouté');
  };

  const visibleCount = widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-hidden">
      <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Header fixe */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Mode Édition du Dashboard
              </h2>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  {visibleCount} visibles
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {hiddenCount} masqués
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddWidgetDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Zone de prévisualisation avec scroll */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto">
            {/* Instructions */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <strong>Astuce :</strong> Glissez-déposez les widgets pour les réorganiser. Utilisez
              les boutons pour redimensionner ou masquer.
            </div>

            {/* Grille des widgets */}
            <div className="grid grid-cols-12 auto-rows-[200px] gap-4">
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className={`
                    ${getSizeClasses(widget.size)}
                    ${getHeightClasses(widget.height)}
                    relative
                    transition-all duration-200
                    ${draggedWidget === widget.id ? 'opacity-50 scale-95' : ''}
                    ${dragOverWidget === widget.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${!widget.visible ? 'opacity-60' : ''}
                  `}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={e => handleDragOver(e, widget.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, widget.id)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Barre de contrôle */}
                  <TooltipProvider delayDuration={200}>
                    <div className="absolute -top-1 left-0 right-0 z-20 flex items-center justify-between px-2 py-1.5 bg-gray-800/95 dark:bg-gray-700/95 rounded-t-lg text-white text-xs backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <GripVertical
                          size={14}
                          className="cursor-grab active:cursor-grabbing opacity-60"
                        />
                        <span className="font-medium truncate max-w-[120px]">{widget.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Sélecteur visuel de largeur */}
                        <div className="flex items-center bg-gray-700/50 rounded p-0.5">
                          {SIZE_ORDER.map(size => (
                            <Tooltip key={size}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleSetSize(widget.id, size)}
                                  className={`
                                    relative p-1 rounded transition-all
                                    ${
                                      widget.size === size
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'hover:bg-gray-600 text-gray-300'
                                    }
                                  `}
                                >
                                  {/* Icônes visuelles représentant les largeurs */}
                                  {size === 'small' && (
                                    <div className="w-4 h-3 flex gap-px">
                                      <div className="w-1.5 h-full bg-current rounded-sm" />
                                    </div>
                                  )}
                                  {size === 'medium' && (
                                    <div className="w-4 h-3 flex gap-px">
                                      <div className="w-2 h-full bg-current rounded-sm" />
                                    </div>
                                  )}
                                  {size === 'large' && (
                                    <div className="w-4 h-3 flex gap-px">
                                      <div className="w-3 h-full bg-current rounded-sm" />
                                    </div>
                                  )}
                                  {size === 'full' && (
                                    <div className="w-4 h-3 flex gap-px">
                                      <div className="w-full h-full bg-current rounded-sm" />
                                    </div>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                Largeur: {SIZE_LABELS[size]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>

                        {/* Séparateur */}
                        <div className="w-px h-4 bg-gray-600 mx-1" />

                        {/* Sélecteur visuel de hauteur */}
                        <div className="flex items-center bg-gray-700/50 rounded p-0.5">
                          {HEIGHT_ORDER.map(height => (
                            <Tooltip key={height}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleSetHeight(widget.id, height)}
                                  className={`
                                    relative p-1 rounded transition-all
                                    ${
                                      (widget.height || 'normal') === height
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'hover:bg-gray-600 text-gray-300'
                                    }
                                  `}
                                >
                                  {/* Icônes visuelles représentant les hauteurs */}
                                  {height === 'normal' && (
                                    <div className="w-3 h-4 flex flex-col gap-px">
                                      <div className="w-full h-1.5 bg-current rounded-sm" />
                                    </div>
                                  )}
                                  {height === 'tall' && (
                                    <div className="w-3 h-4 flex flex-col gap-px">
                                      <div className="w-full h-2.5 bg-current rounded-sm" />
                                    </div>
                                  )}
                                  {height === 'extra-tall' && (
                                    <div className="w-3 h-4 flex flex-col gap-px">
                                      <div className="w-full h-full bg-current rounded-sm" />
                                    </div>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                Hauteur: {HEIGHT_LABELS[height]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>

                        {/* Séparateur */}
                        <div className="w-px h-4 bg-gray-600 mx-1" />

                        {/* Visibility toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleVisibility(widget.id)}
                              className={`p-1 rounded transition-colors ${
                                widget.visible
                                  ? 'hover:bg-gray-700 text-gray-300'
                                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                              }`}
                            >
                              {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {widget.visible ? 'Masquer' : 'Afficher'}
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDeleteWidget(widget.id)}
                              className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Supprimer
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </TooltipProvider>

                  {/* Widget preview */}
                  <Card
                    className={`
                      h-full mt-6
                      ${getMinHeight(widget.height)}
                      ${!widget.visible ? 'bg-gray-200 dark:bg-gray-800 border-dashed' : ''}
                    `}
                  >
                    <CardContent className="p-0 h-full">
                      {widget.visible ? (
                        <div className="h-full pointer-events-none">
                          <WidgetRenderer widget={widget} />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
                          <EyeOff size={32} className="mb-2 opacity-50" />
                          <p className="text-sm font-medium">{widget.title}</p>
                          <p className="text-xs">
                            {WIDGET_TYPE_LABELS[widget.type] || widget.type}
                          </p>
                          <p className="text-xs mt-2">Widget masqué</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Message si aucun widget */}
            {widgets.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun widget configuré</p>
                <Button onClick={() => setIsAddWidgetDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un widget
                </Button>
              </div>
            )}
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
