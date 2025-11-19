/**
 * ============================================================================
 * ROOM DETAIL PAGE
 * ============================================================================
 *
 * Page de détail d'une chambre
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Building2,
  Users,
  DoorClosed,
  History,
  Wrench,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useBlockageHistory } from '@/features/rooms/hooks/useBlockages';
import { BlockageCard } from '@/features/rooms/components';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUser } from '@/features/users/hooks/useUsers';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { QRCodeGenerator } from '@/features/qrcode/components';
import { useEstablishmentStore } from '@/features/establishments/stores/establishmentStore';

const ROOM_TYPES: Record<string, string> = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  suite: 'Suite',
  other: 'Autre',
};

export const RoomDetailPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { currentEstablishment } = useEstablishmentStore();
  const { user } = useAuth();
  const { getRoomById, isLoading, deleteRoom, blockRoom, unblockRoom } = useRooms(establishmentId!);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const room = getRoomById(roomId!);

  // Charger l'historique des blocages
  const { history: blockageHistory, isLoading: isLoadingHistory } = useBlockageHistory(roomId!);

  // Récupérer les informations de l'utilisateur qui a bloqué la chambre
  const { user: blockedByUser } = useUser(room?.blockedBy);

  const handleDelete = async () => {
    if (!room || !window.confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) return;

    try {
      await deleteRoom(room.id);
      toast.success('Chambre supprimée');
      navigate('/app/rooms');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBlock = async () => {
    if (!room || !user || !blockReason.trim()) return;

    try {
      await blockRoom(room.id, { reason: blockReason, userId: user.id });
      toast.success('Chambre bloquée');
      setBlockDialogOpen(false);
      setBlockReason('');
    } catch {
      toast.error('Erreur lors du blocage');
    }
  };

  const handleUnblock = async () => {
    if (!room) return;

    try {
      await unblockRoom(room.id);
      toast.success('Chambre débloquée');
    } catch {
      toast.error('Erreur lors du déblocage');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <DoorClosed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Chambre introuvable</p>
            <Button className="mt-4" onClick={() => navigate('/app/rooms')}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/rooms')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chambre {room.number}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {ROOM_TYPES[room.type]} - Étage {room.floor}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {currentEstablishment && (
            <QRCodeGenerator
              roomData={{
                roomId: room.id,
                roomNumber: room.number,
                establishmentId: currentEstablishment.id,
                establishmentName: currentEstablishment.name,
                type: 'room',
                version: '1.0',
              }}
            />
          )}
          <Button variant="outline" onClick={() => navigate(`/app/rooms/${room.id}/edit`)}>
            <Edit size={16} className="mr-2" />
            Modifier
          </Button>
          {room.isBlocked ? (
            <Button variant="outline" onClick={handleUnblock} className="text-green-600">
              <Unlock size={16} className="mr-2" />
              Débloquer
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(true)}
              className="text-orange-600"
            >
              <Lock size={16} className="mr-2" />
              Bloquer
            </Button>
          )}
          <Button variant="outline" onClick={handleDelete} className="text-red-600">
            <Trash2 size={16} className="mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Statut */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  room.isBlocked ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'
                }`}
              >
                <DoorClosed
                  className={room.isBlocked ? 'text-red-600' : 'text-green-600'}
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                <p className="text-lg font-medium">{room.isBlocked ? 'Bloquée' : 'Disponible'}</p>
              </div>
            </div>
            {room.isBlocked && <Badge variant="destructive">Bloquée</Badge>}
          </div>

          {room.isBlocked && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
              {room.blockReason && (
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                    Raison du blocage
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{room.blockReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-red-200 dark:border-red-800">
                {room.blockedAt && (
                  <div>
                    <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">
                      Date et heure
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {format(room.blockedAt.toDate(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                )}

                {blockedByUser && (
                  <div>
                    <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">
                      Bloquée par
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {blockedByUser.firstName} {blockedByUser.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <DoorClosed className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Numéro</p>
                <p className="font-medium">{room.number}</p>
              </div>
            </div>

            {room.building && (
              <div className="flex items-center gap-3">
                <Building2 className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bâtiment</p>
                  <p className="font-medium">{room.building}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Capacité</p>
                <p className="font-medium">{room.capacity} personne(s)</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
              <Badge>{ROOM_TYPES[room.type]}</Badge>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Étage</p>
              <Badge variant="outline">Étage {room.floor}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.price && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prix</p>
                <p className="font-medium">{room.price} €</p>
              </div>
            )}

            {room.area && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Surface</p>
                <p className="font-medium">{room.area} m²</p>
              </div>
            )}

            {room.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                <p className="text-sm">{room.description}</p>
              </div>
            )}

            {room.amenities && room.amenities.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Équipements</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Créée le</p>
              <p>
                {room.createdAt &&
                  format(room.createdAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Dernière modification</p>
              <p>
                {room.updatedAt &&
                  format(room.updatedAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des blocages et interventions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique & Interventions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="blockages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blockages" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Blocages ({blockageHistory.length})
              </TabsTrigger>
              <TabsTrigger value="interventions" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Interventions liées
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blockages" className="space-y-4 mt-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSkeleton type="card" />
                </div>
              ) : blockageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun historique de blocage pour cette chambre
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockageHistory.map(blockage => (
                    <BlockageCard
                      key={blockage.id}
                      blockage={blockage}
                      onViewIntervention={interventionId =>
                        navigate(`/app/interventions/${interventionId}`)
                      }
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="interventions" className="mt-4">
              <div className="text-center py-8">
                <Wrench className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Liste des interventions pour cette chambre
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Fonctionnalité à venir
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog blocage */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquer la chambre {room.number}</DialogTitle>
            <DialogDescription>Indiquez la raison du blocage de cette chambre</DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="reason">Raison du blocage</Label>
            <Textarea
              id="reason"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="Ex: Travaux en cours, problème de plomberie..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBlock} disabled={!blockReason.trim()}>
              Bloquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
