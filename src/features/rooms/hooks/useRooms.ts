/**
 * Rooms Hook
 *
 * Hook pour gérer les opérations CRUD sur les chambres
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import type { Room, CreateRoomData, UpdateRoomData, BlockRoomData } from '../types/room.types';

const COLLECTION_NAME = 'rooms';

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

  // Écouter les chambres en temps réel
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
            } as Room)
        );
        setRooms(roomsData);
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching rooms:', error);
        toast.error('Erreur lors du chargement des chambres');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [establishmentId]);

  /**
   * Créer une chambre
   */
  const createRoom = useCallback(
    async (data: CreateRoomData): Promise<string | null> => {
      if (!user || !establishmentId) {
        toast.error('Impossible de créer la chambre');
        return null;
      }

      setIsCreating(true);
      try {
        const roomData = {
          ...data,
          establishmentId,
          status: 'available' as const,
          isBlocked: false,
          amenities: data.amenities || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), roomData);
        toast.success('Chambre créée avec succès');
        return docRef.id;
      } catch (error: any) {
        console.error('Error creating room:', error);
        toast.error('Erreur lors de la création', {
          description: error.message,
        });
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [user, establishmentId]
  );

  /**
   * Mettre à jour une chambre
   */
  const updateRoom = useCallback(
    async (roomId: string, data: UpdateRoomData): Promise<boolean> => {
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      setIsUpdating(true);
      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);
        await updateDoc(roomRef, {
          ...data,
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.uid,
        });

        toast.success('Chambre mise à jour');
        return true;
      } catch (error: any) {
        console.error('Error updating room:', error);
        toast.error('Erreur lors de la mise à jour', {
          description: error.message,
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
        toast.error('Vous devez être connecté');
        return false;
      }

      setIsDeleting(true);
      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);
        await deleteDoc(roomRef);

        toast.success('Chambre supprimée');
        return true;
      } catch (error: any) {
        console.error('Error deleting room:', error);
        toast.error('Erreur lors de la suppression', {
          description: error.message,
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
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);
        await updateDoc(roomRef, {
          isBlocked: true,
          blockReason: blockData.reason,
          blockedAt: serverTimestamp(),
          blockedBy: blockData.userId,
          status: 'blocked',
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.uid,
        });

        toast.success('Chambre bloquée');
        return true;
      } catch (error: any) {
        console.error('Error blocking room:', error);
        toast.error('Erreur lors du blocage', {
          description: error.message,
        });
        return false;
      }
    },
    [user]
  );

  /**
   * Débloquer une chambre
   */
  const unblockRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      try {
        const roomRef = doc(db, COLLECTION_NAME, roomId);
        await updateDoc(roomRef, {
          isBlocked: false,
          blockReason: null,
          blockedAt: null,
          blockedBy: null,
          status: 'available',
          updatedAt: serverTimestamp(),
          lastModifiedBy: user.uid,
        });

        toast.success('Chambre débloquée');
        return true;
      } catch (error: any) {
        console.error('Error unblocking room:', error);
        toast.error('Erreur lors du déblocage', {
          description: error.message,
        });
        return false;
      }
    },
    [user]
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
