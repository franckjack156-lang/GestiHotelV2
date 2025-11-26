/**
 * Rooms Hook
 *
 * Hook pour g�rer les op�rations CRUD sur les chambres
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import type { Room, CreateRoomData, UpdateRoomData, BlockRoomData } from '../types/room.types';

const COLLECTION_NAME = 'rooms';

/**
 * Calculate blockage duration
 */
const calculateBlockageDuration = (start: Timestamp, end: Timestamp) => {
  const endDate = end.toDate();
  const startDate = start.toDate();
  const diffMs = endDate.getTime() - startDate.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};

/**
 * Hook pour gérer les chambres d'un établissement
 */
export const useRooms = (establishmentId: string) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // �couter les chambres en temps r�el
  useEffect(() => {
    if (!establishmentId) {
      setRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, COLLECTION_NAME),
      where('establishmentId', '==', establishmentId),
      orderBy('floor', 'asc'),
      orderBy('number', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const roomsData = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Room
        );
        setRooms(roomsData);
        setIsLoading(false);
      },
      _error => {
        toast.error('Erreur lors du chargement des chambres');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId]);

  /**
   * Cr�er une chambre
   */
  const createRoom = useCallback(
    async (data: CreateRoomData): Promise<string | null> => {
      if (!user || !establishmentId) {
        toast.error('Impossible de cr�er la chambre');
        return null;
      }

      setIsCreating(true);
      try {
        // Préparer les données
        const roomData: Record<string, unknown> = {
          ...data,
          establishmentId,
          status: 'available' as const,
          isBlocked: false,
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.id,
        };

        // Supprimer les champs undefined
        Object.keys(roomData).forEach(key => {
          if (roomData[key] === undefined) {
            delete roomData[key];
          }
        });

        const docRef = await addDoc(collection(db, COLLECTION_NAME), roomData);
        toast.success('Chambre cr��e avec succ�s');
        return docRef.id;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error('Erreur lors de la cr�ation', {
          description: message,
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user, establishmentId]
  );

  /**
   * Mettre � jour une chambre
   */
  const updateRoom = useCallback(
    async (roomId: string, data: UpdateRoomData): Promise<boolean> => {
      if (!user) {
        toast.error('Vous devez �tre connect�');
        return false;
      }

      setIsUpdating(true);
      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);

        // Préparer les données en nettoyant les undefined
        const updateData: Record<string, unknown> = {
          ...data,
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.id,
        };

        // Supprimer les champs undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await updateDoc(roomRef, updateData);

        toast.success('Chambre mise � jour');
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error('Erreur lors de la mise � jour', {
          description: message,
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [user]
  );

  /**
   * Supprimer une chambre
   */
  const deleteRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!user) {
        toast.error('Vous devez �tre connect�');
        return false;
      }

      setIsDeleting(true);
      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);
        await deleteDoc(roomRef);

        toast.success('Chambre supprim�e');
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error('Erreur lors de la suppression', {
          description: message,
        });
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [user]
  );

  /**
   * Bloquer une chambre
   */
  const blockRoom = useCallback(
    async (roomId: string, blockData: BlockRoomData): Promise<boolean> => {
      if (!user || !establishmentId) {
        toast.error('Vous devez être connecté');
        return false;
      }

      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);

        // Récupérer la chambre pour avoir toutes ses infos
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) {
          toast.error('Chambre introuvable');
          return false;
        }

        const room = { id: roomDoc.id, ...roomDoc.data() } as Room;

        // Préparer les données en nettoyant les undefined
        const blockUpdateData: Record<string, unknown> = {
          isBlocked: true,
          blockReason: blockData.reason,
          blockedAt: serverTimestamp(),
          blockedBy: blockData.userId,
          status: 'blocked',
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.id,
        };

        // Supprimer les champs undefined
        Object.keys(blockUpdateData).forEach(key => {
          if (blockUpdateData[key] === undefined) {
            delete blockUpdateData[key];
          }
        });

        await updateDoc(roomRef, blockUpdateData);

        // Créer une entrée dans room_blockages pour le tracking
        const blockagesRef = collection(db, `establishments/${establishmentId}/room_blockages`);
        const now = Timestamp.now();

        await addDoc(blockagesRef, {
          establishmentId,
          roomId: room.id,

          // Pas d'intervention liée pour un blocage manuel
          interventionId: null,
          interventionTitle: 'Blocage Manuel',
          interventionType: 'other',
          interventionPriority: 'normal',

          // Dates
          blockedAt: now,
          // Ne pas inclure estimatedUnblockDate et actualUnblockDate (undefined non supporté par Firebase)

          // Durée (initial = 0)
          durationDays: 0,
          durationHours: 0,
          durationMinutes: 0,

          // Financial impact
          roomPricePerNight: room.price || 0,
          estimatedRevenueLoss: 0,

          // Reason and details
          reason: blockData.reason,
          urgency: 'medium',
          notes: 'Blocage manuel depuis la page chambre',

          // Responsible
          blockedBy: blockData.userId,
          blockedByName: user.displayName || user.email || 'Unknown',
          // Ne pas inclure assignedTo et assignedToName (undefined non supporté par Firebase)

          // Status
          isActive: true,
          isOverdue: false,

          // Metadata
          createdAt: now,
          updatedAt: now,
        });

        toast.success('Chambre bloquée');
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error('Erreur lors du blocage', {
          description: message,
        });
        return false;
      }
    },
    [user, establishmentId]
  );

  /**
   * D�bloquer une chambre
   */
  const unblockRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!user || !establishmentId) {
        toast.error('Vous devez être connecté');
        return false;
      }

      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);

        // Résoudre les blocages actifs dans room_blockages
        const blockagesRef = collection(db, `establishments/${establishmentId}/room_blockages`);
        const activeBlockagesQuery = query(
          blockagesRef,
          where('roomId', '==', roomId),
          where('isActive', '==', true)
        );

        const activeBlockagesSnapshot = await getDocs(activeBlockagesQuery);
        const now = Timestamp.now();

        // Résoudre chaque blocage actif
        for (const blockageDoc of activeBlockagesSnapshot.docs) {
          const blockage = blockageDoc.data();
          const duration = calculateBlockageDuration(blockage.blockedAt, now);
          const revenueLoss = blockage.roomPricePerNight
            ? Math.round(blockage.roomPricePerNight * (duration.days + duration.hours / 24))
            : 0;

          // Utiliser la référence du document directement
          await updateDoc(blockageDoc.ref, {
            actualUnblockDate: now,
            durationDays: duration.days,
            durationHours: duration.hours,
            durationMinutes: duration.minutes,
            estimatedRevenueLoss: revenueLoss,
            isActive: false,
            updatedAt: serverTimestamp(),
          });
        }

        // Préparer les données en nettoyant les undefined
        const unblockUpdateData: Record<string, unknown> = {
          isBlocked: false,
          blockReason: null,
          blockedAt: null,
          blockedBy: null,
          status: 'available',
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.id,
        };

        // Supprimer les champs undefined
        Object.keys(unblockUpdateData).forEach(key => {
          if (unblockUpdateData[key] === undefined) {
            delete unblockUpdateData[key];
          }
        });

        await updateDoc(roomRef, unblockUpdateData);

        toast.success('Chambre d�bloqu�e');
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error('Erreur lors du d�blocage', {
          description: message,
        });
        return false;
      }
    },
    [user, establishmentId]
  );

  /**
   * Obtenir une chambre par ID
   */
  const getRoomById = useCallback(
    (roomId: string): Room | undefined => {
      return rooms.find(room => room.id === roomId);
    },
    [rooms]
  );

  /**
   * Obtenir des statistiques
   */
  const getStats = useCallback(() => {
    const total = rooms.length;
    const available = rooms.filter(r => r.status === 'available' && !r.isBlocked).length;
    const blocked = rooms.filter(r => r.isBlocked).length;
    const inMaintenance = rooms.filter(r => r.status === 'maintenance').length;
    const byCleaning = rooms.filter(r => r.status === 'cleaning').length;

    return {
      total,
      available,
      blocked,
      inMaintenance,
      byCleaning,
    };
  }, [rooms]);

  return {
    rooms,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createRoom,
    updateRoom,
    deleteRoom,
    blockRoom,
    unblockRoom,
    getRoomById,
    getStats,
  };
};
