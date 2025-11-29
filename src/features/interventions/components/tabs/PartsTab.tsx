/**
 * Onglet Pièces - Liste des pièces à commander avec envoi email
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Mail,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { useParts } from '../../hooks/useParts';
import type { PartStatus } from '../../types/subcollections.types';
import { sendPartOrderEmail } from '@/shared/services/emailService';
import { logOrderEmailSent } from '../../services/historyService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/core/utils/logger';

interface PartsTabProps {
  interventionId: string;
  interventionNumber?: string;
  roomNumber?: string;
}

const STATUS_CONFIG: Record<PartStatus, { label: string; color: string; icon: LucideIcon }> = {
  to_order: { label: 'À commander', color: 'bg-orange-500', icon: Clock },
  ordered: { label: 'Commandée', color: 'bg-blue-500', icon: ShoppingCart },
  received: { label: 'Reçue', color: 'bg-green-500', icon: Package },
  installed: { label: 'Installée', color: 'bg-gray-500', icon: CheckCircle2 },
};

export const PartsTab = ({ interventionId, interventionNumber, roomNumber }: PartsTabProps) => {
  // Utiliser le hook pour les pièces
  const {
    parts,
    getPartsByStatus,
    getTotalCost,
    add,
    update,
    remove,
    changeStatus: changePartStatus,
  } = useParts(interventionId);

  const { currentEstablishment } = useEstablishmentStore();
  const { user } = useAuth();
  const orderEmail = currentEstablishment?.settings?.orderEmail || 'achats@hotel.com';

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    quantity: 1,
    unitPrice: 0,
    supplier: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      reference: '',
      quantity: 1,
      unitPrice: 0,
      supplier: '',
      notes: '',
    });
    setEditingPart(null);
  };

  const handleAdd = async () => {
    logger.debug('handleAdd called with formData:', formData);

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Veuillez saisir le nom de la pièce');
      return;
    }

    const success = editingPart ? await update(editingPart.id, formData) : await add(formData);

    if (success) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleDelete = async (partId: string) => {
    if (!confirm('Supprimer cette pièce ?')) return;
    await remove(partId);
  };

  const handleStatusChange = async (partId: string, newStatus: PartStatus) => {
    await changePartStatus(partId, newStatus);
  };

  const handleSendEmail = async () => {
    if (!currentEstablishment || !user) {
      toast.error('Informations manquantes');
      return;
    }

    const partsToOrder = getPartsByStatus('to_order');
    if (partsToOrder.length === 0) {
      toast.error('Aucune pièce à commander');
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendPartOrderEmail({
        to: orderEmail,
        establishmentName: currentEstablishment.name,
        interventionNumber,
        roomNumber,
        parts: partsToOrder.map(part => ({
          name: part.name,
          reference: part.reference,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          supplier: part.supplier,
        })),
        requestedBy: user.displayName || user.email || 'Utilisateur',
        requestedAt: format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr }),
      });

      // Logger l'envoi de l'email dans l'historique
      await logOrderEmailSent(
        currentEstablishment.id,
        interventionId,
        user.id,
        user.displayName || user.email || 'Utilisateur',
        user.role,
        orderEmail,
        partsToOrder.length
      );

      toast.success('Email envoyé avec succès au responsable des achats');
      setShowEmailDialog(false);
    } catch (error: unknown) {
      logger.error('Erreur envoi email:', error);
      toast.error("Erreur lors de l'envoi de l'email", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = getPartsByStatus(status as PartStatus).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={cn('p-3 rounded-full', config.color)}>
                    <config.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une pièce
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowEmailDialog(true)}
          disabled={getPartsByStatus('to_order').length === 0}
        >
          <Mail className="mr-2 h-4 w-4" />
          Envoyer email de commande
        </Button>
      </div>

      {/* Liste des pièces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pièces nécessaires
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                Total estimé:
              </span>
              <Badge variant="secondary" className="text-base">
                {getTotalCost().toFixed(2)} €
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune pièce ajoutée</p>
              <p className="text-sm text-gray-500 mt-2">
                Ajoutez les pièces nécessaires pour cette intervention
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {parts.map(part => (
                <div
                  key={part.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Nom et référence */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{part.name}</h4>
                        {part.reference && (
                          <Badge variant="outline" className="text-xs">
                            Réf: {part.reference}
                          </Badge>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Quantité</p>
                          <p className="font-medium">{part.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Prix unitaire</p>
                          <p className="font-medium">{part.unitPrice.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Total</p>
                          <p className="font-medium">
                            {(part.quantity * part.unitPrice).toFixed(2)} €
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Fournisseur</p>
                          <p className="font-medium">{part.supplier || 'Non défini'}</p>
                        </div>
                      </div>

                      {/* Notes */}
                      {part.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                          Note: {part.notes}
                        </p>
                      )}
                    </div>

                    {/* Statut et actions */}
                    <div className="flex flex-col items-end gap-2">
                      <Select
                        value={part.status}
                        onValueChange={value => handleStatusChange(part.id, value as PartStatus)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div className={cn('h-2 w-2 rounded-full', config.color)} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPart(part);
                            setFormData({
                              name: part.name,
                              reference: part.reference || '',
                              quantity: part.quantity,
                              unitPrice: part.unitPrice,
                              supplier: part.supplier || '',
                              notes: part.notes || '',
                            });
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(part.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajouter/Modifier */}
      <Dialog
        open={showAddDialog}
        onOpenChange={open => {
          setShowAddDialog(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Modifier' : 'Ajouter'} une pièce</DialogTitle>
            <DialogDescription>
              Renseignez les informations sur la pièce nécessaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la pièce *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Robinet thermostatique"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Ex: RT-2024-A"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={e =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitPrice">Prix unitaire (€)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={e =>
                    setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Leroy Merlin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAdd}>{editingPart ? 'Modifier' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Email */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer la demande de commande</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au responsable des achats avec la liste des pièces à commander
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Pièces à commander :</h4>
              <div className="space-y-2">
                {getPartsByStatus('to_order').map(part => (
                  <div key={part.id} className="flex justify-between text-sm">
                    <span>
                      {part.name} x{part.quantity}
                    </span>
                    <span className="font-medium">
                      {(part.quantity * part.unitPrice).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {getPartsByStatus('to_order')
                    .reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
                    .toFixed(2)}{' '}
                  €
                </span>
              </div>
            </div>

            <div>
              <Label>Destinataire</Label>
              <Input value={orderEmail} disabled />
              {!currentEstablishment?.settings?.orderEmail && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  ⚠️ Email par défaut - Configurez l'email de commande dans les paramètres de
                  l'établissement
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSendingEmail}
            >
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
