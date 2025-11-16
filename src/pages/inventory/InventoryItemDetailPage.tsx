/**
 * ============================================================================
 * INVENTORY ITEM DETAIL PAGE
 * ============================================================================
 *
 * Page de détail d'un article d'inventaire
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useInventoryItem } from '@/features/inventory/hooks/useInventory';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  MEASUREMENT_UNIT_LABELS,
} from '@/features/inventory/types/inventory.types';

export const InventoryItemDetailPage = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { item, movements, isLoading } = useInventoryItem(establishmentId, itemId || null);

  if (isLoading || !item) {
    return <LoadingSkeleton />;
  }

  const getMovementTypeLabel = (type: string) => {
    const labels = { in: 'Entrée', out: 'Sortie', adjustment: 'Ajustement', transfer: 'Transfert' };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors = { in: 'green', out: 'red', adjustment: 'blue', transfer: 'orange' };
    return colors[type as keyof typeof colors] || 'gray';
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/app/inventory')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            {item.sku && (
              <p className="text-muted-foreground mt-1">SKU: {item.sku}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails généraux */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Catégorie</div>
                  <div className="font-medium">{INVENTORY_CATEGORY_LABELS[item.category]}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                  <Badge variant={INVENTORY_STATUS_COLORS[item.status] as any}>
                    {INVENTORY_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Quantité</div>
                  <div className="font-medium text-2xl">
                    {item.quantity} {MEASUREMENT_UNIT_LABELS[item.unit]}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Seuil d'alerte</div>
                  <div className="font-medium">{item.minQuantity} {MEASUREMENT_UNIT_LABELS[item.unit]}</div>
                </div>
                {item.unitPrice !== undefined && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Prix unitaire</div>
                      <div className="font-medium">{item.unitPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Valeur totale</div>
                      <div className="font-medium text-2xl">{item.totalValue.toFixed(2)} €</div>
                    </div>
                  </>
                )}
              </div>

              {item.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <p className="text-sm">{item.description}</p>
                </div>
              )}

              {item.location && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Localisation</div>
                    <div className="font-medium">{item.location}</div>
                  </div>
                  {item.room && (
                    <div>
                      <div className="text-sm text-muted-foreground">Chambre/Local</div>
                      <div className="font-medium">{item.room}</div>
                    </div>
                  )}
                </div>
              )}

              {item.supplierName && (
                <div>
                  <div className="text-sm text-muted-foreground">Fournisseur</div>
                  <div className="font-medium">{item.supplierName}</div>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique des mouvements */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun mouvement de stock
                </p>
              ) : (
                <div className="space-y-4">
                  {movements.map(movement => (
                    <div key={movement.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getMovementTypeColor(movement.type) as any}>
                            {getMovementTypeLabel(movement.type)}
                          </Badge>
                          <span className="font-medium">
                            {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}
                            {movement.quantity} {MEASUREMENT_UNIT_LABELS[item.unit]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.quantityBefore} → {movement.quantityAfter}
                        </div>
                        {movement.reason && (
                          <p className="text-sm mt-1">{movement.reason}</p>
                        )}
                        {movement.reference && (
                          <p className="text-xs text-muted-foreground">Ref: {movement.reference}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">
                          {movement.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {movement.createdAt && format(movement.createdAt.toDate(), 'Pp', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                <Package className="mr-2 h-4 w-4" />
                Mouvement de stock
              </Button>
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle>Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Créé le</div>
                <div>{format(item.createdAt.toDate(), 'PPp', { locale: fr })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Modifié le</div>
                <div>{format(item.updatedAt.toDate(), 'PPp', { locale: fr })}</div>
              </div>
              {item.lastStockUpdateAt && (
                <div>
                  <div className="text-muted-foreground">Dernier mouvement</div>
                  <div>{format(item.lastStockUpdateAt.toDate(), 'PPp', { locale: fr })}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
