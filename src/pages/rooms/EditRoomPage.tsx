/**
 * ============================================================================
 * EDIT ROOM PAGE
 * ============================================================================
 *
 * Page d'édition d'une chambre
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorClosed } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/shared/components/ui-extended';
import { RoomForm } from './RoomsPages';
import type { RoomFormData } from './RoomsPages';

export const EditRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { getRoomById, isLoading, updateRoom, isUpdating } = useRooms(establishmentId!);

  const room = getRoomById(roomId!);

  const handleSubmit = async (data: RoomFormData) => {
    if (!room) return;

    try {
      await updateRoom(room.id, data);
      toast.success('Chambre modifiée');
      navigate(`/app/rooms/${room.id}`);
    } catch (error) {
      toast.error('Erreur lors de la modification');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/rooms/${room.id}`)}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Modifier la chambre {room.number}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Modifiez les informations de la chambre
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la chambre</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm room={room} onSubmit={handleSubmit} isLoading={isUpdating} />
        </CardContent>
      </Card>
    </div>
  );
};
