/**
 * ============================================================================
 * USE BLOCKAGES HOOK
 * ============================================================================
 *
 * React hook for managing room blockages with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getBlockageHistory,
  getBlockageStats,
  getTopBlockedRooms,
  subscribeToActiveBlockages,
  updateBlockageDurations,
  resolveBlockage,
  updateBlockage,
  deleteBlockage,
} from '../services/blockageService';
import type {
  RoomBlockage,
  BlockageStats,
  TopBlockedRoom,
  BlockageFilters,
  UpdateBlockageData,
} from '../types/blockage.types';

// ============================================================================
// TYPES
// ============================================================================

interface UseBlockagesReturn {
  // Data
  activeBlockages: RoomBlockage[];
  stats: BlockageStats | null;
  topBlockedRooms: TopBlockedRoom[];

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;

  // Error states
  error: Error | null;

  // Actions
  resolveBlockage: (blockageId: string) => Promise<void>;
  updateBlockage: (blockageId: string, data: UpdateBlockageData) => Promise<void>;
  deleteBlockage: (blockageId: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshTopRooms: () => Promise<void>;
}

interface UseBlockageHistoryReturn {
  // Data
  history: RoomBlockage[];

  // Loading state
  isLoading: boolean;

  // Error state
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK - Active Blockages with Real-time
// ============================================================================

export const useBlockages = (filters?: BlockageFilters): UseBlockagesReturn => {
  const { currentEstablishment } = useAuth();
  const establishmentId = currentEstablishment?.id;

  const [activeBlockages, setActiveBlockages] = useState<RoomBlockage[]>([]);
  const [stats, setStats] = useState<BlockageStats | null>(null);
  const [topBlockedRooms, setTopBlockedRooms] = useState<TopBlockedRoom[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // REAL-TIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    if (!establishmentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToActiveBlockages(
      establishmentId,
      async blockages => {
        // Update durations for active blockages
        const updated = await updateBlockageDurations(blockages);
        setActiveBlockages(updated);
        setIsLoading(false);
      },
      err => {
        console.error('Error in blockages subscription:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [establishmentId, filters]);

  // ============================================================================
  // LOAD STATISTICS
  // ============================================================================

  const refreshStats = useCallback(async () => {
    if (!establishmentId) return;

    setIsLoadingStats(true);
    try {
      const blockageStats = await getBlockageStats(establishmentId);
      setStats(blockageStats);
    } catch (err) {
      console.error('Error loading blockage stats:', err);
      setError(err as Error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ============================================================================
  // LOAD TOP BLOCKED ROOMS
  // ============================================================================

  const refreshTopRooms = useCallback(async () => {
    if (!establishmentId) return;

    try {
      const topRooms = await getTopBlockedRooms(establishmentId, 10);
      setTopBlockedRooms(topRooms);
    } catch (err) {
      console.error('Error loading top blocked rooms:', err);
      setError(err as Error);
    }
  }, [establishmentId]);

  useEffect(() => {
    refreshTopRooms();
  }, [refreshTopRooms]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleResolveBlockage = useCallback(
    async (blockageId: string) => {
      if (!establishmentId) return;

      try {
        await resolveBlockage(blockageId, establishmentId);
        // Real-time subscription will update activeBlockages automatically
        await refreshStats();
        await refreshTopRooms();
      } catch (err) {
        console.error('Error resolving blockage:', err);
        throw err;
      }
    },
    [establishmentId, refreshStats, refreshTopRooms]
  );

  const handleUpdateBlockage = useCallback(
    async (blockageId: string, data: UpdateBlockageData) => {
      if (!establishmentId) return;

      try {
        await updateBlockage(blockageId, establishmentId, data);
        // Real-time subscription will update activeBlockages automatically
      } catch (err) {
        console.error('Error updating blockage:', err);
        throw err;
      }
    },
    [establishmentId]
  );

  const handleDeleteBlockage = useCallback(
    async (blockageId: string) => {
      if (!establishmentId) return;

      try {
        await deleteBlockage(blockageId, establishmentId);
        // Real-time subscription will update activeBlockages automatically
        await refreshStats();
        await refreshTopRooms();
      } catch (err) {
        console.error('Error deleting blockage:', err);
        throw err;
      }
    },
    [establishmentId, refreshStats, refreshTopRooms]
  );

  return {
    activeBlockages,
    stats,
    topBlockedRooms,
    isLoading,
    isLoadingStats,
    error,
    resolveBlockage: handleResolveBlockage,
    updateBlockage: handleUpdateBlockage,
    deleteBlockage: handleDeleteBlockage,
    refreshStats,
    refreshTopRooms,
  };
};

// ============================================================================
// BLOCKAGE HISTORY HOOK
// ============================================================================

export const useBlockageHistory = (roomId: string): UseBlockageHistoryReturn => {
  const { currentEstablishment } = useAuth();
  const establishmentId = currentEstablishment?.id;

  const [history, setHistory] = useState<RoomBlockage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadHistory = useCallback(async () => {
    if (!establishmentId || !roomId) {
      console.log('⏭️ Skipping history load - missing establishmentId or roomId:', {
        establishmentId,
        roomId,
      });
      setIsLoading(false);
      return;
    }

    console.log(
      '📚 Loading blockage history for roomId:',
      roomId,
      'in establishment:',
      establishmentId
    );
    setIsLoading(true);
    setError(null);

    try {
      const blockageHistory = await getBlockageHistory(roomId, establishmentId);
      console.log('📚 History loaded:', blockageHistory.length, 'blockage(s)');
      setHistory(blockageHistory);
    } catch (err) {
      console.error('Error loading blockage history:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, roomId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    refresh: loadHistory,
  };
};

// ============================================================================
// ACTIVE BLOCKAGES COUNT HOOK (for badges)
// ============================================================================

export const useActiveBlockagesCount = (): number => {
  const { activeBlockages } = useBlockages();
  return activeBlockages.length;
};
