/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CustomizeDashboardDialog Component
 *
 * Dialogue pour personnaliser le dashboard
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type {
  DashboardPreferences,
  WidgetConfig,
  WidgetType,
  WidgetDataSource,
} from '../types/dashboard.types';
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Download,
  Upload,
  GripVertical,
  Palette,
  Save,
  Check,
  Edit,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { ThemeColorEditor } from './ThemeColorEditor';
import type { ColorPalette, DashboardTheme } from '../types/theme.types';
import { defaultTheme } from '../config/presetThemes';
import { logger } from '@/core/utils/logger';

interface CustomizeDashboardDialogProps {
  open: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
  onUpdatePreferences: (updates: Partial<DashboardPreferences>) => Promise<void>;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => Promise<void>;
  onRemoveWidget: (widgetId: string) => Promise<void>;
}

const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  stats_card: 'Carte statistique',
  line_chart: 'Graphique linéaire',
  bar_chart: 'Graphique en barres',
  pie_chart: 'Camembert',
  area_chart: 'Graphique en aire',
  donut_chart: 'Donut',
  table: 'Tableau',
  calendar: 'Calendrier',
  list: 'Liste',
  clock: 'Horloge',
  quick_links: 'Liens rapides',
  button_grid: 'Grille de boutons',
  iframe: 'Page web',
  custom_list: 'Liste personnalisée',
  note: 'Note',
  weather: 'Météo',
};

const DATA_SOURCE_LABELS: Record<WidgetDataSource, string> = {
  interventions_by_status: 'Interventions par statut',
  interventions_by_priority: 'Interventions par priorité',
  interventions_by_type: 'Interventions par type',
  interventions_by_room: 'Interventions par chambre',
  interventions_by_technician: 'Interventions par technicien',
  interventions_timeline: 'Évolution des interventions',
  interventions_completion_rate: 'Taux de complétion',
  sla_compliance: 'Conformité SLA',
  response_time_avg: 'Temps de réponse moyen',
  recent_interventions: 'Interventions récentes',
  overdue_interventions: 'Interventions en retard',
  upcoming_interventions: 'Interventions à venir',
  rooms_status: 'Statut des chambres',
  rooms_by_type: 'Chambres par type',
  rooms_by_status: 'Chambres par statut',
  blockages_active: 'Blocages actifs',
  completion_rate: 'Taux de complétion',
  urgent_interventions: 'Interventions urgentes',
  avg_response_time: 'Temps de réponse moyen',
  status_distribution: 'Distribution des statuts',
  technician_performance: 'Performance techniciens',
  // Nouveaux widgets
  resolution_rate: 'Taux de résolution',
  location_stats: 'Stats par localisation',
  interventions_by_floor: 'Interventions par étage',
  interventions_by_building: 'Interventions par bâtiment',
  pending_validation: 'En attente de validation',
  problematic_rooms: 'Chambres problématiques',
  today_scheduled: "Planifiées aujourd'hui",
  custom: 'Personnalisé',
  static: 'Statique',
};

const WIDGET_TYPE_OPTIONS: { value: WidgetType; label: string }[] = [
  { value: 'stats_card', label: 'Carte statistique' },
  { value: 'line_chart', label: 'Graphique linéaire' },
  { value: 'bar_chart', label: 'Graphique en barres' },
  { value: 'pie_chart', label: 'Camembert' },
  { value: 'area_chart', label: 'Graphique en aire' },
];

const DATA_SOURCE_OPTIONS: { value: WidgetDataSource; label: string }[] = [
  { value: 'interventions_by_status', label: 'Interventions par statut' },
  { value: 'interventions_by_priority', label: 'Interventions par priorité' },
  { value: 'interventions_by_type', label: 'Interventions par type' },
  { value: 'interventions_by_technician', label: 'Interventions par technicien' },
  { value: 'interventions_timeline', label: 'Évolution des interventions' },
  { value: 'interventions_completion_rate', label: 'Taux de complétion' },
  { value: 'sla_compliance', label: 'Conformité SLA' },
];

export const CustomizeDashboardDialog = ({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
  onUpdateWidget,
  onRemoveWidget,
}: CustomizeDashboardDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWidget, setNewWidget] = useState<{
    title: string;
    type: WidgetType;
    dataSource: WidgetDataSource;
  }>({
    title: '',
    type: 'stats_card',
    dataSource: 'interventions_by_status',
  });
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Hook de gestion des thèmes
  const {
    activeTheme,
    availableThemes,
    changeTheme,
    exportTheme: exportThemeData,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
  } = useTheme();

  // États pour l'édition de thème
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DashboardTheme | null>(null);
  const [customColors, setCustomColors] = useState<ColorPalette>(defaultTheme.colors);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');

  const handleUpdatePreferences = async (updates: Partial<DashboardPreferences>) => {
    setIsSaving(true);
    try {
      await onUpdatePreferences(updates);
      toast.success('Préférences mises à jour');
    } catch (error: unknown) {
      toast.error('Erreur lors de la mise à jour');
      logger.error('Error updating preferences', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWidget = async (widgetId: string, visible: boolean) => {
    try {
      await onUpdateWidget(widgetId, { visible });
      toast.success(visible ? 'Widget activé' : 'Widget masqué');
    } catch (error: unknown) {
      toast.error('Erreur lors de la mise à jour');
      logger.error('Error toggling widget', error);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce widget ?')) return;

    try {
      await onRemoveWidget(widgetId);
      toast.success('Widget supprimé');
    } catch (error: unknown) {
      toast.error('Erreur lors de la suppression');
      logger.error('Error removing widget', error);
    }
  };

  const handleAddWidget = async () => {
    if (!newWidget.title.trim()) {
      toast.error('Veuillez saisir un titre pour le widget');
      return;
    }

    try {
      const widget: Omit<WidgetConfig, 'id'> = {
        title: newWidget.title,
        type: newWidget.type,
        dataSource: newWidget.dataSource,
        visible: true,
        position: { row: preferences.widgets.length, col: 0 },
        size: 'medium',
        refreshInterval: 300,
      };

      const widgetId = 'widget_' + Date.now().toString();
      const updatedWidgets = [...preferences.widgets, { ...widget, id: widgetId } as WidgetConfig];

      await onUpdatePreferences({ widgets: updatedWidgets });
      toast.success('Widget ajouté');
      setShowAddWidget(false);
      setNewWidget({ title: '', type: 'stats_card', dataSource: 'interventions_by_status' });
    } catch (error: unknown) {
      toast.error("Erreur lors de l'ajout du widget");
      logger.error('Error adding widget', error);
    }
  };

  const handleExportConfig = () => {
    const config = {
      preferences,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = 'dashboard-config-' + dateStr + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Configuration exportée');
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      if (!config.preferences) {
        throw new Error('Format de fichier invalide');
      }

      await onUpdatePreferences(config.preferences);
      toast.success('Configuration importée');
    } catch (error: unknown) {
      toast.error("Erreur lors de l'import");
      logger.error('Error importing config', error);
    }

    event.target.value = '';
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const widgets = [...preferences.widgets];
    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const removed = widgets.splice(draggedIndex, 1)[0];
    widgets.splice(targetIndex, 0, removed);

    widgets.forEach((widget, index) => {
      widget.position.row = index;
    });

    onUpdatePreferences({ widgets });
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  // Handlers pour la gestion des thèmes personnalisés
  const handleCreateTheme = () => {
    setIsCreatingTheme(true);
    setEditingTheme(null);
    setCustomColors(defaultTheme.colors);
    setThemeName('');
    setThemeDescription('');
  };

  const handleEditTheme = (theme: DashboardTheme) => {
    setEditingTheme(theme);
    setIsCreatingTheme(true);
    setCustomColors(theme.colors);
    setThemeName(theme.name);
    setThemeDescription(theme.description);
  };

  const handleDuplicateTheme = async (theme: DashboardTheme) => {
    try {
      const duplicated = await duplicateTheme(theme.id);
      if (duplicated) {
        toast.success(`Thème "${duplicated.name}" dupliqué`);
        handleEditTheme(duplicated);
      }
    } catch (error: unknown) {
      toast.error('Erreur lors de la duplication');
      logger.error('Error duplicating theme', error);
    }
  };

  const handleSaveCustomTheme = async () => {
    if (!themeName.trim()) {
      toast.error('Veuillez saisir un nom pour le thème');
      return;
    }

    try {
      setIsSaving(true);
      if (editingTheme) {
        // Mise à jour d'un thème existant
        await updateCustomTheme(editingTheme.id, {
          name: themeName,
          description: themeDescription,
          colors: customColors,
        });
        toast.success('Thème mis à jour');
      } else {
        // Création d'un nouveau thème
        const newTheme = await createCustomTheme({
          name: themeName,
          description: themeDescription,
          colors: customColors,
          isCustom: true,
        });
        if (newTheme) {
          toast.success('Thème créé avec succès');
        }
      }
      setIsCreatingTheme(false);
      setEditingTheme(null);
    } catch (error: unknown) {
      toast.error('Erreur lors de la sauvegarde');
      logger.error('Error saving theme', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelThemeEdit = () => {
    setIsCreatingTheme(false);
    setEditingTheme(null);
    setCustomColors(defaultTheme.colors);
    setThemeName('');
    setThemeDescription('');
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) {
      return;
    }

    try {
      await deleteCustomTheme(themeId);
      toast.success('Thème supprimé');
      if (editingTheme?.id === themeId) {
        handleCancelThemeEdit();
      }
    } catch (error: unknown) {
      toast.error('Erreur lors de la suppression');
      logger.error('Error deleting theme', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personnaliser le dashboard</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Configurez l'apparence et le comportement de votre dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Layout */}
                <div className="space-y-2">
                  <Label>Disposition</Label>
                  <Select
                    value={preferences.layout}
                    onValueChange={(value: 'grid' | 'list') =>
                      handleUpdatePreferences({ layout: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grille</SelectItem>
                      <SelectItem value="list">Liste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Colonnes */}
                {preferences.layout === 'grid' && (
                  <div className="space-y-2">
                    <Label>Nombre de colonnes</Label>
                    <Select
                      value={preferences.columns.toString()}
                      onValueChange={value => handleUpdatePreferences({ columns: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 colonnes</SelectItem>
                        <SelectItem value="3">3 colonnes</SelectItem>
                        <SelectItem value="4">4 colonnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Plage de dates par défaut */}
                <div className="space-y-2">
                  <Label>Plage de dates par défaut</Label>
                  <Select
                    value={preferences.defaultDateRange}
                    onValueChange={(value: any) =>
                      handleUpdatePreferences({ defaultDateRange: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-refresh */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actualisation automatique</Label>
                    <p className="text-sm text-gray-500">Rafraîchir les données automatiquement</p>
                  </div>
                  <Switch
                    checked={preferences.autoRefresh}
                    onCheckedChange={checked => handleUpdatePreferences({ autoRefresh: checked })}
                  />
                </div>

                {/* Refresh interval */}
                {preferences.autoRefresh && (
                  <div className="space-y-2">
                    <Label>Intervalle de rafraîchissement (secondes)</Label>
                    <Input
                      type="number"
                      min={60}
                      max={3600}
                      value={preferences.refreshInterval}
                      onChange={e =>
                        handleUpdatePreferences({
                          refreshInterval: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Widgets */}
          <TabsContent value="widgets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des widgets</CardTitle>
                    <CardDescription>
                      Activez, masquez, réorganisez ou supprimez les widgets
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddWidget(!showAddWidget)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formulaire d'ajout de widget */}
                {showAddWidget && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Titre du widget</Label>
                        <Input
                          value={newWidget.title}
                          onChange={e => setNewWidget({ ...newWidget, title: e.target.value })}
                          placeholder="Ex: Statistiques mensuelles"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type de widget</Label>
                          <Select
                            value={newWidget.type}
                            onValueChange={(value: WidgetType) =>
                              setNewWidget({ ...newWidget, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {WIDGET_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Source de données</Label>
                          <Select
                            value={newWidget.dataSource}
                            onValueChange={(value: WidgetDataSource) =>
                              setNewWidget({ ...newWidget, dataSource: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATA_SOURCE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddWidget} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Ajouter le widget
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddWidget(false)} size="sm">
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Liste des widgets avec drag & drop */}
                <div className="space-y-2">
                  {preferences.widgets.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Aucun widget. Cliquez sur "Ajouter" pour créer votre premier widget.
                    </p>
                  ) : (
                    preferences.widgets.map(widget => (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={() => handleDragStart(widget.id)}
                        onDragOver={e => handleDragOver(e, widget.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                          draggedWidget === widget.id
                            ? 'opacity-50'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{widget.title}</p>
                          <p className="text-sm text-gray-500">
                            {WIDGET_TYPE_LABELS[widget.type]} •{' '}
                            {DATA_SOURCE_LABELS[widget.dataSource]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleWidget(widget.id, !widget.visible)}
                          >
                            {widget.visible ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWidget(widget.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Avancé */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export / Import de configuration</CardTitle>
                <CardDescription>
                  Sauvegardez ou restaurez votre configuration de dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleExportConfig} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter la configuration
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      id="import-config"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="import-config" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer une configuration
                      </label>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  L'export permet de sauvegarder vos widgets et préférences. Vous pouvez ensuite les
                  restaurer ou les partager avec d'autres utilisateurs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Palette className="w-5 h-5 inline mr-2" />
                  Thèmes et apparence
                </CardTitle>
                <CardDescription>
                  Choisissez un thème pour personnaliser l'apparence de votre dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thème actif */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Thème actif</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                        {activeTheme.name}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        {activeTheme.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportThemeData(activeTheme)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>

                {/* Grille des thèmes disponibles */}
                <div>
                  <Label className="mb-3 block">Thèmes disponibles</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableThemes.map(theme => (
                      <button
                        key={theme.id}
                        onClick={async () => {
                          try {
                            await changeTheme(theme.id);
                            toast.success(`Thème "${theme.name}" appliqué`);
                          } catch (error) {
                            toast.error('Erreur lors du changement de thème');
                          }
                        }}
                        className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                          activeTheme.id === theme.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {/* Indicateur de thème actif */}
                        {activeTheme.id === theme.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}

                        {/* Nom du thème */}
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {theme.name}
                        </p>

                        {/* Badge personnalisé */}
                        {theme.isCustom && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded mb-2">
                            Personnalisé
                          </span>
                        )}

                        {/* Palette de couleurs */}
                        <div className="flex gap-1 mt-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.colors.primary }}
                            title="Primaire"
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.colors.secondary }}
                            title="Secondaire"
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.colors.accent }}
                            title="Accent"
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.colors.success }}
                            title="Succès"
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.colors.chart.color1 }}
                            title="Graphique 1"
                          />
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                          {theme.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions pour gérer les thèmes */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Thèmes personnalisés
                    </p>
                    <Button size="sm" onClick={handleCreateTheme}>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un thème
                    </Button>
                  </div>

                  {/* Liste des thèmes personnalisés avec actions */}
                  {availableThemes.filter(t => t.isCustom).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {availableThemes
                        .filter(t => t.isCustom)
                        .map(theme => (
                          <div
                            key={theme.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {theme.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {theme.description}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTheme(theme)}
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicateTheme(theme)}
                                title="Dupliquer"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTheme(theme.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Éditeur de thème personnalisé */}
            {isCreatingTheme && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingTheme ? `Modifier "${editingTheme.name}"` : 'Créer un nouveau thème'}
                  </CardTitle>
                  <CardDescription>Personnalisez les couleurs de votre dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nom et description du thème */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du thème</Label>
                      <Input
                        value={themeName}
                        onChange={e => setThemeName(e.target.value)}
                        placeholder="Ex: Mon thème personnalisé"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={themeDescription}
                        onChange={e => setThemeDescription(e.target.value)}
                        placeholder="Ex: Couleurs vives et modernes"
                      />
                    </div>
                  </div>

                  {/* Éditeur de couleurs */}
                  <ThemeColorEditor
                    colors={customColors}
                    onColorsChange={setCustomColors}
                    onReset={() => setCustomColors(defaultTheme.colors)}
                    defaultColors={defaultTheme.colors}
                  />

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelThemeEdit} disabled={isSaving}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveCustomTheme} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTheme ? 'Mettre à jour' : 'Créer le thème'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
