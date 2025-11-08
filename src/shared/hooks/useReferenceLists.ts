/**
 * ============================================================================
 * REFERENCE LISTS HOOKS - VERSION CORRIGÉE
 * ============================================================================
 *
 * Hooks React avec cache Zustand pour listes de référence
 *
 * ✅ CORRECTION: Utilise des objets simples au lieu de Maps/Sets
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
  UpdateItemInput,
  ImportOptions,
  ImportResult,
  ExportOptions,
  ListAnalytics,
  SmartSuggestion,
  ValidationResult,
} from '@/shared/types/reference-lists.types';

// Placeholder pour établissement actuel
// TODO: Adapter selon ton système d'auth
const useCurrentEstablishment = () => {
  return { currentEstablishment: { id: 'default' } };
};

const useAuthStore = () => {
  return { user: { id: 'default-user' } };
};

// ============================================================================
// STORE ZUSTAND - CORRIGÉ (Objets au lieu de Maps/Sets)
// ============================================================================

interface ReferenceListsState {
  // Cache par établissement (Record au lieu de Map)
  cache: Record<string, EstablishmentReferenceLists>;

  // État de chargement (Record au lieu de Set)
  loading: Record<string, boolean>;

  // Erreurs (Record au lieu de Map)
  errors: Record<string, string>;

  // Listeners temps réel (Record au lieu de Map)
  listeners: Record<string, () => void>;

  // Actions
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
      (set, get) => ({
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
            // Cleanup old listener if exists
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

            // Cleanup listener
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
            // Cleanup all listeners
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
        // Ne pas persister les listeners
        partialize: state => ({
          cache: state.cache,
        }),
      }
    ),
    { name: 'reference-lists-store' }
  )
);

// ============================================================================
// HOOK PRINCIPAL - Charge TOUTES les listes
// ============================================================================

/**
 * Hook pour charger TOUTES les listes (avec temps réel)
 */
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

  // ✅ CORRECTION: Accès direct aux propriétés d'objet
  const data = establishmentId ? cache[establishmentId] : undefined;
  const isLoading = establishmentId ? !!loading[establishmentId] : false;
  const error = establishmentId ? errors[establishmentId] : undefined;

  // Charger les données
  const load = useCallback(async () => {
    if (!establishmentId) return;

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
      console.error('❌ Erreur chargement listes:', err);
      setError(establishmentId, err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [establishmentId, setLists, setLoading, setError]);

  // Setup temps réel
  useEffect(() => {
    if (!establishmentId || !options?.realtime) return;

    const docRef = doc(db, 'establishments', establishmentId, 'config', 'reference-lists');

    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setLists(establishmentId, {
            ...data,
            lastModified: data.lastModified?.toDate(),
            lists: Object.entries(data.lists || {}).reduce((acc, [key, config]: [string, any]) => {
              acc[key] = {
                ...config,
                items: (config.items || []).map((item: any) => ({
                  ...item,
                  createdAt: item.createdAt?.toDate?.(),
                  updatedAt: item.updatedAt?.toDate?.(),
                  lastUsed: item.lastUsed?.toDate?.(),
                })),
              };
              return acc;
            }, {} as any),
          } as EstablishmentReferenceLists);
        }
      },
      error => {
        console.error('❌ Erreur listener temps réel:', error);
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

  /**
   * Obtenir une liste spécifique
   */
  const getList = useCallback(
    (listKey: ListKey): ListConfig | undefined => {
      return data?.lists[listKey];
    },
    [data]
  );

  /**
   * Obtenir les items actifs d'une liste
   */
  const getActiveItems = useCallback(
    (listKey: ListKey): ReferenceItem[] => {
      const list = getList(listKey);
      if (!list) return [];

      return list.items.filter(item => item.isActive).sort((a, b) => a.order - b.order);
    },
    [getList]
  );

  /**
   * Obtenir un item par sa valeur
   */
  const getItemByValue = useCallback(
    (listKey: ListKey, value: string): ReferenceItem | undefined => {
      const list = getList(listKey);
      return list?.items.find(item => item.value === value);
    },
    [getList]
  );

  /**
   * Obtenir le label d'un item
   */
  const getLabelByValue = useCallback(
    (listKey: ListKey, value: string): string => {
      const item = getItemByValue(listKey, value);
      return item?.label || value;
    },
    [getItemByValue]
  );

  /**
   * Vérifier si une liste existe
   */
  const hasListKey = useCallback(
    (listKey: string): boolean => {
      return !!data?.lists[listKey];
    },
    [data]
  );

  return {
    // Données
    data,
    isLoading,
    error,

    // Getters
    getList,
    getActiveItems,
    getItemByValue,
    getLabelByValue,
    hasListKey,

    // Actions
    reload: load,

    // État
    hasData: !!data,
    isInitialized: !!data || !!error,
  };
};

// ============================================================================
// HOOK POUR UNE LISTE SPÉCIFIQUE
// ============================================================================

/**
 * Hook pour une liste spécifique avec toutes les actions CRUD
 */
export const useReferenceList = (listKey: ListKey) => {
  const { currentEstablishment } = useCurrentEstablishment();
  const { user } = useAuthStore();

  const {
    data,
    isLoading,
    error,
    getList,
    getActiveItems,
    getItemByValue,
    getLabelByValue,
    reload,
  } = useAllReferenceLists({ realtime: true, autoLoad: true });

  const listConfig = useMemo(() => getList(listKey), [getList, listKey]);
  const activeItems = useMemo(() => getActiveItems(listKey), [getActiveItems, listKey]);

  /**
   * Ajouter un item
   */
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

  /**
   * Mettre à jour un item
   */
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

  /**
   * Désactiver un item
   */
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

  /**
   * Supprimer un item
   */
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

  /**
   * Réorganiser les items
   */
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

  /**
   * Obtenir les analytics
   */
  const getAnalytics = useCallback(async (): Promise<ListAnalytics | null> => {
    if (!currentEstablishment?.id) return null;

    return await referenceListsService.getListAnalytics(currentEstablishment.id, listKey);
  }, [currentEstablishment?.id, listKey]);

  /**
   * Valider un item
   */
  const validate = useCallback((item: Partial<ReferenceItem>): ValidationResult => {
    return referenceListsService.validateItem(item);
  }, []);

  /**
   * Obtenir suggestions
   */
  const getSuggestions = useCallback((item: Partial<ReferenceItem>): SmartSuggestion[] => {
    return referenceListsService.getSuggestions(item);
  }, []);

  return {
    // Config
    listConfig,
    items: listConfig?.items || [],
    activeItems,
    isLoading,
    error,

    // Getters
    getItemByValue: (value: string) => getItemByValue(listKey, value),
    getLabelByValue: (value: string) => getLabelByValue(listKey, value),

    // Actions CRUD
    addItem,
    updateItem,
    deactivateItem,
    deleteItem,
    reorderItems,

    // Analytics
    getAnalytics,

    // Validation
    validate,
    getSuggestions,

    // Actions générales
    reload,

    // État
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

/**
 * Hook pour import/export
 */
export const useImportExport = () => {
  const { currentEstablishment } = useCurrentEstablishment();
  const { user } = useAuthStore();
  const { reload } = useAllReferenceLists();

  /**
   * Exporter en Excel
   */
  const exportToExcel = useCallback(
    async (options: ExportOptions): Promise<Blob> => {
      if (!currentEstablishment?.id) {
        throw new Error('Établissement non trouvé');
      }

      return await referenceListsService.exportToExcel(currentEstablishment.id, options);
    },
    [currentEstablishment?.id]
  );

  /**
   * Importer depuis fichier
   */
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

/**
 * Hook pour tracker l'usage d'un item
 */
export const useTrackItemUsage = () => {
  const { currentEstablishment } = useCurrentEstablishment();

  return useCallback(
    async (listKey: ListKey, itemValue: string, context: string, contextId: string) => {
      if (!currentEstablishment?.id) return;

      await referenceListsService.trackItemUsage(
        currentEstablishment.id,
        listKey,
        itemValue,
        context,
        contextId
      );
    },
    [currentEstablishment?.id]
  );
};

// ============================================================================
// HOOK POUR LISTES MULTIPLES
// ============================================================================

/**
 * Hook pour charger plusieurs listes à la fois
 */
export const useMultipleReferenceLists = (listKeys: ListKey[]) => {
  const { getActiveItems, isLoading, error } = useAllReferenceLists({
    realtime: true,
    autoLoad: true,
  });

  const listsData = useMemo(() => {
    const result: Record<ListKey, ReferenceItem[]> = {} as any;
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
// EXPORTS
// ============================================================================

export default {
  useAllReferenceLists,
  useReferenceList,
  useImportExport,
  useTrackItemUsage,
  useMultipleReferenceLists,
};
