/**
 * ============================================================================
 * SCRIPT D'INITIALISATION DES LISTES DE RÉFÉRENCE
 * ============================================================================
 *
 * À lancer UNE SEULE FOIS pour créer la structure de base
 *
 * Utilisation:
 * 1. Importe ce fichier dans ton App.tsx ou un composant
 * 2. Appelle initializeReferenceLists() au montage
 * 3. Supprime ce fichier après l'initialisation
 */

import referenceListsService from '@/shared/services/referenceListsService';

/**
 * Initialiser les listes de référence pour un établissement
 */
export const initializeReferenceLists = async (establishmentId: string, userId: string) => {
  try {
    console.log('🚀 Initialisation des listes de référence...');

    // 1. Créer la structure vide
    await referenceListsService.initializeEmptyLists(establishmentId, userId);

    console.log('✅ Structure initialisée');

    // 2. (Optionnel) Créer quelques listes de base
    const baseLists = [
      {
        key: 'intervention_types',
        config: {
          name: "Types d'intervention",
          description: "Catégories d'interventions",
          icon: 'Wrench',
          color: 'blue',
          allowCustom: true,
          isRequired: true,
          isSystem: false,
          items: [],
        },
      },
      {
        key: 'priorities',
        config: {
          name: 'Priorités',
          description: 'Niveaux de priorité',
          icon: 'AlertCircle',
          color: 'orange',
          allowCustom: false,
          isRequired: true,
          isSystem: false,
          items: [],
        },
      },
      {
        key: 'statuses',
        config: {
          name: 'Statuts',
          description: 'États des interventions',
          icon: 'CircleDot',
          color: 'green',
          allowCustom: false,
          isRequired: true,
          isSystem: false,
          items: [],
        },
      },
    ];

    // Créer les listes
    for (const list of baseLists) {
      await referenceListsService.createList(establishmentId, userId, list.key, list.config);
      console.log(`✅ Liste créée: ${list.key}`);
    }

    console.log('🎉 Initialisation terminée !');

    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    throw error;
  }
};

/**
 * Ajouter des items de base aux listes
 */
export const seedBasicItems = async (establishmentId: string, userId: string) => {
  try {
    console.log('🌱 Ajout des items de base...');

    // Items de priorité
    const priorities = [
      { value: 'low', label: 'Basse', color: 'green', icon: 'ArrowDown', order: 0 },
      { value: 'normal', label: 'Normale', color: 'blue', icon: 'Minus', order: 1 },
      { value: 'high', label: 'Haute', color: 'orange', icon: 'ArrowUp', order: 2 },
      { value: 'urgent', label: 'Urgente', color: 'red', icon: 'AlertCircle', order: 3 },
    ];

    for (const item of priorities) {
      await referenceListsService.addItem(establishmentId, userId, 'priorities', item);
    }

    console.log('✅ Priorités ajoutées');

    // Items de statut
    const statuses = [
      { value: 'pending', label: 'En attente', color: 'gray', icon: 'Clock', order: 0 },
      { value: 'in_progress', label: 'En cours', color: 'blue', icon: 'PlayCircle', order: 1 },
      { value: 'completed', label: 'Terminée', color: 'green', icon: 'CheckCircle', order: 2 },
      { value: 'cancelled', label: 'Annulée', color: 'red', icon: 'XCircle', order: 3 },
    ];

    for (const item of statuses) {
      await referenceListsService.addItem(establishmentId, userId, 'statuses', item);
    }

    console.log('✅ Statuts ajoutés');

    // Items de types d'intervention
    const interventionTypes = [
      { value: 'plumbing', label: 'Plomberie', color: 'blue', icon: 'Droplet', order: 0 },
      { value: 'electricity', label: 'Électricité', color: 'yellow', icon: 'Zap', order: 1 },
      { value: 'heating', label: 'Chauffage', color: 'orange', icon: 'Flame', order: 2 },
      { value: 'cleaning', label: 'Nettoyage', color: 'green', icon: 'Sparkles', order: 3 },
      { value: 'maintenance', label: 'Maintenance', color: 'purple', icon: 'Wrench', order: 4 },
    ];

    for (const item of interventionTypes) {
      await referenceListsService.addItem(establishmentId, userId, 'intervention_types', item);
    }

    console.log("✅ Types d'intervention ajoutés");

    console.log('🎉 Items de base ajoutés !');

    return true;
  } catch (error) {
    console.error('❌ Erreur ajout items:', error);
    throw error;
  }
};

/**
 * Fonction complète pour tout initialiser d'un coup
 */
export const setupReferenceLists = async (
  establishmentId: string = 'default',
  userId: string = 'system'
) => {
  try {
    console.log('🚀 Configuration complète des listes de référence...');

    // Vérifier si déjà initialisé
    const existing = await referenceListsService.getAllLists(establishmentId);
    if (existing) {
      console.log('⚠️ Les listes sont déjà initialisées');
      return false;
    }

    // Initialiser la structure
    await initializeReferenceLists(establishmentId, userId);

    // Ajouter les items de base
    await seedBasicItems(establishmentId, userId);

    console.log('✅✅✅ Configuration terminée avec succès !');

    return true;
  } catch (error) {
    console.error('❌ Erreur configuration:', error);
    throw error;
  }
};

export default {
  initializeReferenceLists,
  seedBasicItems,
  setupReferenceLists,
};
