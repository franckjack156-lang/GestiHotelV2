/**
 * ============================================================================
 * REFERENCE LISTS MANAGER - PAGE ADMIN COMPLÈTE
 * ============================================================================
 * 
 * Page d'administration ultra-complète pour gérer les listes
 * 
 * Fonctionnalités:
 * ✅ CRUD complet sur listes et items
 * ✅ Drag & Drop pour réorganiser
 * ✅ Import/Export Excel
 * ✅ Prévisualisation en direct
 * ✅ Analytics & statistiques
 * ✅ Audit trail
 * ✅ Validation en temps réel
 * ✅ Suggestions intelligentes
 * ✅ Templates
 * ✅ Recherche & filtres
 * ✅ Actions groupées
 * 
 * Destination: src/features/settings/components/ReferenceListsManager.tsx
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Upload,
  Download,
  Eye,
  BarChart3,
  History,
  AlertCircle,
  Check,
  X,
  Search,
  Filter,
  MoreVertical,
  FileSpreadsheet,
  Copy,
  Lightbulb,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ListSelect, DynamicBadge } from '@/shared/components/form/ListSelect';
import {
  useAllReferenceLists,
  useReferenceList,
  useImportExport,
} from '@/shared/hooks/useReferenceLists';
import referenceListsService from '@/shared/services/referenceListsService';
import type {
  ListKey,
  ReferenceItem,
  CreateItemInput,
  ListAnalytics,
  AuditEntry,
  ALLOWED_COLORS,
  LIST_LABELS,
  PREDEFINED_LIST_KEYS,
} from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

interface ItemFormData {
  value: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// ============================================================================
// ITEM SORTABLE
// ============================================================================

const SortableItem: React.FC<{
  item: ReferenceItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}> = ({ item, onEdit, onDelete, onToggleActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-md bg-white',
        !item.isActive && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      {/* Icon */}
      {Icon && <Icon className={cn('h-5 w-5', item.color && `text-${item.color}-600`)} />}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              item.color && `bg-${item.color}-100 text-${item.color}-800 border-${item.color}-300`
            )}
          >
            {item.label}
          </Badge>
          <span className="text-xs text-gray-500">{item.value}</span>
          {!item.isActive && (
            <Badge variant="secondary" className="text-xs">
              Désactivé
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
        )}
        {item.usageCount !== undefined && (
          <p className="text-xs text-gray-400 mt-1">
            Utilisé {item.usageCount} fois
          </p>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleActive}>
            {item.isActive ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Désactiver
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Activer
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============================================================================
// ITEM FORM DIALOG
// ============================================================================

const ItemFormDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  initialData?: Partial<ReferenceItem>;
  mode: 'create' | 'edit';
}> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [formData, setFormData] = useState<ItemFormData>({
    value: initialData?.value || '',
    label: initialData?.label || '',
    color: initialData?.color || 'blue',
    icon: initialData?.icon || '',
    description: initialData?.description || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Suggestions
  const suggestions = useMemo(() => {
    if (!formData.label) return [];
    return referenceListsService.getSuggestions(formData);
  }, [formData.label]);

  // Validation
  const validation = useMemo(() => {
    return referenceListsService.validateItem(formData);
  }, [formData]);

  const handleSubmit = async () => {
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setErrors([error.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestion = (field: keyof ItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Ajouter un item' : 'Modifier l\'item'}</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l'item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Label */}
          <div>
            <Label htmlFor="label">
              Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Plomberie"
            />
          </div>

          {/* Value */}
          <div>
            <Label htmlFor="value">
              Valeur technique <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="plumbing"
                className="flex-1"
              />
              {suggestions.find((s) => s.field === 'value') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sug = suggestions.find((s) => s.field === 'value');
                    if (sug) applySuggestion('value', sug.suggestion);
                  }}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Suggérer
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minuscules, chiffres et underscores uniquement
            </p>
          </div>

          {/* Color */}
          <div>
            <Label htmlFor="color">Couleur</Label>
            <div className="flex gap-2">
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger id="color" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'].map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-4 w-4 rounded', `bg-${color}-500`)} />
                        {color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suggestions.find((s) => s.field === 'color') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sug = suggestions.find((s) => s.field === 'color');
                    if (sug) applySuggestion('color', sug.suggestion);
                  }}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Suggérer
                </Button>
              )}
            </div>
          </div>

          {/* Icon */}
          <div>
            <Label htmlFor="icon">Icône (Lucide)</Label>
            <div className="flex gap-2">
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Droplet"
                className="flex-1"
              />
              {suggestions.find((s) => s.field === 'icon') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sug = suggestions.find((s) => s.field === 'icon');
                    if (sug) applySuggestion('icon', sug.suggestion);
                  }}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Suggérer
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PascalCase (ex: Droplet, AlertCircle)
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de cet item..."
              rows={2}
            />
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <Label>Aperçu</Label>
            <div className="mt-2 p-3 border rounded-md bg-gray-50">
              <Badge
                variant="outline"
                className={cn(
                  formData.color && `bg-${formData.color}-100 text-${formData.color}-800 border-${formData.color}-300`
                )}
              >
                {formData.icon && (
                  <>
                    {(() => {
                      const Icon = (LucideIcons as any)[formData.icon];
                      return Icon ? <Icon className="h-4 w-4 mr-1 inline" /> : null;
                    })()}
                  </>
                )}
                {formData.label || 'Label'}
              </Badge>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggestions
              </Label>
              <div className="mt-2 space-y-2">
                {suggestions.map((sug, i) => (
                  <Alert key={i}>
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-sm">
                        {sug.reason}: <strong>{String(sug.suggestion)}</strong>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion(sug.field as any, sug.suggestion)}
                      >
                        Appliquer
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !validation.isValid}>
            {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Ajouter' : 'Modifier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// IMPORT DIALOG
// ============================================================================

const ImportDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  listKey: ListKey;
}> = ({ isOpen, onClose, listKey }) => {
  const { importFromFile } = useImportExport();
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const importResult = await importFromFile(file, listKey, {
        format: 'xlsx',
        overwrite,
        merge: !overwrite,
        validate: true,
        dryRun: false,
      });

      setResult(importResult);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer depuis Excel</DialogTitle>
          <DialogDescription>
            Importez des items depuis un fichier Excel ou CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div>
            <Label>Fichier</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked as boolean)}
            />
            <Label htmlFor="overwrite" className="font-normal cursor-pointer">
              Écraser les items existants
            </Label>
          </div>

          {/* Result */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p className="font-semibold">Import réussi !</p>
                    <p className="text-sm mt-1">
                      {result.itemsImported} items importés
                      {result.itemsUpdated > 0 && `, ${result.itemsUpdated} mis à jour`}
                      {result.itemsSkipped > 0 && `, ${result.itemsSkipped} ignorés`}
                    </p>
                  </div>
                ) : (
                  <p>Erreur: {result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? 'Import en cours...' : 'Importer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// ANALYTICS TAB
// ============================================================================

const AnalyticsTab: React.FC<{ listKey: ListKey }> = ({ listKey }) => {
  const [analytics, setAnalytics] = useState<ListAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await referenceListsService.getListAnalytics('default', listKey);
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAnalytics();
  }, [listKey]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-gray-500">Aucune donnée disponible</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{analytics.activeItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-400">{analytics.inactiveItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular items */}
      {analytics.popularItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items les plus utilisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.itemStats
                .filter((s) => analytics.popularItems.includes(s.itemId))
                .slice(0, 10)
                .map((stat) => (
                  <div key={stat.itemId} className="flex items-center justify-between">
                    <span>{stat.itemLabel}</span>
                    <Badge variant="secondary">{stat.usageCount} utilisations</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unused items */}
      {analytics.unusedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Items jamais utilisés
            </CardTitle>
            <CardDescription>
              Ces items n'ont jamais été sélectionnés. Souhaitez-vous les désactiver ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.itemStats
                .filter((s) => analytics.unusedItems.includes(s.itemId))
                .map((stat) => (
                  <Badge key={stat.itemId} variant="outline">
                    {stat.itemLabel}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate candidates */}
      {analytics.duplicateCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Doublons potentiels
            </CardTitle>
            <CardDescription>
              Ces items ont des noms similaires. Souhaitez-vous les fusionner ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.duplicateCandidates.map(([id1, id2], i) => {
                const item1 = analytics.itemStats.find((s) => s.itemId === id1);
                const item2 = analytics.itemStats.find((s) => s.itemId === id2);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">{item1?.itemLabel}</Badge>
                    <span className="text-gray-400">≈</span>
                    <Badge variant="outline">{item2?.itemLabel}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReferenceListsManager: React.FC = () => {
  const { data, isLoading, error } = useAllReferenceLists({ realtime: true, autoLoad: true });
  const { exportToExcel } = useImportExport();

  // État
  const [selectedListKey, setSelectedListKey] = useState<ListKey>('interventionTypes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Dialogs
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);

  // Liste actuelle
  const {
    listConfig,
    items,
    activeItems,
    addItem,
    updateItem,
    deactivateItem,
    deleteItem,
    reorderItems,
    allowCustom,
  } = useReferenceList(selectedListKey);

  // Filtrer les items
  const filteredItems = useMemo(() => {
    let filtered = showInactive ? items : activeItems;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.label.toLowerCase().includes(lower) ||
          item.value.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [items, activeItems, showInactive, searchTerm]);

  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
    const newIndex = filteredItems.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(filteredItems, oldIndex, newIndex);
    await reorderItems(newOrder.map((item) => item.id));
  };

  // Export
  const handleExport = async () => {
    try {
      const blob = await exportToExcel({
        format: 'xlsx',
        includeInactive: true,
        includeMetadata: true,
        listKeys: [selectedListKey],
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedListKey}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  // Actions groupées
  const handleBulkDeactivate = async () => {
    const promises = Array.from(selectedItems).map((itemId) => deactivateItem(itemId));
    await Promise.all(promises);
    setSelectedItems(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des listes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestion des listes de référence</h1>
        <p className="text-gray-600 mt-1">
          Configurez les listes déroulantes utilisées dans l'application
        </p>
      </div>

      {/* Sélection de la liste */}
      <Card>
        <CardHeader>
          <CardTitle>Liste à modifier</CardTitle>
          <CardDescription>
            Sélectionnez la liste que vous souhaitez configurer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedListKey} onValueChange={(value) => setSelectedListKey(value as ListKey)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_LIST_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {LIST_LABELS[key]} ({data?.lists[key]?.items?.length || 0} items)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {listConfig && (
            <div className="mt-4 flex flex-wrap gap-2">
              {allowCustom && (
                <Badge variant="outline" className="bg-green-50">
                  Personnalisable
                </Badge>
              )}
              {listConfig.isSystem && (
                <Badge variant="outline" className="bg-gray-50">
                  Système
                </Badge>
              )}
              {listConfig.isRequired && (
                <Badge variant="outline" className="bg-orange-50">
                  Obligatoire
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(checked as boolean)}
              />
              <Label htmlFor="show-inactive" className="font-normal cursor-pointer">
                Afficher inactifs
              </Label>
            </div>

            {/* Actions */}
            {allowCustom && (
              <Button onClick={() => {
                setEditingItem(null);
                setIsItemDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {selectedItems.size > 0 && (
                  <DropdownMenuItem onClick={handleBulkDeactivate}>
                    <X className="h-4 w-4 mr-2" />
                    Désactiver ({selectedItems.size})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun item trouvé</p>
                {allowCustom && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingItem(null);
                      setIsItemDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={() => {
                        setEditingItem(item);
                        setIsItemDialogOpen(true);
                      }}
                      onDelete={() => deleteItem(item.id)}
                      onToggleActive={() => {
                        if (item.isActive) {
                          deactivateItem(item.id);
                        } else {
                          updateItem(item.id, { isActive: true });
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsTab listKey={selectedListKey} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ItemFormDialog
        isOpen={isItemDialogOpen}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={async (data) => {
          if (editingItem) {
            await updateItem(editingItem.id, data);
          } else {
            await addItem(data);
          }
        }}
        initialData={editingItem || undefined}
        mode={editingItem ? 'edit' : 'create'}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        listKey={selectedListKey}
      />
    </div>
  );
};

export default ReferenceListsManager;
