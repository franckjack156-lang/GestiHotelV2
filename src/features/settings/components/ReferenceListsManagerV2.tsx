/**
 * ============================================================================
 * REFERENCE LISTS MANAGER V2 - INTERFACE MODERNISÉE
 * ============================================================================
 *
 * Nouvelle interface avec :
 * - Layout split-view (sidebar + panel principal)
 * - Listes groupées par catégories
 * - Sélecteur d'icônes visuel
 * - Actions rapides et bulk operations
 * - Meilleure UX globale
 */

import React, { useState, useMemo, useCallback } from 'react';
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
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { IconPicker } from '@/shared/components/ui/icon-picker';
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
  Sparkles,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Wrench,
  Building2,
  Users,
  FileText,
  Tag,
  Layers,
  Package,
  Palette,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

// ============================================================================
// TYPES & CONSTANTES
// ============================================================================

interface ItemFormData {
  value: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

// Catégories de listes pour une meilleure organisation
const LIST_CATEGORIES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; keys: PredefinedListKey[] }
> = {
  interventions: {
    label: 'Interventions',
    icon: Wrench,
    keys: [
      'interventionTypes',
      'interventionCategories',
      'interventionPriorities',
      'interventionStatuses',
      'interventionLocations',
    ],
  },
  localization: {
    label: 'Localisation',
    icon: Building2,
    keys: ['floors', 'buildings'],
  },
  rooms: {
    label: 'Chambres',
    icon: Layers,
    keys: ['roomTypes', 'roomStatuses', 'bedTypes'],
  },
  equipment: {
    label: 'Équipements',
    icon: Package,
    keys: ['equipmentTypes', 'equipmentBrands', 'equipmentLocations'],
  },
  staff: {
    label: 'Personnel',
    icon: Users,
    keys: ['staffRoles', 'staffDepartments', 'staffSkills', 'technicalSpecialties'],
  },
  suppliers: {
    label: 'Fournisseurs',
    icon: Tag,
    keys: ['supplierCategories', 'supplierTypes'],
  },
  documents: {
    label: 'Documents & Finance',
    icon: FileText,
    keys: ['documentCategories', 'documentTypes', 'expenseCategories', 'paymentMethods'],
  },
  maintenance: {
    label: 'Maintenance préventive',
    icon: Sparkles,
    keys: ['maintenanceFrequencies', 'maintenanceTypes'],
  },
};

// Couleurs prédéfinies avec aperçu
const PRESET_COLORS = [
  { value: 'slate', hex: '#64748b', label: 'Ardoise' },
  { value: 'gray', hex: '#6b7280', label: 'Gris' },
  { value: 'red', hex: '#ef4444', label: 'Rouge' },
  { value: 'orange', hex: '#f97316', label: 'Orange' },
  { value: 'amber', hex: '#f59e0b', label: 'Ambre' },
  { value: 'yellow', hex: '#eab308', label: 'Jaune' },
  { value: 'lime', hex: '#84cc16', label: 'Citron' },
  { value: 'green', hex: '#22c55e', label: 'Vert' },
  { value: 'emerald', hex: '#10b981', label: 'Émeraude' },
  { value: 'teal', hex: '#14b8a6', label: 'Sarcelle' },
  { value: 'cyan', hex: '#06b6d4', label: 'Cyan' },
  { value: 'sky', hex: '#0ea5e9', label: 'Ciel' },
  { value: 'blue', hex: '#3b82f6', label: 'Bleu' },
  { value: 'indigo', hex: '#6366f1', label: 'Indigo' },
  { value: 'violet', hex: '#8b5cf6', label: 'Violet' },
  { value: 'purple', hex: '#a855f7', label: 'Pourpre' },
  { value: 'fuchsia', hex: '#d946ef', label: 'Fuchsia' },
  { value: 'pink', hex: '#ec4899', label: 'Rose' },
  { value: 'rose', hex: '#f43f5e', label: 'Rose vif' },
];

// Helper pour gérer les couleurs
const getColorStyles = (color: string) => {
  const isCustomColor =
    color?.startsWith('#') || color?.startsWith('rgb') || color?.startsWith('hsl');
  const preset = PRESET_COLORS.find(c => c.value === color);

  if (isCustomColor) {
    return {
      useInlineStyle: true,
      bgStyle: { backgroundColor: `${color}20` },
      iconStyle: { color: color },
      bgClass: '',
      iconClass: '',
      hex: color,
    };
  } else if (preset) {
    return {
      useInlineStyle: false,
      bgStyle: {},
      iconStyle: {},
      bgClass: `bg-${color}-100`,
      iconClass: `text-${color}-600`,
      hex: preset.hex,
    };
  } else {
    return {
      useInlineStyle: false,
      bgStyle: {},
      iconStyle: {},
      bgClass: 'bg-gray-100',
      iconClass: 'text-gray-600',
      hex: '#6b7280',
    };
  }
};

// ============================================================================
// COMPOSANT SIDEBAR - Liste des catégories et listes
// ============================================================================

interface ListSidebarProps {
  data: Record<string, { items: ReferenceItem[]; name?: string }>;
  selectedListKey: ListKey;
  onSelectList: (key: ListKey) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ListSidebar: React.FC<ListSidebarProps> = ({
  data,
  selectedListKey,
  onSelectList,
  searchTerm,
  onSearchChange,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // Par défaut, toutes les catégories sont ouvertes
    return Object.keys(LIST_CATEGORIES).reduce((acc, key) => ({ ...acc, [key]: true }), {});
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Filtrer les listes par recherche
  const filterLists = useCallback(
    (keys: PredefinedListKey[]) => {
      if (!searchTerm) return keys.filter(key => data[key]);

      const lower = searchTerm.toLowerCase();
      return keys.filter(key => {
        if (!data[key]) return false;
        const label = LIST_LABELS[key] || data[key]?.name || key;
        return label.toLowerCase().includes(lower);
      });
    },
    [data, searchTerm]
  );

  return (
    <div className="w-72 border-r bg-gray-50/50 flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher une liste..."
            className="pl-9 h-9 bg-gray-50"
          />
        </div>
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {Object.entries(LIST_CATEGORIES).map(([categoryKey, category]) => {
            const filteredKeys = filterLists(category.keys);
            if (filteredKeys.length === 0) return null;

            const CategoryIcon = category.icon;
            const isExpanded = expandedCategories[categoryKey];

            return (
              <div key={categoryKey} className="mb-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                  <CategoryIcon className="h-4 w-4 text-gray-500" />
                  <span className="flex-1 text-left">{category.label}</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {filteredKeys.length}
                  </Badge>
                </button>

                {/* Lists in Category */}
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-gray-200">
                    {filteredKeys.map(key => {
                      const list = data[key];
                      const activeCount = list?.items.filter(i => i.isActive).length || 0;
                      const totalCount = list?.items.length || 0;
                      const isSelected = selectedListKey === key;

                      return (
                        <button
                          key={key}
                          onClick={() => onSelectList(key)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                            isSelected
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <span className="flex-1 truncate">
                            {LIST_LABELS[key] || list?.name || key}
                          </span>
                          <span
                            className={cn(
                              'text-xs',
                              isSelected ? 'text-blue-600' : 'text-gray-400'
                            )}
                          >
                            {activeCount}/{totalCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

// ============================================================================
// COMPOSANT ITEM SORTABLE
// ============================================================================

interface SortableItemProps {
  item: ReferenceItem;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  onEdit,
  onToggleActive,
  onDelete,
  onDuplicate,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon
    ? (
        LucideIcons as unknown as Record<
          string,
          React.ComponentType<{ className?: string; style?: React.CSSProperties }>
        >
      )[item.icon]
    : null;
  const colorStyles = item.color ? getColorStyles(item.color) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-3 bg-white border rounded-lg transition-all',
        'hover:shadow-md hover:border-gray-300',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-500',
        !item.isActive && 'opacity-60 bg-gray-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
          colorStyles?.bgClass || 'bg-gray-100'
        )}
        style={colorStyles?.useInlineStyle ? colorStyles.bgStyle : {}}
      >
        {Icon ? (
          <Icon
            className={cn('h-4 w-4', colorStyles?.iconClass || 'text-gray-600')}
            style={colorStyles?.useInlineStyle ? colorStyles.iconStyle : {}}
          />
        ) : (
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: colorStyles?.hex || '#6b7280' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{item.label}</span>
          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
            {item.value}
          </code>
          {!item.isActive && (
            <Badge variant="secondary" className="text-xs bg-gray-200">
              Inactif
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0" title="Modifier">
          <Edit2 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {item.isActive ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2 text-orange-600" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2 text-green-600" />
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
    </div>
  );
};

// ============================================================================
// DIALOGUE FORMULAIRE ITEM
// ============================================================================

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  initialData?: Partial<ReferenceItem>;
  mode: 'create' | 'edit';
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState<ItemFormData>({
    value: '',
    label: '',
    color: 'blue',
    icon: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Réinitialiser le formulaire quand le dialog s'ouvre
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

  // Auto-générer la valeur technique depuis le label
  const handleLabelChange = (label: string) => {
    setFormData(prev => {
      const autoValue =
        mode === 'create' && !prev.value
          ? label
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_|_$/g, '')
          : prev.value;

      return { ...prev, label, value: autoValue };
    });
  };

  const handleSubmit = async () => {
    setErrors([]);

    const newErrors: string[] = [];
    if (!formData.label.trim()) newErrors.push('Le label est obligatoire');
    if (!formData.value.trim()) newErrors.push('La valeur technique est obligatoire');
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setErrors([message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = formData.icon
    ? (
        LucideIcons as unknown as Record<
          string,
          React.ComponentType<{ className?: string; style?: React.CSSProperties }>
        >
      )[formData.icon]
    : null;
  const colorStyles = getColorStyles(formData.color);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                Ajouter un item
              </>
            ) : (
              <>
                <Edit2 className="h-5 w-5 text-blue-600" />
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

        <div className="space-y-4 py-2">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreurs</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="label">
              Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              placeholder="Ex: Plomberie, Urgent, En cours..."
              value={formData.label}
              onChange={e => handleLabelChange(e.target.value)}
              autoFocus
            />
          </div>

          {/* Valeur technique */}
          <div className="space-y-1.5">
            <Label htmlFor="value">
              Valeur technique <span className="text-red-500">*</span>
            </Label>
            <Input
              id="value"
              placeholder="Ex: plumbing, urgent, in_progress..."
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">Minuscules, chiffres et underscores uniquement</p>
          </div>

          {/* Couleur et Icône sur la même ligne */}
          <div className="grid grid-cols-2 gap-4">
            {/* Couleur */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleur
              </Label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.slice(0, 10).map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'h-8 w-8 rounded-lg transition-all hover:scale-110',
                      formData.color === color.value && 'ring-2 ring-offset-2 ring-gray-900'
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                {PRESET_COLORS.slice(10).map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'h-8 w-8 rounded-lg transition-all hover:scale-110',
                      formData.color === color.value && 'ring-2 ring-offset-2 ring-gray-900'
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Icône */}
            <div className="space-y-1.5">
              <Label>Icône</Label>
              <IconPicker
                value={formData.icon}
                onChange={icon => setFormData({ ...formData, icon })}
                placeholder="Choisir..."
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description de cet item..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Aperçu */}
          <div className="space-y-1.5">
            <Label>Aperçu</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
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
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: colorStyles.hex }}
                  />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{formData.label || 'Label'}</p>
                <code className="text-xs text-gray-500">{formData.value || 'value'}</code>
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
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ReferenceListsManagerV2: React.FC = () => {
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
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
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

  const { listConfig, items, activeItems, addItem, updateItem, deleteItem, reorderItems } =
    useReferenceList(selectedListKey);

  // Filtrer les items
  const filteredItems = useMemo(() => {
    let filtered = showInactive ? items : activeItems;

    if (itemSearchTerm) {
      const lower = itemSearchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.label.toLowerCase().includes(lower) ||
          item.value.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      );
    }

    return filtered.sort((a, b) => a.order - b.order);
  }, [items, activeItems, showInactive, itemSearchTerm]);

  // Sensors DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handlers
  const handleDragEnd = async (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex(item => item.id === String(active.id));
    const newIndex = filteredItems.findIndex(item => item.id === String(over.id));

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

  const handleDuplicate = async (item: ReferenceItem) => {
    try {
      await addItem({
        value: `${item.value}_copy`,
        label: `${item.label} (copie)`,
        color: item.color || 'blue',
        icon: item.icon || '',
        description: item.description || '',
      });
      toast.success('Item dupliqué');
    } catch (error) {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleToggleActive = async (item: ReferenceItem) => {
    try {
      await updateItem(item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Item désactivé' : 'Item activé');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (item: ReferenceItem) => {
    if (!confirm(`Supprimer "${item.label}" ?\n\nCette action est irréversible.`)) return;

    try {
      await deleteItem(item.id);
      toast.success('Item supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmitForm = async (formData: CreateItemInput) => {
    if (editingItem) {
      const hasValueChanged = editingItem.value !== formData.value;

      if (hasValueChanged) {
        setPendingUpdate({
          itemId: editingItem.id,
          formData,
          oldValue: editingItem.value,
          newValue: formData.value,
        });
        setShowImpactDialog(true);
      } else {
        await updateItem(editingItem.id, formData);
        toast.success('Item modifié');
        setIsDialogOpen(false);
      }
    } else {
      await addItem(formData);
      toast.success('Item ajouté');
      setIsDialogOpen(false);
    }
  };

  const handleConfirmImpactUpdate = async (updateInterventions: boolean) => {
    if (!pendingUpdate) return;

    const { itemId, formData, oldValue, newValue } = pendingUpdate;

    try {
      await updateItem(itemId, formData);

      if (updateInterventions && user && currentEstablishment) {
        await updateInterventionsByReferenceValue({
          establishmentId: currentEstablishment.id,
          listKey: selectedListKey,
          oldValue,
          newValue,
          userId: user.id,
        });
      }

      toast.success('Item modifié');
      setShowImpactDialog(false);
      setIsDialogOpen(false);
      setPendingUpdate(null);
    } catch (error) {
      toast.error('Erreur lors de la modification');
      throw error;
    }
  };

  const handleTemplateSuccess = () => {
    window.location.reload();
  };

  // Loading state
  if (globalLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-600">Chargement des listes...</p>
      </div>
    );
  }

  // Error state
  if (globalError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{globalError}</AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!data?.lists || Object.keys(data.lists).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="rounded-full bg-blue-100 p-6">
          <Sparkles className="h-12 w-12 text-blue-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Listes non initialisées</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Les listes de référence n'ont pas encore été créées pour cet établissement.
          </p>
          <Button onClick={() => setShowTemplateDialog(true)} size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Initialiser avec un template
          </Button>
        </div>

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
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Sidebar */}
      <ListSidebar
        data={data.lists}
        selectedListKey={selectedListKey}
        onSelectList={setSelectedListKey}
        searchTerm={sidebarSearchTerm}
        onSearchChange={setSidebarSearchTerm}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {LIST_LABELS[selectedListKey as PredefinedListKey] ||
                  listConfig?.name ||
                  selectedListKey}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeItems.length} actif{activeItems.length > 1 ? 's' : ''} sur {items.length}{' '}
                item{items.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedListKey === 'floors' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateFloorsDialog(true)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Générer
                </Button>
              )}
              <Button onClick={handleAdd} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={itemSearchTerm}
                onChange={e => setItemSearchTerm(e.target.value)}
                placeholder="Rechercher un item..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant={showInactive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="gap-2"
            >
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showInactive ? 'Tous' : 'Actifs'}
            </Button>
          </div>
        </div>

        {/* Items List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {itemSearchTerm
                    ? 'Aucun résultat'
                    : items.length === 0
                      ? 'Liste vide'
                      : 'Aucun item actif'}
                </h3>
                <p className="text-gray-500 mb-4 max-w-sm">
                  {itemSearchTerm
                    ? 'Aucun item ne correspond à votre recherche'
                    : items.length === 0
                      ? "Cette liste ne contient pas encore d'items."
                      : 'Tous les items sont désactivés.'}
                </p>
                {items.length === 0 && (
                  <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un item
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
                        onDuplicate={() => handleDuplicate(item)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
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

export default ReferenceListsManagerV2;
