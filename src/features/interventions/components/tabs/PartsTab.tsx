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
  Euro,
  ShoppingCart,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import type { PartStatus } from '../../types/intervention.types';

interface PartsTabProps {
  interventionId: string;
}

const STATUS_CONFIG: Record<PartStatus, { label: string; color: string; icon: any }> = {
  to_order: { label: 'À commander', color: 'bg-orange-500', icon: Clock },
  ordered: { label: 'Commandée', color: 'bg-blue-500', icon: ShoppingCart },
  received: { label: 'Reçue', color: 'bg-green-500', icon: Package },
  installed: { label: 'Installée', color: 'bg-gray-500', icon: CheckCircle2 },
};

export const PartsTab = ({ interventionId }: PartsTabProps) => {
  // TODO: Récupérer les pièces depuis Firestore
  const [parts, setParts] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);

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

  const handleAdd = () => {
    if (!formData.name) {
      toast.error('Veuillez saisir le nom de la pièce');
      return;
    }

    // TODO: Appel API
    toast.success('Pièce ajoutée');
    setShowAddDialog(false);
    resetForm();
  };

  const handleDelete = (partId: string) => {
    if (!confirm('Supprimer cette pièce ?')) return;
    setParts(parts.filter((p) => p.id !== partId));
    toast.success('Pièce supprimée');
  };

  const handleStatusChange = (partId: string, newStatus: PartStatus) => {
    setParts(parts.map((p) => (p.id === partId ? { ...p, status: newStatus } : p)));
    toast.success('Statut mis à jour');
  };

  const handleSendEmail = () => {
    // TODO: Appel API pour envoyer l'email
    toast.success('Email envoyé au responsable des achats');
    setShowEmailDialog(false);
  };

  const getTotalCost = () => {
    return parts.reduce((sum, part) => sum + part.quantity * part.unitPrice, 0);
  };

  const getPartsByStatus = (status: PartStatus) => {
    return parts.filter((p) => p.status === status);
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
              {parts.map((part) => (
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
                          <p className="font-medium">{(part.quantity * part.unitPrice).toFixed(2)} €</p>
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
                        onValueChange={(value) => handleStatusChange(part.id, value as PartStatus)}
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
                            setFormData(part);
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Robinet thermostatique"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
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
                  onChange={(e) =>
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
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Leroy Merlin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                {getPartsByStatus('to_order').map((part) => (
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
              <Input value="achats@hotel.com" disabled />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
