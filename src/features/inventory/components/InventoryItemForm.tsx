/**
 * ============================================================================
 * INVENTORY ITEM FORM
 * ============================================================================
 *
 * Formulaire de création/édition d'un article d'inventaire
 */

import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import type {
  InventoryItem,
  CreateInventoryItemData,
  InventoryCategory,
  MeasurementUnit,
} from '../types/inventory.types';
import {
  INVENTORY_CATEGORY_LABELS,
  MEASUREMENT_UNIT_LABELS,
} from '../types/inventory.types';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';

interface InventoryItemFormProps {
  item?: InventoryItem;
  onSubmit: (data: CreateInventoryItemData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InventoryItemForm = ({
  item,
  onSubmit,
  onCancel,
  isLoading,
}: InventoryItemFormProps) => {
  const { establishmentId } = useCurrentEstablishment();
  const { suppliers } = useSuppliers(establishmentId || undefined);

  const [formData, setFormData] = useState<CreateInventoryItemData>({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || 'other',
    description: item?.description || '',
    quantity: item?.quantity || 0,
    unit: item?.unit || 'piece',
    minQuantity: item?.minQuantity || 0,
    maxQuantity: item?.maxQuantity,
    unitPrice: item?.unitPrice,
    supplierId: item?.supplierId,
    location: item?.location || '',
    room: item?.room || '',
    notes: item?.notes || '',
    tags: item?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');

  const handleChange = (field: keyof CreateInventoryItemData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      handleChange('tags', [...(formData.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const activeSuppliers = suppliers.filter(s => s.status === 'active');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="other">Autres</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nom de l'article *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
                placeholder="Ex: Papier toilette"
              />
            </div>

            <div>
              <Label htmlFor="sku">Code SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={e => handleChange('sku', e.target.value)}
                placeholder="Ex: PT-001"
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={value => handleChange('category', value as InventoryCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVENTORY_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Description de l'article..."
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantité actuelle *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={e => handleChange('quantity', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Unité *</Label>
              <Select
                value={formData.unit}
                onValueChange={value => handleChange('unit', value as MeasurementUnit)}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEASUREMENT_UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minQuantity">Seuil d'alerte *</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.minQuantity}
                onChange={e => handleChange('minQuantity', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="maxQuantity">Stock maximum</Label>
              <Input
                id="maxQuantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.maxQuantity || ''}
                onChange={e => handleChange('maxQuantity', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            <div>
              <Label htmlFor="unitPrice">Prix unitaire (€)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice || ''}
                onChange={e => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            <div>
              <Label htmlFor="supplier">Fournisseur</Label>
              <Select
                value={formData.supplierId || 'none'}
                onValueChange={value => handleChange('supplierId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {activeSuppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="other" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="Ex: Réserve principale"
              />
            </div>

            <div>
              <Label htmlFor="room">Chambre/Local</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={e => handleChange('room', e.target.value)}
                placeholder="Ex: Local technique"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Notes additionnelles..."
              />
            </div>

            <div className="col-span-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Ajouter un tag..."
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : item ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};
