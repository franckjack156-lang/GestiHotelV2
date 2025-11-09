/**
 * ============================================================================
 * REFERENCE LISTS MANAGER - VERSION FINALE (SANS BOUCLE INFINIE)
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Info,
  Sparkles,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAllReferenceLists, useReferenceList } from '@/shared/hooks/useReferenceLists';
import type {
  ListKey,
  ReferenceItem,
  CreateItemInput,
  PredefinedListKey,
} from '@/shared/types/reference-lists.types';
import { PREDEFINED_LIST_KEYS, LIST_LABELS } from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';
import { TemplateDialog } from './TemplateDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

interface ItemFormData {
  value: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

const SortableItem: React.FC<{
  item: ReferenceItem;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}> = ({ item, onEdit, onToggleActive, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon && (LucideIcons as any)[item.icon];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-4 bg-white border rounded-lg transition-all hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg',
        !item.isActive && 'opacity-50 bg-gray-50'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          item.color ? `bg-${item.color}-100` : 'bg-gray-100'
        )}
      >
        {Icon ? (
          <Icon
            className={cn('h-5 w-5', item.color ? `text-${item.color}-600` : 'text-gray-600')}
          />
        ) : (
          <div className="h-5 w-5 rounded bg-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{item.label}</p>
          <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {item.value}
          </code>
          {!item.isActive && (
            <Badge variant="secondary" className="text-xs">
              Inactif
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 truncate">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0" title="Modifier">
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleActive}
          className="h-8 w-8 p-0"
          title={item.isActive ? 'Désactiver' : 'Activer'}
        >
          {item.isActive ? (
            <EyeOff className="h-4 w-4 text-orange-600" />
          ) : (
            <Eye className="h-4 w-4 text-green-600" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ItemFormDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  initialData?: Partial<ReferenceItem>;
  mode: 'create' | 'edit';
}> = ({ open, onClose, onSubmit, initialData, mode }) => {
  const [formData, setFormData] = useState<ItemFormData>({
    value: initialData?.value || '',
    label: initialData?.label || '',
    color: initialData?.color || 'blue',
    icon: initialData?.icon || '',
    description: initialData?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);

    const newErrors: string[] = [];
    if (!formData.label.trim()) newErrors.push('Le label est obligatoire');
    if (!formData.value.trim()) newErrors.push('La valeur est obligatoire');
    if (!/^[a-z0-9_]+$/.test(formData.value)) {
      newErrors.push('La valeur doit contenir uniquement minuscules, chiffres et underscores');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setErrors([error.message || 'Une erreur est survenue']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = formData.icon && (LucideIcons as any)[formData.icon];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                Ajouter un item
              </>
            ) : (
              <>
                <Edit2 className="h-5 w-5" />
                Modifier l'item
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Créez un nouvel item pour cette liste'
              : 'Modifiez les informations de cet item'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreurs de validation</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">
              Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              placeholder="Ex: Plomberie, Urgent, En cours..."
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              autoFocus
            />
            <p className="text-xs text-gray-500">Texte affiché dans l'interface</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">
              Valeur technique <span className="text-red-500">*</span>
            </Label>
            <Input
              id="value"
              placeholder="Ex: plumbing, urgent, in_progress..."
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
            />
            <p className="text-xs text-gray-500">Minuscules, chiffres et underscores uniquement</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <Select
              value={formData.color}
              onValueChange={value => setFormData({ ...formData, color: value })}
            >
              <SelectTrigger id="color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'gray', label: 'Gris' },
                  { value: 'red', label: 'Rouge' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'yellow', label: 'Jaune' },
                  { value: 'green', label: 'Vert' },
                  { value: 'blue', label: 'Bleu' },
                  { value: 'indigo', label: 'Indigo' },
                  { value: 'purple', label: 'Violet' },
                  { value: 'pink', label: 'Rose' },
                ].map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn('h-4 w-4 rounded', `bg-${color.value}-500`)} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icône (optionnel)</Label>
            <Input
              id="icon"
              placeholder="Ex: Droplet, Zap, Clock..."
              value={formData.icon}
              onChange={e => setFormData({ ...formData, icon: e.target.value })}
            />
            <p className="text-xs text-gray-500">Nom de l'icône Lucide en PascalCase</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description de cet item..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Aperçu</Label>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    `bg-${formData.color}-100`
                  )}
                >
                  {Icon ? (
                    <Icon className={cn('h-5 w-5', `text-${formData.color}-600`)} />
                  ) : (
                    <div className="h-5 w-5 rounded bg-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{formData.label || 'Label'}</p>
                  <code className="text-xs text-gray-500">{formData.value || 'value'}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : mode === 'create' ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Modifier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ReferenceListsManager: React.FC = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();

  const {
    data,
    isLoading: globalLoading,
    error: globalError,
  } = useAllReferenceLists({
    realtime: true,
    autoLoad: true,
  });

  const [selectedListKey, setSelectedListKey] = useState<ListKey>('interventionTypes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const {
    listConfig,
    items,
    activeItems,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    isLoading: listLoading,
    establishmentId,
  } = useReferenceList(selectedListKey);

  const filteredItems = useMemo(() => {
    let filtered = showInactive ? items : activeItems;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.label.toLowerCase().includes(lower) ||
          item.value.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      );
    }

    return filtered.sort((a, b) => a.order - b.order);
  }, [items, activeItems, showInactive, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex(item => item.id === active.id);
    const newIndex = filteredItems.findIndex(item => item.id === over.id);

    const newOrder = arrayMove(filteredItems, oldIndex, newIndex);
    await reorderItems(newOrder.map(item => item.id));
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ReferenceItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (item: ReferenceItem) => {
    try {
      await updateItem(item.id, { isActive: !item.isActive });
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleDelete = async (item: ReferenceItem) => {
    if (!confirm(`Supprimer "${item.label}" ?\n\nCette action est irréversible.`)) return;

    try {
      await deleteItem(item.id);
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleSubmitForm = async (formData: CreateItemInput) => {
    if (editingItem) {
      await updateItem(editingItem.id, formData);
    } else {
      await addItem(formData);
    }
  };

  const handleTemplateSuccess = () => {
    window.location.reload();
  };

  if (globalLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-600">Chargement des listes...</p>
      </div>
    );
  }

  if (globalError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{globalError}</AlertDescription>
      </Alert>
    );
  }

  if (!data?.lists || Object.keys(data.lists).length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Listes non initialisées
            </CardTitle>
            <CardDescription>
              Les listes de référence n'ont pas encore été créées pour cet établissement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowTemplateDialog(true)} size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Initialiser avec un template
            </Button>
          </CardContent>
        </Card>

        <TemplateDialog
          open={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onSuccess={handleTemplateSuccess}
          establishmentId={currentEstablishment?.id || ''}
          userId={user?.id || ''}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listes de référence</h1>
          <p className="text-gray-600 mt-1">
            Configurez les valeurs utilisées dans les formulaires de l'application
          </p>
        </div>
        <Button onClick={() => setShowTemplateDialog(true)} variant="outline" className="gap-2">
          <Sparkles className="h-5 w-5" />
          Templates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une liste</CardTitle>
          <CardDescription>Choisissez la liste que vous souhaitez gérer</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedListKey}
            onValueChange={value => setSelectedListKey(value as ListKey)}
          >
            <SelectTrigger className="w-full text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_LIST_KEYS.filter(key => data.lists[key]).map(key => {
                const list = data.lists[key];
                const activeCount = list?.items.filter(i => i.isActive).length || 0;
                const totalCount = list?.items.length || 0;

                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between w-full">
                      <span>{LIST_LABELS[key as PredefinedListKey]}</span>
                      <Badge variant="secondary" className="ml-2">
                        {activeCount} / {totalCount}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {listConfig?.name || 'Liste'}
                {listConfig && (
                  <Badge variant="outline">
                    {activeItems.length} actif{activeItems.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              {listConfig?.description && (
                <CardDescription className="mt-1">{listConfig.description}</CardDescription>
              )}
            </div>

            <Button onClick={handleAdd} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10"
              />
            </div>

            <Button
              variant={showInactive ? 'default' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
              className="gap-2"
            >
              {showInactive ? (
                <>
                  <Eye className="h-4 w-4" />
                  Tous
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Actifs seulement
                </>
              )}
            </Button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Sparkles className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm
                  ? 'Aucun résultat'
                  : items.length === 0
                    ? 'Liste vide'
                    : 'Aucun item actif'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                {searchTerm
                  ? 'Aucun item ne correspond à votre recherche'
                  : items.length === 0
                    ? "Cette liste ne contient pas encore d'items."
                    : 'Tous les items sont désactivés.'}
              </p>
              {items.length === 0 && (
                <Button onClick={handleAdd} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Ajouter le premier item
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredItems.map(item => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onToggleActive={() => handleToggleActive(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <ItemFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitForm}
        initialData={editingItem || undefined}
        mode={editingItem ? 'edit' : 'create'}
      />

      <TemplateDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSuccess={handleTemplateSuccess}
        establishmentId={currentEstablishment?.id || ''}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default ReferenceListsManager;
