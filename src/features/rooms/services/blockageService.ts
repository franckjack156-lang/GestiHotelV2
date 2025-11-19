/**
 * Room Blockage Service
 *
 * Service for managing room blockages linked to interventions
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  RoomBlockage,
  UpdateBlockageData,
  BlockageStats,
  TopBlockedRoom,
  BlockageFilters,
} from '../types/blockage.types';
import type { Intervention } from '@/features/interventions/types/intervention.types';
import type { Room } from '../types/room.types';

/**
 * Collection path helper
 */
const getBlockagesCollection = (establishmentId: string) =>
  collection(db, `establishments/${establishmentId}/room_blockages`);

/**
 * Calculate duration between two dates
 */
const calculateDuration = (start: Timestamp, end?: Timestamp) => {
  const endDate = end ? end.toDate() : new Date();
  const startDate = start.toDate();
  const diffMs = endDate.getTime() - startDate.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};

/**
 * Calculate estimated revenue loss
 */
const calculateRevenueLoss = (
  pricePerNight: number,
  durationDays: number,
  durationHours: number
): number => {
  const totalDays = durationDays + durationHours / 24;
  return Math.round(pricePerNight * totalDays);
};

/**
 * Create a blockage from an intervention
 */
export const createBlockageFromIntervention = async (
  intervention: Intervention,
  room: Room,
  establishmentId: string
): Promise<string> => {
  try {
    const now = Timestamp.now();

    // Calculer date de déblocage estimée
    let estimatedUnblockDate: Timestamp | undefined;
    if (intervention.estimatedDuration) {
      const estimatedDate = new Date();
      estimatedDate.setHours(estimatedDate.getHours() + intervention.estimatedDuration);
      estimatedUnblockDate = Timestamp.fromDate(estimatedDate);
    }

    const blockageData: Omit<RoomBlockage, 'id'> = {
      establishmentId,
      roomId: room.id,

      // Intervention data
      interventionId: intervention.id,
      interventionTitle: intervention.title,
      interventionType: intervention.type,
      interventionPriority: intervention.priority,

      // Dates
      blockedAt: now,
      estimatedUnblockDate,
      actualUnblockDate: undefined,

      // Duration (initial = 0)
      durationDays: 0,
      durationHours: 0,
      durationMinutes: 0,

      // Financial impact
      roomPricePerNight: room.price,
      estimatedRevenueLoss: room.price
        ? calculateRevenueLoss(room.price, 0, intervention.estimatedDuration || 24)
        : 0,

      // Reason and details
      reason: intervention.description || intervention.title,
      urgency: mapPriorityToUrgency(intervention.priority),
      notes: intervention.location,

      // Responsible
      blockedBy: intervention.createdBy,
      blockedByName: intervention.createdByName || 'Unknown',
      assignedTo: intervention.assignedTo,
      assignedToName: intervention.assignedToName,

      // Status
      isActive: true,
      isOverdue: false,

      // Metadata
      createdAt: now,
      updatedAt: now,
    };

    const blockagesRef = getBlockagesCollection(establishmentId);
    const docRef = await addDoc(blockagesRef, blockageData);

    console.log(`✅ Blockage created: ${docRef.id} for room ${room.number}`);

    return docRef.id;
  } catch (error) {
    console.error('Error creating blockage:', error);
    throw error;
  }
};

/**
 * Map intervention priority to blockage urgency
 */
const mapPriorityToUrgency = (priority: string): 'low' | 'medium' | 'high' | 'critical' => {
  switch (priority) {
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'urgent':
      return 'critical';
    default:
      return 'medium';
  }
};

/**
 * Resolve a blockage (when intervention is completed)
 */
export const resolveBlockage = async (
  blockageId: string,
  establishmentId: string
): Promise<void> => {
  try {
    const blockageRef = doc(db, `establishments/${establishmentId}/room_blockages/${blockageId}`);
    const blockageDoc = await getDoc(blockageRef);

    if (!blockageDoc.exists()) {
      throw new Error('Blockage not found');
    }

    const blockage = blockageDoc.data() as RoomBlockage;
    const now = Timestamp.now();

    // Calculer durée totale
    const duration = calculateDuration(blockage.blockedAt, now);

    // Calculer perte de revenu réelle
    const actualRevenueLoss = blockage.roomPricePerNight
      ? calculateRevenueLoss(blockage.roomPricePerNight, duration.days, duration.hours)
      : 0;

    await updateDoc(blockageRef, {
      actualUnblockDate: now,
      durationDays: duration.days,
      durationHours: duration.hours,
      durationMinutes: duration.minutes,
      estimatedRevenueLoss: actualRevenueLoss,
      isActive: false,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Blockage resolved: ${blockageId} (${duration.days}d ${duration.hours}h)`);
  } catch (error) {
    console.error('Error resolving blockage:', error);
    throw error;
  }
};

/**
 * Resolve blockage for an intervention
 */
export const resolveBlockageForIntervention = async (
  interventionId: string,
  establishmentId: string
): Promise<void> => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    const q = query(
      blockagesRef,
      where('interventionId', '==', interventionId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No active blockage found for intervention ${interventionId}`);
      return;
    }

    const blockageDoc = snapshot.docs[0];
    await resolveBlockage(blockageDoc.id, establishmentId);
  } catch (error) {
    console.error('Error resolving blockage for intervention:', error);
    throw error;
  }
};

/**
 * Get active blockages
 */
export const getActiveBlockages = async (
  establishmentId: string,
  filters?: BlockageFilters
): Promise<RoomBlockage[]> => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    let q = query(blockagesRef, where('isActive', '==', true), orderBy('blockedAt', 'desc'));

    if (filters?.urgency && filters.urgency !== 'all') {
      q = query(q, where('urgency', '==', filters.urgency));
    }

    if (filters?.roomId) {
      q = query(q, where('roomId', '==', filters.roomId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomBlockage[];
  } catch (error) {
    console.error('Error getting active blockages:', error);
    throw error;
  }
};

/**
 * Get blockage history for a room
 */
export const getBlockageHistory = async (
  roomId: string,
  establishmentId: string
): Promise<RoomBlockage[]> => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    const q = query(
      blockagesRef,
      where('roomId', '==', roomId),
      orderBy('blockedAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomBlockage[];
  } catch (error) {
    console.error('Error getting blockage history:', error);
    throw error;
  }
};

/**
 * Get blockage statistics
 */
export const getBlockageStats = async (establishmentId: string): Promise<BlockageStats> => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    const snapshot = await getDocs(blockagesRef);

    const blockages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomBlockage[];

    const activeBlockages = blockages.filter(b => b.isActive);
    const completedBlockages = blockages.filter(b => !b.isActive);
    const overdueBlockages = blockages.filter(b => b.isOverdue);

    // Calculate durations
    const durations = completedBlockages
      .filter(b => b.durationDays !== undefined)
      .map(b => b.durationDays);

    const averageDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const longestBlockage = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestBlockage = durations.length > 0 ? Math.min(...durations) : 0;

    // Calculate revenue loss
    const totalRevenueLoss = blockages
      .filter(b => b.estimatedRevenueLoss)
      .reduce((sum, b) => sum + (b.estimatedRevenueLoss || 0), 0);

    const averageRevenueLoss = blockages.length > 0 ? totalRevenueLoss / blockages.length : 0;

    // By urgency
    const byUrgency = blockages.reduce(
      (acc, b) => {
        acc[b.urgency] = (acc[b.urgency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // By intervention type
    const byInterventionType = blockages.reduce(
      (acc, b) => {
        acc[b.interventionType] = (acc[b.interventionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalActive: activeBlockages.length,
      totalCompleted: completedBlockages.length,
      totalOverdue: overdueBlockages.length,
      averageDurationDays: Math.round(averageDuration * 10) / 10,
      longestBlockageDays: longestBlockage,
      shortestBlockageDays: shortestBlockage,
      totalRevenueLoss,
      averageRevenueLoss: Math.round(averageRevenueLoss),
      byUrgency: byUrgency as Record<string, number>,
      byInterventionType: byInterventionType as Record<string, number>,
    };
  } catch (error) {
    console.error('Error getting blockage stats:', error);
    throw error;
  }
};

/**
 * Get top blocked rooms
 */
export const getTopBlockedRooms = async (
  establishmentId: string,
  limitCount: number = 10
): Promise<TopBlockedRoom[]> => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    const snapshot = await getDocs(blockagesRef);

    const blockages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RoomBlockage[];

    // Group by room
    const roomBlockages = blockages.reduce(
      (acc, blockage) => {
        if (!acc[blockage.roomId]) {
          acc[blockage.roomId] = [];
        }
        acc[blockage.roomId].push(blockage);
        return acc;
      },
      {} as Record<string, RoomBlockage[]>
    );

    // Calculate stats per room
    const topRooms = Object.entries(roomBlockages).map(([roomId, roomBlockageList]) => {
      const totalDays = roomBlockageList.reduce((sum, b) => sum + (b.durationDays || 0), 0);
      const totalRevenueLoss = roomBlockageList.reduce(
        (sum, b) => sum + (b.estimatedRevenueLoss || 0),
        0
      );
      const averageDuration = totalDays / roomBlockageList.length;
      const lastBlockage = roomBlockageList.sort(
        (a, b) => b.blockedAt.seconds - a.blockedAt.seconds
      )[0];

      return {
        roomId,
        roomNumber: '', // Will be filled by caller
        blockageCount: roomBlockageList.length,
        totalDaysBlocked: totalDays,
        totalRevenueLoss,
        lastBlockedAt: lastBlockage.blockedAt,
        averageBlockageDuration: Math.round(averageDuration * 10) / 10,
      };
    });

    // Sort by blockage count and limit
    return topRooms.sort((a, b) => b.blockageCount - a.blockageCount).slice(0, limitCount);
  } catch (error) {
    console.error('Error getting top blocked rooms:', error);
    throw error;
  }
};

/**
 * Subscribe to active blockages (real-time)
 */
export const subscribeToActiveBlockages = (
  establishmentId: string,
  callback: (blockages: RoomBlockage[]) => void,
  errorCallback?: (error: Error) => void
) => {
  try {
    const blockagesRef = getBlockagesCollection(establishmentId);
    const q = query(blockagesRef, where('isActive', '==', true), orderBy('blockedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const blockages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RoomBlockage[];

        callback(blockages);
      },
      (error: Error) => {
        console.error('Error in blockages subscription:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  } catch (error) {
    console.error('Error subscribing to blockages:', error);
    throw error;
  }
};

/**
 * Update blockage
 */
export const updateBlockage = async (
  blockageId: string,
  establishmentId: string,
  data: UpdateBlockageData
): Promise<void> => {
  try {
    const blockageRef = doc(db, `establishments/${establishmentId}/room_blockages/${blockageId}`);

    await updateDoc(blockageRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Blockage updated: ${blockageId}`);
  } catch (error) {
    console.error('Error updating blockage:', error);
    throw error;
  }
};

/**
 * Delete blockage
 */
export const deleteBlockage = async (
  blockageId: string,
  establishmentId: string
): Promise<void> => {
  try {
    const blockageRef = doc(db, `establishments/${establishmentId}/room_blockages/${blockageId}`);
    await deleteDoc(blockageRef);

    console.log(`✅ Blockage deleted: ${blockageId}`);
  } catch (error) {
    console.error('Error deleting blockage:', error);
    throw error;
  }
};

/**
 * Update blockage durations (for active blockages)
 * Should be called periodically or when displaying
 */
export const updateBlockageDurations = async (
  blockages: RoomBlockage[]
): Promise<RoomBlockage[]> => {
  return blockages.map(blockage => {
    if (blockage.isActive) {
      const duration = calculateDuration(blockage.blockedAt);
      return {
        ...blockage,
        durationDays: duration.days,
        durationHours: duration.hours,
        durationMinutes: duration.minutes,
      };
    }
    return blockage;
  });
};
