/**
 * ============================================================================
 * SUPPLIER DETAIL PAGE
 * ============================================================================
 *
 * Page de détail d'un fournisseur
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Calendar,
  Star,
  Archive,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { SupplierForm } from '@/features/suppliers/components';
import { useSupplier } from '@/features/suppliers/hooks/useSuppliers';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import type { UpdateSupplierData } from '@/features/suppliers/types/supplier.types';
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_COLORS,
} from '@/features/suppliers/types/supplier.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { formatInterventionDate } from '@/utilis/interventionHelpers';

export const SupplierDetailPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEstablishment } = useEstablishments();

  const { supplier, isLoading } = useSupplier(currentEstablishment?.id, supplierId);
  const { updateSupplier, deleteSupplier, archiveSupplier, restoreSupplier } = useSuppliers(
    currentEstablishment?.id
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">Fournisseur introuvable</p>
          <Button variant="outline" onClick={() => navigate('/app/suppliers')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = SUPPLIER_STATUS_COLORS[supplier.status];

  /**
   * Modifier le fournisseur
   */
  const handleEdit = async (data: UpdateSupplierData) => {
    if (!user || !supplierId) return;

    setIsSubmitting(true);
    const success = await updateSupplier(supplierId, user.id, data);
    setIsSubmitting(false);

    if (success) {
      setIsEditDialogOpen(false);
    }
  };

  /**
   * Supprimer le fournisseur
   */
  const handleDelete = async () => {
    if (!supplierId) return;

    setIsSubmitting(true);
    const success = await deleteSupplier(supplierId);
    setIsSubmitting(false);

    if (success) {
      navigate('/app/suppliers');
    }
  };

  /**
   * Archiver le fournisseur
   */
  const handleArchive = async () => {
    if (!user || !supplierId) return;
    await archiveSupplier(supplierId, user.id);
  };

  /**
   * Restaurer le fournisseur
   */
  const handleRestore = async () => {
    if (!user || !supplierId) return;
    await restoreSupplier(supplierId, user.id);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <Badge variant="outline" className={`bg-${statusColor}-50 text-${statusColor}-700`}>
                {SUPPLIER_STATUS_LABELS[supplier.status]}
              </Badge>
            </div>
            <Badge variant="secondary">{SUPPLIER_CATEGORY_LABELS[supplier.category]}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>

          {supplier.status === 'active' && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}

          {supplier.status === 'archived' && (
            <Button variant="outline" onClick={handleRestore}>
              Restaurer
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-muted-foreground">{supplier.description}</p>
                </div>
              )}

              {/* Contact */}
              <div className="space-y-2">
                <h4 className="font-medium">Contact</h4>

                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                      {supplier.phone}
                    </a>
                  </div>
                )}

                {supplier.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.website}
                    </a>
                  </div>
                )}

                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {supplier.address.street && <div>{supplier.address.street}</div>}
                      <div>
                        {supplier.address.postalCode} {supplier.address.city}
                      </div>
                      <div>{supplier.address.country}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations commerciales */}
              {(supplier.siret || supplier.vatNumber) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Informations commerciales</h4>

                    {supplier.siret && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SIRET</span>
                        <span className="font-medium">{supplier.siret}</span>
                      </div>
                    )}

                    {supplier.vatNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">N° TVA</span>
                        <span className="font-medium">{supplier.vatNumber}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Conditions de paiement */}
              {supplier.paymentTerms && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Conditions de paiement</h4>

                    {supplier.paymentTerms.method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Méthode</span>
                        <span className="font-medium">{supplier.paymentTerms.method}</span>
                      </div>
                    )}

                    {supplier.paymentTerms.delayDays && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Délai</span>
                        <span className="font-medium">{supplier.paymentTerms.delayDays} jours</span>
                      </div>
                    )}

                    {supplier.paymentTerms.discountPercent && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remise</span>
                        <span className="font-medium">
                          {supplier.paymentTerms.discountPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              {supplier.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes internes
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {supplier.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Tags */}
              {supplier.tags && supplier.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {supplier.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{supplier.orderCount}</div>
                <div className="text-sm text-muted-foreground">Commandes</div>
              </div>

              <div>
                <div className="text-2xl font-bold">{supplier.totalSpent.toFixed(2)} €</div>
                <div className="text-sm text-muted-foreground">Total dépensé</div>
              </div>

              {supplier.lastOrderDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Dernière commande:{' '}
                    {formatInterventionDate(supplier.lastOrderDate, 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Évaluation */}
          {supplier.rating && supplier.rating.reviewCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Évaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <div className="text-2xl font-bold">{supplier.rating.overall.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">/ 5</div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {supplier.rating.reviewCount} avis
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualité</span>
                    <span className="font-medium">{supplier.rating.quality}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Délai de livraison</span>
                    <span className="font-medium">{supplier.rating.deliveryTime}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service client</span>
                    <span className="font-medium">{supplier.rating.customerService}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rapport qualité/prix</span>
                    <span className="font-medium">{supplier.rating.priceValue}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le fournisseur</DialogTitle>
            <DialogDescription>Modifiez les informations du fournisseur</DialogDescription>
          </DialogHeader>

          <SupplierForm
            supplier={supplier}
            onSubmit={handleEdit}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le fournisseur "{supplier.name}" ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
