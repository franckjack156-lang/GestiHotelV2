/**
 * ============================================================================
 * SUPPLIER CARD
 * ============================================================================
 *
 * Carte d'affichage d'un fournisseur
 */

import { Mail, Phone, MapPin, Calendar, Star, MoreVertical } from 'lucide-react';
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
import type { Supplier } from '../types/supplier.types';
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_COLORS,
} from '../types/supplier.types';
import { formatInterventionDate } from '@/utilis/interventionHelpers';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onArchive?: (supplier: Supplier) => void;
  onRestore?: (supplier: Supplier) => void;
  onClick?: (supplier: Supplier) => void;
}

export const SupplierCard = ({
  supplier,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onClick,
}: SupplierCardProps) => {
  const statusColor = SUPPLIER_STATUS_COLORS[supplier.status];

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(supplier)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{supplier.name}</h3>
            <Badge variant="outline" className={`bg-${statusColor}-50 text-${statusColor}-700`}>
              {SUPPLIER_STATUS_LABELS[supplier.status]}
            </Badge>
          </div>
          <Badge variant="secondary">{SUPPLIER_CATEGORY_LABELS[supplier.category]}</Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(supplier)}>Modifier</DropdownMenuItem>
            )}
            {supplier.status === 'active' && onArchive && (
              <DropdownMenuItem onClick={() => onArchive(supplier)}>Archiver</DropdownMenuItem>
            )}
            {supplier.status === 'archived' && onRestore && (
              <DropdownMenuItem onClick={() => onRestore(supplier)}>Restaurer</DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(supplier)} className="text-red-600">
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {supplier.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{supplier.description}</p>
        )}

        {/* Informations de contact */}
        <div className="space-y-2">
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{supplier.email}</span>
            </div>
          )}

          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.phone}</span>
            </div>
          )}

          {supplier.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {supplier.address.city}, {supplier.address.country}
              </span>
            </div>
          )}
        </div>

        {/* Évaluation */}
        {supplier.rating && supplier.rating.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{supplier.rating.overall.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({supplier.rating.reviewCount} avis)
            </span>
          </div>
        )}

        {/* Statistiques */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="font-medium">{supplier.orderCount}</span>
            <span className="text-muted-foreground">
              {' '}
              commande{supplier.orderCount > 1 ? 's' : ''}
            </span>
          </div>

          {supplier.totalSpent > 0 && (
            <div className="text-sm">
              <span className="font-medium">{supplier.totalSpent.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {/* Dernière commande */}
        {supplier.lastOrderDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Dernière commande: {formatInterventionDate(supplier.lastOrderDate, 'dd/MM/yyyy')}
            </span>
          </div>
        )}

        {/* Tags */}
        {supplier.tags && supplier.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {supplier.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{supplier.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
