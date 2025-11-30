/**
 * ============================================================================
 * INVENTORY ITEM CARD
 * ============================================================================
 *
 * Carte d'affichage d'un article d'inventaire
 */

import { MoreVertical, Package, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type { InventoryItem } from '../types/inventory.types';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  MEASUREMENT_UNIT_LABELS,
} from '../types/inventory.types';

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onStockMovement?: (item: InventoryItem) => void;
  onClick?: (item: InventoryItem) => void;
}

export const InventoryItemCard = ({
  item,
  onEdit,
  onDelete,
  onStockMovement,
  onClick,
}: InventoryItemCardProps) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'in_stock':
        return <Check className="h-4 w-4" />;
      case 'low_stock':
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const stockPercentage = item.maxQuantity ? (item.quantity / item.maxQuantity) * 100 : 100;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onClick?.(item)}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
              {item.sku && (
                <Badge variant="outline" className="text-xs">
                  {item.sku}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {INVENTORY_CATEGORY_LABELS[item.category]}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onStockMovement && (
                <>
                  <DropdownMenuItem onClick={() => onStockMovement(item)}>
                    Mouvement de stock
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onEdit && <DropdownMenuItem onClick={() => onEdit(item)}>Modifier</DropdownMenuItem>}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3" onClick={() => onClick?.(item)}>
        {/* Statut et quantité */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={INVENTORY_STATUS_COLORS[item.status] as any}>
              {INVENTORY_STATUS_LABELS[item.status]}
            </Badge>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {item.quantity} {MEASUREMENT_UNIT_LABELS[item.unit]}
            </div>
            {item.minQuantity > 0 && (
              <div className="text-xs text-muted-foreground">Seuil: {item.minQuantity}</div>
            )}
          </div>
        </div>

        {/* Barre de progression du stock */}
        {item.maxQuantity && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stockPercentage > 50
                    ? 'bg-green-500'
                    : stockPercentage > 20
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{item.quantity}</span>
              <span>{item.maxQuantity}</span>
            </div>
          </div>
        )}

        {/* Valeur et localisation */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {item.unitPrice !== undefined && item.unitPrice > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">Valeur totale</div>
              <div className="font-medium">{item.totalValue.toFixed(2)} €</div>
            </div>
          )}
          {item.location && (
            <div>
              <div className="text-xs text-muted-foreground">Localisation</div>
              <div className="font-medium truncate">{item.location}</div>
            </div>
          )}
        </div>

        {/* Fournisseur */}
        {item.supplierName && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">Fournisseur</div>
            <div className="text-sm truncate">{item.supplierName}</div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {item.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
