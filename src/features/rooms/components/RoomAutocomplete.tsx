/**
 * ============================================================================
 * ROOM AUTOCOMPLETE
 * ============================================================================
 *
 * Composant d'autocomplete pour la sélection de chambres
 * Affiche le statut de la chambre (bloquée/libre) et remplit automatiquement
 * les champs étage et bâtiment
 *
 * Utilisation:
 * ```tsx
 * <RoomAutocomplete
 *   value={roomNumber}
 *   onChange={(room) => {
 *     setRoomNumber(room.number);
 *     setFloor(room.floor);
 *     setBuilding(room.building);
 *   }}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Loader2, AlertCircle, Check, Building2, Lock, Unlock, Plus, X } from 'lucide-react';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { cn } from '@/shared/utils/cn';
import type { Room, CreateRoomData } from '@/features/rooms/types/room.types';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface RoomAutocompleteProps {
  /** Numéro de chambre sélectionné */
  value?: string;

  /** Callback quand une chambre est sélectionnée */
  onChange: (room: Room | null) => void;

  /** Placeholder */
  placeholder?: string;

  /** Désactivé */
  disabled?: boolean;

  /** Message d'erreur */
  error?: string;

  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export const RoomAutocomplete: React.FC<RoomAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher une chambre...',
  disabled = false,
  error,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState<CreateRoomData>({
    number: '',
    floor: 0,
    building: '',
    type: 'single',
    capacity: 1,
  });

  // Récupérer l'établissement courant
  const { currentEstablishment } = useCurrentEstablishment();

  // Charger toutes les chambres
  const { rooms, isLoading, createRoom, isCreating } = useRooms(currentEstablishment?.id || '');

  // Filtrer les chambres selon le terme de recherche
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    if (!searchTerm) return rooms;

    const term = searchTerm.toLowerCase();
    return rooms.filter(room => room.number.toLowerCase().includes(term));
  }, [rooms, searchTerm]);

  // Trouver la chambre sélectionnée
  const selectedRoom = useMemo(() => {
    if (!value || !rooms) return null;
    return rooms.find(room => room.number === value) || null;
  }, [value, rooms]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelect = (room: Room) => {
    onChange(room);
    setOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  const handleOpenCreateDialog = () => {
    // Pré-remplir le numéro de chambre avec le terme de recherche
    setNewRoomData({
      number: searchTerm || '',
      floor: 0,
      building: '',
      type: 'single',
      capacity: 1,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!newRoomData.number) {
      toast.error('Le numéro de chambre est requis');
      return;
    }

    const roomId = await createRoom(newRoomData);
    if (roomId) {
      // Attendre un peu que le listener temps réel reçoive la nouvelle chambre
      setTimeout(() => {
        const createdRoom = rooms?.find(r => r.id === roomId);
        if (createdRoom) {
          onChange(createdRoom);
        }
      }, 500);

      setIsCreateDialogOpen(false);
      setOpen(false);
      setSearchTerm('');
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getRoomStatusBadge = (room: Room) => {
    if (room.isBlocked || room.status === 'blocked') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Lock className="h-3 w-3" />
          Bloquée
        </Badge>
      );
    }

    if (room.status === 'maintenance') {
      return (
        <Badge className="gap-1 bg-orange-100 text-orange-800">
          <AlertCircle className="h-3 w-3" />
          Maintenance
        </Badge>
      );
    }

    if (room.status === 'cleaning') {
      return (
        <Badge className="gap-1 bg-blue-100 text-blue-800">
          <AlertCircle className="h-3 w-3" />
          Nettoyage
        </Badge>
      );
    }

    return (
      <Badge className="gap-1 bg-green-100 text-green-800">
        <Unlock className="h-3 w-3" />
        Libre
      </Badge>
    );
  };

  // TODO: getRoomDisplayText is computed but never used
  // const getRoomDisplayText = (room: Room): string => {
  //   const parts = [room.number];
  //   if (room.building) parts.push(room.building);
  //   parts.push(`Étage ${room.floor}`);
  //   return parts.join(' · ');
  // };

  // ============================================================================
  // RENDER
  // ============================================================================

  // État de chargement
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-2 border rounded-md', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement des chambres...</span>
      </div>
    );
  }

  // Pas d'affichage d'erreur car useRooms ne retourne pas d'erreur
  // Les erreurs sont gérées via toast dans le hook

  // Aucune chambre disponible - afficher quand même l'autocomplete avec option de création
  const hasNoRooms = !rooms || rooms.length === 0;

  return (
    <div className="space-y-2">
      {hasNoRooms && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Aucune chambre n'existe encore. Vous pouvez en créer une directement ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-red-500',
              className
            )}
            disabled={disabled}
          >
            {selectedRoom ? (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {selectedRoom.number}
              </div>
            ) : hasNoRooms ? (
              'Créer une nouvelle chambre...'
            ) : (
              placeholder
            )}
            {selectedRoom ? (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={e => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            ) : (
              <Building2 className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher par numéro..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <p className="text-sm text-muted-foreground">Aucune chambre trouvée.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCreateDialog}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer une nouvelle chambre
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredRooms.map(room => {
                const isSelected = selectedRoom?.id === room.id;

                return (
                  <CommandItem
                    key={room.id}
                    value={room.number}
                    onSelect={() => handleSelect(room)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isSelected && <Check className="h-4 w-4" />}
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">Chambre {room.number}</div>
                        <div className="text-xs text-muted-foreground">
                          {room.building && `${room.building} · `}
                          Étage {room.floor}
                          {room.type && ` · ${room.type}`}
                        </div>
                      </div>
                    </div>
                    {getRoomStatusBadge(room)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Affichage du statut de la chambre sélectionnée */}
      {selectedRoom && (
        <div className="flex items-center gap-2">
          {getRoomStatusBadge(selectedRoom)}
          {selectedRoom.isBlocked && selectedRoom.blockReason && (
            <span className="text-xs text-muted-foreground">
              Raison : {selectedRoom.blockReason}
            </span>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Dialog de création rapide de chambre */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle chambre</DialogTitle>
            <DialogDescription>
              Remplissez les informations essentielles pour créer rapidement une chambre.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomNumber">Numéro de chambre *</Label>
              <Input
                id="roomNumber"
                value={newRoomData.number}
                onChange={e => setNewRoomData({ ...newRoomData, number: e.target.value })}
                placeholder="Ex: 301"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floor">Étage *</Label>
                <Input
                  id="floor"
                  type="number"
                  value={newRoomData.floor}
                  onChange={e =>
                    setNewRoomData({ ...newRoomData, floor: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacité *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newRoomData.capacity}
                  onChange={e =>
                    setNewRoomData({ ...newRoomData, capacity: parseInt(e.target.value) || 1 })
                  }
                  placeholder="1"
                  min={1}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="building">Bâtiment (optionnel)</Label>
              <Input
                id="building"
                value={newRoomData.building || ''}
                onChange={e => setNewRoomData({ ...newRoomData, building: e.target.value })}
                placeholder="Ex: Bâtiment A"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type de chambre *</Label>
              <select
                id="type"
                value={newRoomData.type}
                onChange={e => setNewRoomData({ ...newRoomData, type: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="single">Simple</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="suite">Suite</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer la chambre
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default RoomAutocomplete;
