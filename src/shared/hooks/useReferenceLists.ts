/**
 * ============================================================================
 * REFERENCE LISTS HOOKS - VERSION CORRIGÉE
 * ============================================================================
 *
 * Hooks React avec cache Zustand pour listes de référence
 *
 * Destination: src/shared/hooks/useReferenceLists.ts
 */

import { useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import referenceListsService from '@/shared/services/referenceListsService';
import type {
  EstablishmentReferenceLists,
  ListKey,
  ListConfig,
  ReferenceItem,
  CreateItemInput,
  // UpdateItemInput, // TODO: Imported but unused
  ImportOptions,
  ImportResult,
  ReferenceListsExportOptions,
  ListAnalytics,
  SmartSuggestion,
  ValidationResult,
} from '@/shared/types/reference-lists.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { logger } from '@/core/utils/logger';

// ============================================================================
// STORE ZUSTAND
// ============================================================================

interface ReferenceListsState {
  cache: Record<string, EstablishmentReferenceLists>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  listeners: Record<string, () => void>;

  setLists: (establishmentId: string, lists: EstablishmentReferenceLists) => void;
  setLoading: (establishmentId: string, isLoading: boolean) => void;
  setError: (establishmentId: string, error: string | null) => void;
  addListener: (establishmentId: string, unsubscribe: () => void) => void;
  removeListener: (establishmentId: string) => void;
  clear: (establishmentId: string) => void;
  clearAll: () => void;
}

const useReferenceListsStore = create<ReferenceListsState>()(
  devtools(
    persist(
      // TODO: get unused in function
      set => ({
        cache: {},
        loading: {},
        errors: {},
        listeners: {},

        setLists: (establishmentId, lists) =>
          set(state => {
            const newCache = { ...state.cache };
            newCache[establishmentId] = lists;

            const newLoading = { ...state.loading };
            delete newLoading[establishmentId];

            const newErrors = { ...state.errors };
            delete newErrors[establishmentId];

            return {
              cache: newCache,
              loading: newLoading,
              errors: newErrors,
            };
          }),

        setLoading: (establishmentId, isLoading) =>
          set(state => {
            const newLoading = { ...state.loading };
            if (isLoading) {
              newLoading[establishmentId] = true;
            } else {
              delete newLoading[establishmentId];
            }
            return { loading: newLoading };
          }),

        setError: (establishmentId, error) =>
          set(state => {
            const newErrors = { ...state.errors };
            const newLoading = { ...state.loading };

            if (error) {
              newErrors[establishmentId] = error;
            } else {
              delete newErrors[establishmentId];
            }

            delete newLoading[establishmentId];

            return { errors: newErrors, loading: newLoading };
          }),

        addListener: (establishmentId, unsubscribe) =>
          set(state => {
            const newListeners = { ...state.listeners };
            const oldListener = state.listeners[establishmentId];
            if (oldListener) oldListener();
            newListeners[establishmentId] = unsubscribe;
            return { listeners: newListeners };
          }),

        removeListener: establishmentId =>
          set(state => {
            const newListeners = { ...state.listeners };
            const listener = newListeners[establishmentId];
            if (listener) {
              listener();
              delete newListeners[establishmentId];
            }
            return { listeners: newListeners };
          }),

        clear: establishmentId =>
          set(state => {
            const newCache = { ...state.cache };
            delete newCache[establishmentId];

            const newLoading = { ...state.loading };
            delete newLoading[establishmentId];

            const newErrors = { ...state.errors };
            delete newErrors[establishmentId];

            const listener = state.listeners[establishmentId];
            if (listener) listener();
            const newListeners = { ...state.listeners };
            delete newListeners[establishmentId];

            return {
              cache: newCache,
              loading: newLoading,
              errors: newErrors,
              listeners: newListeners,
            };
          }),

        clearAll: () =>
          set(state => {
            Object.values(state.listeners).forEach(listener => listener());

            return {
              cache: {},
              loading: {},
              errors: {},
              listeners: {},
            };
          }),
      }),
      {
        name: 'reference-lists-store',
        partialize: state => ({
          cache: state.cache,
        }),
      }
    ),
    { name: 'reference-lists-store' }
  )
);

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAllReferenceLists = (options?: { realtime?: boolean; autoLoad?: boolean }) => {
  const { currentEstablishment } = useCurrentEstablishment();
  const establishmentId = currentEstablishment?.id;
  const cache = useReferenceListsStore(state => state.cache);
  const loading = useReferenceListsStore(state => state.loading);
  const errors = useReferenceListsStore(state => state.errors);
  const setLists = useReferenceListsStore(state => state.setLists);
  const setLoading = useReferenceListsStore(state => state.setLoading);
  const setError = useReferenceListsStore(state => state.setError);
  const addListener = useReferenceListsStore(state => state.addListener);
  const removeListener = useReferenceListsStore(state => state.removeListener);

  const data = establishmentId ? cache[establishmentId] : undefined;
  const isLoading = establishmentId ? !!loading[establishmentId] : false;
  const error = establishmentId ? errors[establishmentId] : undefined;

  // Charger les données
  const load = useCallback(async () => {
    if (!establishmentId) {
      return;
    }

    try {
      setLoading(establishmentId, true);
      setError(establishmentId, null);

      const lists = await referenceListsService.getAllLists(establishmentId);

      if (lists) {
        setLists(establishmentId, lists);
      } else {
        setError(establishmentId, 'Listes non initialisées');
      }
    } catch (err) {
      setError(establishmentId, err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [establishmentId, setLists, setLoading, setError]);

  // Setup temps réel
  useEffect(() => {
    if (!establishmentId || !options?.realtime) {
      return;
    }
    const docRef = doc(db, 'establishments', establishmentId, 'config', 'reference-lists');

    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setLists(establishmentId, {
            ...data,
            lastModified: data.lastModified?.toDate
              ? data.lastModified.toDate()
              : data.lastModified || new Date(),
            lists: Object.entries(data.lists || {}).reduce((acc, [key, config]: [string, any]) => {
              acc[key] = {
                ...config,
                items: ((config.items as any[]) || []).map((item: any) => ({
                  ...item,
                  createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt,
                  updatedAt: item.updatedAt?.toDate ? item.updatedAt.toDate() : item.updatedAt,
                  lastUsed: item.lastUsed?.toDate ? item.lastUsed.toDate() : item.lastUsed,
                })),
              } as ListConfig;
              return acc;
            }, {} as Record<string, ListConfig>),
          } as EstablishmentReferenceLists);
        }
      },
      error => {
        logger.error('❌ [Snapshot] Erreur:', error);
        setError(establishmentId, error.message);
      }
    );

    addListener(establishmentId, unsubscribe);

    return () => {
      removeListener(establishmentId);
    };
  }, [establishmentId, options?.realtime, setLists, setError, addListener, removeListener]);

  // Auto-load
  useEffect(() => {
    if (options?.autoLoad !== false && establishmentId && !data && !isLoading) {
      load();
    }
  }, [establishmentId, data, isLoading, load, options?.autoLoad]);

  const getList = useCallback(
    (listKey: ListKey): ListConfig | undefined => {
      return data?.lists[listKey];
    },
    [data]
  );

  const getActiveItems = useCallback(
    (listKey: ListKey): ReferenceItem[] => {
      const list = getList(listKey);
      if (!list) return [];

      return list.items.filter(item => item.isActive).sort((a, b) => a.order - b.order);
    },
    [getList]
  );

  const getItemByValue = useCallback(
    (listKey: ListKey, value: string): ReferenceItem | undefined => {
      const list = getList(listKey);
      return list?.items.find(item => item.value === value);
    },
    [getList]
  );

  const getLabelByValue = useCallback(
    (listKey: ListKey, value: string): string => {
      const item = getItemByValue(listKey, value);
      return item?.label || value;
    },
    [getItemByValue]
  );

  const hasListKey = useCallback(
    (listKey: string): boolean => {
      return !!data?.lists[listKey];
    },
    [data]
  );

  return {
    data,
    isLoading,
    error,

    getList,
    getActiveItems,
    getItemByValue,
    getLabelByValue,
    hasListKey,

    reload: load,

    hasData: !!data,
    isInitialized: !!data || !!error,
  };
};

// ============================================================================
// HOOK POUR UNE LISTE SPÉCIFIQUE
// ============================================================================

export const useReferenceList = (listKey: ListKey) => {
  const { currentEstablishment } = useCurrentEstablishment();
  const { user } = useAuth(); // ✅ CORRIGÉ : useAuth au lieu de useAuthStore

  // TODO: get unused in destructuring
  const {
    // data, // TODO: Unused
    isLoading,
    error,
    getList,
    getActiveItems,
    getItemByValue,
    getLabelByValue,
    reload,
  } = useAllReferenceLists({ realtime: true, autoLoad: true });

  // TODO: getItemByValue and getLabelByValue and reload unused here
  const listConfig = useMemo(() => getList(listKey), [getList, listKey]);
  const activeItems = useMemo(() => getActiveItems(listKey), [getActiveItems, listKey]);

  const addItem = useCallback(
    async (input: CreateItemInput) => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      await referenceListsService.addItem(currentEstablishment.id, user.id, listKey, input);
      await reload();
    },
    [currentEstablishment?.id, user?.id, listKey, reload]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<Omit<ReferenceItem, 'id'>>) => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      await referenceListsService.updateItem(currentEstablishment.id, user.id, listKey, {
        itemId,
        ...updates,
      });
      await reload();
    },
    [currentEstablishment?.id, user?.id, listKey, reload]
  );

  const deactivateItem = useCallback(
    async (itemId: string) => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      await referenceListsService.deactivateItem(currentEstablishment.id, user.id, listKey, itemId);
      await reload();
    },
    [currentEstablishment?.id, user?.id, listKey, reload]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      await referenceListsService.deleteItem(currentEstablishment.id, user.id, listKey, itemId);
      await reload();
    },
    [currentEstablishment?.id, user?.id, listKey, reload]
  );

  const reorderItems = useCallback(
    async (itemIds: string[]) => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      await referenceListsService.reorderItems(currentEstablishment.id, user.id, listKey, itemIds);
      await reload();
    },
    [currentEstablishment?.id, user?.id, listKey, reload]
  );

  const getAnalytics = useCallback(async (): Promise<ListAnalytics | null> => {
    if (!currentEstablishment?.id) return null;

    return await referenceListsService.getListAnalytics(currentEstablishment.id, listKey);
  }, [currentEstablishment?.id, listKey]);

  const validate = useCallback((item: Partial<ReferenceItem>): ValidationResult => {
    return referenceListsService.validateItem(item);
  }, []);

  const getSuggestions = useCallback((item: Partial<ReferenceItem>): SmartSuggestion[] => {
    return referenceListsService.getSuggestions(item);
  }, []);

  return {
    listConfig,
    items: listConfig?.items || [],
    activeItems,
    isLoading,
    error,
    establishmentId: currentEstablishment?.id,

    getItemByValue: (value: string) => getItemByValue(listKey, value),
    getLabelByValue: (value: string) => getLabelByValue(listKey, value),

    addItem,
    updateItem,
    deactivateItem,
    deleteItem,
    reorderItems,

    getAnalytics,

    validate,
    getSuggestions,

    reload,

    hasData: !!listConfig,
    isEmpty: activeItems.length === 0,
    allowCustom: listConfig?.allowCustom || false,
    isRequired: listConfig?.isRequired || false,
    isSystem: listConfig?.isSystem || false,
  };
};

// ============================================================================
// HOOK POUR IMPORT/EXPORT
// ============================================================================

export const useImportExport = () => {
  const { currentEstablishment } = useCurrentEstablishment();
  const { user } = useAuth(); // ✅ CORRIGÉ : useAuth au lieu de useAuthStore
  const { reload } = useAllReferenceLists();

  const exportToExcel = useCallback(
    async (options: ReferenceListsExportOptions): Promise<Blob> => {
      if (!currentEstablishment?.id) {
        throw new Error('Établissement non trouvé');
      }

      return await referenceListsService.exportToExcel(currentEstablishment.id, options);
    },
    [currentEstablishment?.id]
  );

  const importFromFile = useCallback(
    async (file: File, listKey: ListKey, options: ImportOptions): Promise<ImportResult> => {
      if (!currentEstablishment?.id || !user?.id) {
        throw new Error('Établissement ou utilisateur non trouvé');
      }

      const result = await referenceListsService.importFromFile(
        currentEstablishment.id,
        user.id,
        file,
        listKey,
        options
      );

      if (result.success && !options.dryRun) {
        await reload();
      }

      return result;
    },
    [currentEstablishment?.id, user?.id, reload]
  );

  return {
    exportToExcel,
    importFromFile,
  };
};

// ============================================================================
// HOOK POUR TRACKING D'USAGE
// ============================================================================

export const useTrackItemUsage = () => {
  const { currentEstablishment } = useCurrentEstablishment();

  return useCallback(
    async (listKey: ListKey, itemValue: string) => {
      if (!currentEstablishment?.id) return;

      await referenceListsService.trackItemUsage(currentEstablishment.id, listKey, itemValue);
    },
    [currentEstablishment?.id]
  );
};

// ============================================================================
// HOOK POUR LISTES MULTIPLES
// ============================================================================

export const useMultipleReferenceLists = (listKeys: ListKey[]) => {
  const { getActiveItems, isLoading, error } = useAllReferenceLists({
    realtime: true,
    autoLoad: true,
  });

  const listsData = useMemo(() => {
    const result: Record<ListKey, ReferenceItem[]> = {} as Record<ListKey, ReferenceItem[]>;
    listKeys.forEach(key => {
      result[key] = getActiveItems(key);
    });
    return result;
  }, [listKeys, getActiveItems]);

  return {
    lists: listsData,
    isLoading,
    error,
    getItems: (listKey: ListKey) => listsData[listKey] || [],
  };
};

// ============================================================================
// HOOK POUR DEBUG/LOGGING
// ============================================================================

/**
 * Hook pour logger les listes de référence (utile pour debug)
 */
export const useReferenceListsDebug = () => {
  const { currentEstablishment } = useCurrentEstablishment();

  const logSummary = useCallback(async () => {
    if (!currentEstablishment?.id) {
      logger.warn('⚠️ Aucun établissement sélectionné');
      return;
    }
    await referenceListsService.logListsSummary(currentEstablishment.id);
  }, [currentEstablishment?.id]);

  const logCompact = useCallback(async () => {
    if (!currentEstablishment?.id) {
      logger.warn('⚠️ Aucun établissement sélectionné');
      return;
    }
    await referenceListsService.logListsCompact(currentEstablishment.id);
  }, [currentEstablishment?.id]);

  return {
    logSummary,
    logCompact,
    establishmentId: currentEstablishment?.id,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useAllReferenceLists,
  useReferenceList,
  useImportExport,
  useTrackItemUsage,
  useMultipleReferenceLists,
  useReferenceListsDebug,
};
