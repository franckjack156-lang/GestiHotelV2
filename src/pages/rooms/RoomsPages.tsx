/**
 * ============================================================================
 * ROOMS PAGES - CRUD COMPLET
 * ============================================================================
 *
 * Toutes les pages chambres :
 * - Liste chambres avec filtres
 * - CRUD chambres
 * - Blocage/Déblocage
 * - Historique
 * - Vue par étage
 */

import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DoorClosed,
  DoorOpen,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  DataTable,
  SearchBar,
  EmptyState,
  ConfirmDialog,
  StatusIndicator,
  LoadingSkeleton,
} from '@/shared/components/ui-extended';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import type { Room } from '@/features/rooms/types/room.types';
import { ImportDialog } from '@/shared/components/import/ImportDialog';
import { useImportRooms } from '@/shared/hooks/useImport';
import { downloadRoomsTemplate } from '@/shared/services/exportService';
import { BlockRoomDialog } from '@/features/rooms/components';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const roomSchema = z.object({
  number: z.string().min(1, 'Le numéro est requis'),
  floor: z.coerce.number().min(0, "L'étage est requis"),
  building: z.string().optional(),
  type: z.enum(['single', 'double', 'triple', 'suite', 'other']),
  capacity: z.coerce.number().min(1, 'La capacité est requise'),
  description: z.string().optional(),
});

export type RoomFormData = z.infer<typeof roomSchema>;

// Types de chambres
const ROOM_TYPES = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  suite: 'Suite',
  other: 'Autre',
};

// ============================================================================
// LISTE CHAMBRES
// ============================================================================

const RoomsListPageComponent = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { user } = useAuth();
  const { rooms, isLoading, deleteRoom, blockRoom, unblockRoom, isDeleting, createRoom } = useRooms(
    establishmentId!
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'blocked'>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blockDialogRoom, setBlockDialogRoom] = useState<Room | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Hook d'import
  const importHook = useImportRooms();

  // Filtrer les chambres
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Recherche
      if (searchTerm && !room.number.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Statut
      if (filterStatus === 'available' && room.isBlocked) return false;
      if (filterStatus === 'blocked' && !room.isBlocked) return false;

      // Étage
      if (filterFloor !== 'all' && room.floor.toString() !== filterFloor) return false;

      return true;
    });
  }, [rooms, searchTerm, filterStatus, filterFloor]);

  // Étages disponibles
  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
    return uniqueFloors;
  }, [rooms]);

  // Stats
  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter(r => !r.isBlocked).length;
    const blocked = rooms.filter(r => r.isBlocked).length;

    return { total, available, blocked };
  }, [rooms]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRoom(deleteId);
      toast.success('Chambre supprimée');
      setDeleteId(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBlock = async (reason: string) => {
    if (!blockDialogRoom || !user) return;

    try {
      await blockRoom(blockDialogRoom.id, { reason, userId: user.id });
      toast.success('Chambre bloquée');
      setBlockDialogRoom(null);
    } catch {
      toast.error('Erreur lors du blocage');
    }
  };

  const handleUnblock = async (roomId: string) => {
    try {
      await unblockRoom(roomId);
      toast.success('Chambre débloquée');
    } catch {
      toast.error('Erreur lors du déblocage');
    }
  };

  // Gestion de l'import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImportConfirm = async (data: any[]) => {
    try {
      await importHook.handleConfirm(data, createRoom);
      toast.success('Import réussi', {
        description: `${data.length} chambre(s) importée(s)`,
      });
      setImportDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'import");
    }
  };

  const columns = [
    {
      key: 'number',
      label: 'Chambre',
      sortable: true,
      render: (item: Room) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              item.isBlocked ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'
            }`}
          >
            {item.isBlocked ? (
              <DoorClosed className="text-red-600 dark:text-red-400" size={20} />
            ) : (
              <DoorOpen className="text-green-600 dark:text-green-400" size={20} />
            )}
          </div>
          <div>
            <p className="font-medium">Chambre {item.number}</p>
            <p className="text-sm text-gray-500">Étage {item.floor}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: Room) => <span className="text-sm">{ROOM_TYPES[item.type]}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (item: Room) => <span className="text-sm">{item.capacity} pers.</span>,
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: Room) =>
        item.isBlocked ? (
          <StatusIndicator status="error" label="Bloquée" />
        ) : (
          <StatusIndicator status="success" label="Disponible" />
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '200px',
      render: (item: Room) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              navigate(`/app/rooms/${item.id}`);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              navigate(`/app/rooms/${item.id}/edit`);
            }}
          >
            <Edit size={16} />
          </Button>
          {item.isBlocked ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                handleUnblock(item.id);
              }}
              className="text-green-600"
            >
              <Unlock size={16} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setBlockDialogRoom(item);
              }}
              className="text-orange-600"
            >
              <Lock size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              setDeleteId(item.id);
            }}
            className="text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (!establishmentId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Veuillez sélectionner un établissement</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chambres</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les chambres de l'établissement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload size={16} className="mr-2" />
            Importer
          </Button>
          <Button onClick={() => navigate('/app/rooms/create')}>
            <Plus size={16} className="mr-2" />
            Nouvelle chambre
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <DoorOpen className="text-gray-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle2 className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bloquées</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <AlertCircle className="text-red-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher une chambre..."
            />

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="blocked">Bloquées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterFloor} onValueChange={setFilterFloor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les étages</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    Étage {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<DoorClosed size={48} />}
          title="Aucune chambre"
          description="Créez votre première chambre pour commencer"
          action={{
            label: 'Créer une chambre',
            onClick: () => navigate('/app/rooms/create'),
          }}
        />
      ) : (
        <DataTable
          data={filteredRooms}
          columns={columns}
          onRowClick={item => navigate(`/app/rooms/${item.id}`)}
        />
      )}

      {/* Dialog blocage */}
      {blockDialogRoom && (
        <BlockRoomDialog
          isOpen={!!blockDialogRoom}
          onClose={() => setBlockDialogRoom(null)}
          onConfirm={handleBlock}
          roomNumber={blockDialogRoom.number}
          establishmentId={establishmentId}
        />
      )}

      {/* Dialog suppression */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer la chambre"
        description="Êtes-vous sûr ? Cette action est irréversible."
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Dialog d'import */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importer des chambres"
        description="Importez plusieurs chambres depuis un fichier Excel"
        templateDownloadFn={downloadRoomsTemplate}
        onImport={importHook.handleImport}
        onConfirm={handleImportConfirm}
        renderPreview={data => (
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left">Numéro</th>
                  <th className="px-3 py-2 text-left">Étage</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Capacité</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.slice(0, 5).map((row: any, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2">{row.numero}</td>
                    <td className="px-3 py-2">{row.etage}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.capacite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                ... et {data.length - 5} autre(s) ligne(s)
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};

RoomsListPageComponent.displayName = 'RoomsListPage';

export const RoomsListPage = memo(RoomsListPageComponent);

// ============================================================================
// FORMULAIRE CHAMBRE
// ============================================================================

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: RoomFormData) => Promise<void>;
  isLoading?: boolean;
}

const RoomFormComponent = ({ room, onSubmit, isLoading }: RoomFormProps) => {
  const navigate = useNavigate();

  const form = useForm<RoomFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roomSchema) as any,
    defaultValues: room || {
      type: 'double',
      capacity: 2,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="number">Numéro de chambre *</Label>
          <Input {...register('number')} placeholder="Ex: 301" />
          {errors.number && <p className="text-sm text-red-600 mt-1">{errors.number.message}</p>}
        </div>

        <div>
          <Label htmlFor="floor">Étage *</Label>
          <Input type="number" {...register('floor')} placeholder="Ex: 3" />
          {errors.floor && <p className="text-sm text-red-600 mt-1">{errors.floor.message}</p>}
        </div>

        <div>
          <Label htmlFor="building">Bâtiment</Label>
          <Input {...register('building')} placeholder="Ex: A" />
        </div>

        <div>
          <Label htmlFor="type">Type *</Label>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Select onValueChange={value => setValue('type', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROOM_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="capacity">Capacité *</Label>
          <Input type="number" {...register('capacity')} placeholder="Ex: 2" />
          {errors.capacity && (
            <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea {...register('description')} placeholder="Description de la chambre" rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate('/app/rooms')}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : room ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

RoomFormComponent.displayName = 'RoomForm';

export const RoomForm = memo(RoomFormComponent);

// ============================================================================
// PAGE CRÉATION
// ============================================================================

const CreateRoomPageComponent = () => {
  const navigate = useNavigate();
  const { establishmentId } = useCurrentEstablishment();
  const { createRoom, isCreating } = useRooms(establishmentId!);

  const handleSubmit = async (data: RoomFormData) => {
    try {
      const id = await createRoom(data);
      if (id) {
        toast.success('Chambre créée');
        navigate('/app/rooms');
      }
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvelle chambre</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la chambre</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm onSubmit={handleSubmit} isLoading={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
};

CreateRoomPageComponent.displayName = 'CreateRoomPage';

export const CreateRoomPage = memo(CreateRoomPageComponent);

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  RoomsListPage,
  CreateRoomPage,
  RoomForm,
};
