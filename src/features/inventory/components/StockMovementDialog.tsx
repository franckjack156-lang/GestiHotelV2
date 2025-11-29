/**
 * ============================================================================
 * STOCK MOVEMENT DIALOG
 * ============================================================================
 *
 * Dialogue pour créer un mouvement de stock
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
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
import type { InventoryItem, CreateStockMovementData } from '../types/inventory.types';
import { MEASUREMENT_UNIT_LABELS } from '../types/inventory.types';

interface StockMovementDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStockMovementData) => Promise<boolean>;
}

export const StockMovementDialog = ({
  item,
  open,
  onOpenChange,
  onSubmit,
}: StockMovementDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStockMovementData>({
    type: 'in',
    quantity: 0,
    reason: '',
    reference: '',
    notes: '',
  });

  const handleChange = (field: keyof CreateStockMovementData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);
    const success = await onSubmit(formData);

    if (success) {
      setFormData({
        type: 'in',
        quantity: 0,
        reason: '',
        reference: '',
        notes: '',
      });
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  if (!item) return null;

  const getTypeLabel = (type: string) => {
    const labels = {
      in: 'Entrée',
      out: 'Sortie',
      adjustment: 'Ajustement',
      transfer: 'Transfert',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      in: 'Ajouter du stock (réception de commande)',
      out: 'Retirer du stock (utilisation)',
      adjustment: 'Ajuster la quantité en stock',
      transfer: 'Transférer vers un autre emplacement',
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mouvement de stock</DialogTitle>
          <DialogDescription>
            Article: {item.name} - Stock actuel: {item.quantity}{' '}
            {MEASUREMENT_UNIT_LABELS[item.unit]}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type de mouvement *</Label>
            <Select value={formData.type} onValueChange={value => handleChange('type', value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <div>
                    <div className="font-medium">{getTypeLabel('in')}</div>
                    <div className="text-xs text-muted-foreground">{getTypeDescription('in')}</div>
                  </div>
                </SelectItem>
                <SelectItem value="out">
                  <div>
                    <div className="font-medium">{getTypeLabel('out')}</div>
                    <div className="text-xs text-muted-foreground">{getTypeDescription('out')}</div>
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div>
                    <div className="font-medium">{getTypeLabel('adjustment')}</div>
                    <div className="text-xs text-muted-foreground">
                      {getTypeDescription('adjustment')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div>
                    <div className="font-medium">{getTypeLabel('transfer')}</div>
                    <div className="text-xs text-muted-foreground">
                      {getTypeDescription('transfer')}
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantité * ({MEASUREMENT_UNIT_LABELS[item.unit]})</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={e => handleChange('quantity', parseFloat(e.target.value) || 0)}
              required
            />
            {formData.type === 'adjustment' && (
              <p className="text-xs text-muted-foreground mt-1">
                Pour un ajustement, entrez la nouvelle quantité totale souhaitée
              </p>
            )}
            {(formData.type === 'out' || formData.type === 'transfer') && (
              <p className="text-xs text-muted-foreground mt-1">
                Quantité à retirer du stock actuel
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Raison</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={e => handleChange('reason', e.target.value)}
              placeholder="Ex: Commande #1234, Intervention chambre 101..."
            />
          </div>

          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={e => handleChange('reference', e.target.value)}
              placeholder="Numéro de bon de livraison, commande..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Notes additionnelles..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || formData.quantity <= 0}>
              {isLoading ? 'Enregistrement...' : 'Valider le mouvement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
