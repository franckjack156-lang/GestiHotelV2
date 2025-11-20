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
  // Info, // TODO: Imported but unused
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
import { LIST_LABELS } from '@/shared/types/reference-lists.types';
import { cn } from '@/shared/utils/cn';
import { TemplateDialog } from './TemplateDialog';
import { GenerateFloorsDialog } from './GenerateFloorsDialog';
import { UpdateReferenceImpactDialog } from './UpdateReferenceImpactDialog';
import { updateInterventionsByReferenceValue } from '@/features/interventions/services/updateInterventionsByReference';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

interface ItemFormData {
  value: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// Helper pour gérer les couleurs (Tailwind prédéfinies vs couleurs personnalisées)
const getColorStyles = (color: string) => {
  const isCustomColor = color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl');

  if (isCustomColor) {
    // Couleur personnalisée : utiliser style inline
    return {
      useInlineStyle: true,
      bgStyle: { backgroundColor: `${color}20` }, // Hex + opacité
      iconStyle: { color: color },
      bgClass: '',
      iconClass: '',
    };
  } else {
    // Couleur Tailwind prédéfinie : utiliser les classes
    return {
      useInlineStyle: false,
      bgStyle: {},
      iconStyle: {},
      bgClass: `bg-${color}-100`,
      iconClass: `text-${color}-600`,
    };
  }
};

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = item.icon && (LucideIcons as any)[item.icon];
  const colorStyles = item.color ? getColorStyles(item.color) : null;

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
          colorStyles?.bgClass || 'bg-gray-100'
        )}
        style={colorStyles?.useInlineStyle ? colorStyles.bgStyle : {}}
      >
        {Icon ? (
          <Icon
            className={cn('h-5 w-5', colorStyles?.iconClass || 'text-gray-600')}
            style={colorStyles?.useInlineStyle ? colorStyles.iconStyle : {}}
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

  // ✅ CORRECTION: Mettre à jour formData quand initialData change
  React.useEffect(() => {
    if (open) {
      setFormData({
        value: initialData?.value || '',
        label: initialData?.label || '',
        color: initialData?.color || 'blue',
        icon: initialData?.icon || '',
        description: initialData?.description || '',
      });
      setErrors([]);
    }
  }, [open, initialData]);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrors([error.message || 'Une erreur est survenue']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = formData.icon && (LucideIcons as any)[formData.icon];
  const colorStyles = getColorStyles(formData.color);

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

          <div className="space-y-3">
            <Label htmlFor="color">Couleur</Label>

            {/* Palette de couleurs prédéfinies */}
            <div className="grid grid-cols-6 gap-2 p-3 border rounded-lg bg-gray-50">
              {[
                { value: 'slate', label: 'Ardoise', hex: '#64748b' },
                { value: 'gray', label: 'Gris', hex: '#6b7280' },
                { value: 'zinc', label: 'Zinc', hex: '#71717a' },
                { value: 'red', label: 'Rouge', hex: '#ef4444' },
                { value: 'orange', label: 'Orange', hex: '#f97316' },
                { value: 'amber', label: 'Ambre', hex: '#f59e0b' },
                { value: 'yellow', label: 'Jaune', hex: '#eab308' },
                { value: 'lime', label: 'Citron', hex: '#84cc16' },
                { value: 'green', label: 'Vert', hex: '#22c55e' },
                { value: 'emerald', label: 'Émeraude', hex: '#10b981' },
                { value: 'teal', label: 'Sarcelle', hex: '#14b8a6' },
                { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
                { value: 'sky', label: 'Ciel', hex: '#0ea5e9' },
                { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
                { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
                { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
                { value: 'purple', label: 'Pourpre', hex: '#a855f7' },
                { value: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
                { value: 'pink', label: 'Rose', hex: '#ec4899' },
                { value: 'rose', label: 'Rose pâle', hex: '#f43f5e' },
              ].map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={cn(
                    'group relative h-10 w-10 rounded-lg transition-all hover:scale-110 hover:shadow-lg',
                    formData.color === color.value && 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {formData.color === color.value && (
                    <CheckCircle2 className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
                  )}
                </button>
              ))}
            </div>

            {/* Sélecteur de couleur personnalisé */}
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
              <div className="flex items-center gap-2 flex-1">
                <label
                  htmlFor="custom-color"
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="relative">
                    <input
                      id="custom-color"
                      type="color"
                      value={formData.color.startsWith('#') ? formData.color : '#3b82f6'}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-10 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Couleur personnalisée</span>
                    <span className="text-xs text-gray-500">
                      {formData.color.startsWith('#')
                        ? formData.color.toUpperCase()
                        : 'Cliquez pour choisir'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Champ texte pour entrer manuellement un code couleur */}
              <Input
                placeholder="#3b82f6"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="w-32 font-mono text-sm"
                maxLength={20}
              />
            </div>

            <p className="text-xs text-gray-500">
              Utilisez les couleurs prédéfinies, le sélecteur de couleur, ou entrez un code couleur
              (ex: #3b82f6, blue, rgb(59, 130, 246))
            </p>
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
                    colorStyles.bgClass
                  )}
                  style={colorStyles.useInlineStyle ? colorStyles.bgStyle : {}}
                >
                  {Icon ? (
                    <Icon
                      className={cn('h-5 w-5', colorStyles.iconClass)}
                      style={colorStyles.useInlineStyle ? colorStyles.iconStyle : {}}
                    />
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
  const [listSearchTerm, setListSearchTerm] = useState(''); // Recherche dans les listes
  const [showInactive, setShowInactive] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showGenerateFloorsDialog, setShowGenerateFloorsDialog] = useState(false);
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    itemId: string;
    formData: CreateItemInput;
    oldValue: string;
    newValue: string;
  } | null>(null);

  const {
    listConfig,
    items,
    activeItems,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    // TODO: listLoading and establishmentId unused
    // isLoading: listLoading,
    // establishmentId,
  } = useReferenceList(selectedListKey);

  // Filtrer et trier les listes alphabétiquement
  const filteredListKeys = useMemo(() => {
    if (!data?.lists) return [];

    // ✅ CORRECTION: Afficher TOUTES les listes (prédéfinies + dynamiques)
    let keys = Object.keys(data.lists) as ListKey[];

    // Filtrer par recherche
    if (listSearchTerm) {
      const lower = listSearchTerm.toLowerCase();
      keys = keys.filter(key => {
        // Utiliser le label prédéfini si disponible, sinon le nom de la liste
        const label = LIST_LABELS[key as PredefinedListKey] || data.lists[key]?.name || key;
        return label.toLowerCase().includes(lower);
      });
    }

    // Trier alphabétiquement par label
    return keys.sort((a, b) => {
      const labelA = LIST_LABELS[a as PredefinedListKey] || a;
      const labelB = LIST_LABELS[b as PredefinedListKey] || b;
      return labelA.localeCompare(labelB, 'fr');
    });
  }, [data?.lists, listSearchTerm]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleDelete = async (item: ReferenceItem) => {
    if (!confirm(`Supprimer "${item.label}" ?\n\nCette action est irréversible.`)) return;

    try {
      await deleteItem(item.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleSubmitForm = async (formData: CreateItemInput) => {
    if (editingItem) {
      // Vérifier si la valeur technique a changé
      const hasValueChanged = editingItem.value !== formData.value;

      console.log('🔍 Form submission:', {
        hasValueChanged,
        oldValue: editingItem.value,
        newValue: formData.value,
        oldLabel: editingItem.label,
        newLabel: formData.label,
        listKey: selectedListKey,
      });

      if (hasValueChanged) {
        // La VALUE a changé : afficher le dialog d'impact
        console.log('✅ Showing impact dialog (value changed)');

        setPendingUpdate({
          itemId: editingItem.id,
          formData,
          oldValue: editingItem.value,
          newValue: formData.value,
        });
        setShowImpactDialog(true);
        // Ne pas fermer le dialog principal immédiatement
      } else {
        // Seulement le label a changé (ou rien) : mise à jour directe
        // Les interventions utilisent la value, donc le nouveau label s'affichera automatiquement
        console.log('➡️ Direct update (no value change, label will update automatically)');
        await updateItem(editingItem.id, formData);
        setIsDialogOpen(false);
      }
    } else {
      await addItem(formData);
      setIsDialogOpen(false);
    }
  };

  const handleTemplateSuccess = () => {
    window.location.reload();
  };

  const handleConfirmImpactUpdate = async (updateInterventions: boolean) => {
    if (!pendingUpdate) return;

    const { itemId, formData, oldValue, newValue } = pendingUpdate;

    try {
      // 1. Mettre à jour l'élément de la liste
      await updateItem(itemId, formData);

      // 2. Si demandé, mettre à jour les interventions en cascade
      if (updateInterventions && user && currentEstablishment) {
        console.log('🔄 Updating interventions:', {
          oldValue,
          newValue,
          listKey: selectedListKey,
        });

        await updateInterventionsByReferenceValue({
          establishmentId: currentEstablishment.id,
          listKey: selectedListKey,
          oldValue,
          newValue,
          userId: user.id,
        });
      }

      // Fermer les dialogs
      setShowImpactDialog(false);
      setIsDialogOpen(false);
      setPendingUpdate(null);
    } catch (error) {
      console.error('Error updating reference with cascade:', error);
      throw error;
    }
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
        <CardContent className="space-y-4">
          {/* Barre de recherche pour les listes */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={listSearchTerm}
              onChange={e => setListSearchTerm(e.target.value)}
              placeholder="Rechercher une liste..."
              className="pl-10"
            />
          </div>

          <Select
            value={selectedListKey}
            onValueChange={value => setSelectedListKey(value as ListKey)}
          >
            <SelectTrigger className="w-full text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredListKeys.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Aucune liste trouvée</div>
              ) : (
                filteredListKeys.map(key => {
                  const list = data.lists[key];
                  const activeCount = list?.items.filter(i => i.isActive).length || 0;
                  const totalCount = list?.items.length || 0;

                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{LIST_LABELS[key as PredefinedListKey] || list?.name || key}</span>
                        <Badge variant="secondary" className="ml-2">
                          {activeCount} / {totalCount}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })
              )}
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

            <div className="flex items-center gap-2">
              {/* Bouton Générer pour les étages */}
              {selectedListKey === 'floors' && (
                <Button
                  onClick={() => setShowGenerateFloorsDialog(true)}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Générer automatiquement
                </Button>
              )}

              <Button onClick={handleAdd} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Ajouter un item
              </Button>
            </div>
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

      <GenerateFloorsDialog
        open={showGenerateFloorsDialog}
        onClose={() => setShowGenerateFloorsDialog(false)}
        establishmentId={currentEstablishment?.id || ''}
        userId={user?.id || ''}
        defaultTotalFloors={currentEstablishment?.totalFloors || 0}
        onSuccess={handleTemplateSuccess}
      />

      {pendingUpdate && (
        <UpdateReferenceImpactDialog
          isOpen={showImpactDialog}
          onClose={() => {
            setShowImpactDialog(false);
            setPendingUpdate(null);
          }}
          onConfirm={handleConfirmImpactUpdate}
          establishmentId={currentEstablishment?.id || ''}
          listKey={selectedListKey}
          oldValue={pendingUpdate.oldValue}
          newValue={pendingUpdate.newValue}
          itemLabel={pendingUpdate.formData.label}
        />
      )}
    </div>
  );
};

export default ReferenceListsManager;
