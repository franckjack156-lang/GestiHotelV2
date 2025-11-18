/**
 * ============================================================================
 * ESTABLISHMENT INITIALIZATION SERVICE
 * ============================================================================
 *
 * Service pour automatiser l'initialisation d'un nouvel établissement avec :
 * - Listes de référence pré-remplies (stables)
 * - Configuration email intelligente
 * - Paramètres régionaux auto-détectés
 * - Ajout automatique du propriétaire
 * - Configuration planning par défaut
 */

import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type {
  EstablishmentReferenceLists,
  ListConfig,
  ReferenceItem,
} from '@/shared/types/reference-lists.types';
import type { EstablishmentSettings } from '@/shared/types/establishment.types';

// ============================================================================
// TYPES
// ============================================================================

export interface InitializationOptions {
  establishmentId: string;
  userId: string;
  userEmail?: string;
  totalFloors?: number;
  address?: {
    country?: string;
    city?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface InitializationResult {
  success: boolean;
  listsCreated: string[];
  settingsApplied: string[];
  errors: string[];
}

// ============================================================================
// LISTES DE RÉFÉRENCE STABLES (PRÉ-REMPLIES)
// ============================================================================

/**
 * Statuts d'intervention
 */
const getDefaultInterventionStatuses = (): ReferenceItem[] => [
  {
    id: 'pending',
    value: 'pending',
    label: 'À faire',
    color: 'gray',
    icon: 'Clock',
    order: 1,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'in_progress',
    value: 'in_progress',
    label: 'En cours',
    color: 'blue',
    icon: 'Wrench',
    order: 2,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'on_hold',
    value: 'on_hold',
    label: 'En attente',
    color: 'orange',
    icon: 'Pause',
    order: 3,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'completed',
    value: 'completed',
    label: 'Terminé',
    color: 'green',
    icon: 'CheckCircle',
    order: 4,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'cancelled',
    value: 'cancelled',
    label: 'Annulé',
    color: 'red',
    icon: 'XCircle',
    order: 5,
    isActive: true,
    usageCount: 0,
  },
];

/**
 * Priorités
 */
const getDefaultPriorities = (): ReferenceItem[] => [
  {
    id: 'low',
    value: 'low',
    label: 'Basse',
    color: 'green',
    icon: 'ArrowDown',
    order: 1,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'normal',
    value: 'normal',
    label: 'Normale',
    color: 'blue',
    icon: 'Minus',
    order: 2,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'high',
    value: 'high',
    label: 'Haute',
    color: 'orange',
    icon: 'ArrowUp',
    order: 3,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'urgent',
    value: 'urgent',
    label: 'Urgente',
    color: 'red',
    icon: 'AlertCircle',
    order: 4,
    isActive: true,
    usageCount: 0,
  },
];

/**
 * Catégories d'intervention
 */
const getDefaultInterventionCategories = (): ReferenceItem[] => [
  {
    id: 'maintenance',
    value: 'maintenance',
    label: 'Maintenance',
    color: 'blue',
    icon: 'Wrench',
    order: 1,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'repair',
    value: 'repair',
    label: 'Réparation',
    color: 'orange',
    icon: 'Tool',
    order: 2,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'cleaning',
    value: 'cleaning',
    label: 'Nettoyage',
    color: 'green',
    icon: 'Sparkles',
    order: 3,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'inspection',
    value: 'inspection',
    label: 'Inspection',
    color: 'purple',
    icon: 'Search',
    order: 4,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'emergency',
    value: 'emergency',
    label: 'Urgence',
    color: 'red',
    icon: 'AlertTriangle',
    order: 5,
    isActive: true,
    usageCount: 0,
  },
];

/**
 * Types d'intervention
 */
const getDefaultInterventionTypes = (): ReferenceItem[] => [
  {
    id: 'plumbing',
    value: 'plumbing',
    label: 'Plomberie',
    color: 'blue',
    icon: 'Droplet',
    order: 1,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'electricity',
    value: 'electricity',
    label: 'Électricité',
    color: 'yellow',
    icon: 'Zap',
    order: 2,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'hvac',
    value: 'hvac',
    label: 'Climatisation',
    color: 'blue',
    icon: 'Wind',
    order: 3,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'heating',
    value: 'heating',
    label: 'Chauffage',
    color: 'orange',
    icon: 'Flame',
    order: 4,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'carpentry',
    value: 'carpentry',
    label: 'Menuiserie',
    color: 'yellow',
    icon: 'Hammer',
    order: 5,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'locksmith',
    value: 'locksmith',
    label: 'Serrurerie',
    color: 'gray',
    icon: 'Key',
    order: 6,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'painting',
    value: 'painting',
    label: 'Peinture',
    color: 'purple',
    icon: 'Paintbrush',
    order: 7,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'cleaning',
    value: 'cleaning',
    label: 'Nettoyage',
    color: 'green',
    icon: 'Sparkles',
    order: 8,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'it',
    value: 'it',
    label: 'Informatique',
    color: 'blue',
    icon: 'Monitor',
    order: 9,
    isActive: true,
    usageCount: 0,
  },
];

/**
 * Statuts de chambre
 */
const getDefaultRoomStatuses = (): ReferenceItem[] => [
  {
    id: 'available',
    value: 'available',
    label: 'Disponible',
    color: 'green',
    icon: 'CheckCircle',
    order: 1,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'occupied',
    value: 'occupied',
    label: 'Occupé',
    color: 'blue',
    icon: 'User',
    order: 2,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'cleaning',
    value: 'cleaning',
    label: 'En nettoyage',
    color: 'yellow',
    icon: 'Sparkles',
    order: 3,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'maintenance',
    value: 'maintenance',
    label: 'En maintenance',
    color: 'orange',
    icon: 'Wrench',
    order: 4,
    isActive: true,
    usageCount: 0,
  },
  {
    id: 'blocked',
    value: 'blocked',
    label: 'Bloqué',
    color: 'red',
    icon: 'Ban',
    order: 5,
    isActive: true,
    usageCount: 0,
  },
];

// ============================================================================
// CRÉATION DES LISTES
// ============================================================================

/**
 * Créer une configuration de liste
 */
const createListConfig = (
  name: string,
  description: string,
  items: ReferenceItem[],
  options: {
    isSystem?: boolean;
    isRequired?: boolean;
    allowCustom?: boolean;
  } = {}
): ListConfig => ({
  name,
  description,
  isSystem: options.isSystem ?? true,
  isRequired: options.isRequired ?? true,
  allowCustom: options.allowCustom ?? true,
  items: items.map(item => ({
    ...item,
    createdAt: new Date(),
  })),
});

/**
 * Obtenir toutes les listes pré-remplies
 */
const getPrefilledLists = (): Record<string, ListConfig> => ({
  // Listes STABLES (pré-remplies)
  interventionStatuses: createListConfig(
    'Statuts',
    'Statuts des interventions (À faire, En cours, etc.)',
    getDefaultInterventionStatuses(),
    { isSystem: true, isRequired: true, allowCustom: false }
  ),

  priorities: createListConfig(
    'Priorités',
    'Niveaux de priorité (Basse, Normale, Haute, Urgente)',
    getDefaultPriorities(),
    { isSystem: true, isRequired: true, allowCustom: false }
  ),

  interventionCategories: createListConfig(
    "Catégories d'intervention",
    'Catégories principales (Maintenance, Réparation, Nettoyage, etc.)',
    getDefaultInterventionCategories(),
    { isSystem: true, isRequired: true, allowCustom: true }
  ),

  interventionTypes: createListConfig(
    "Types d'intervention",
    'Types spécifiques (Plomberie, Électricité, etc.)',
    getDefaultInterventionTypes(),
    { isSystem: false, isRequired: false, allowCustom: true }
  ),

  roomStatuses: createListConfig(
    'Statuts de chambre',
    'Statuts des chambres (Disponible, Occupé, etc.)',
    getDefaultRoomStatuses(),
    { isSystem: true, isRequired: true, allowCustom: true }
  ),

  // Listes VIDES (à remplir plus tard via templates)
  locations: createListConfig(
    'Localisations',
    "Localisations dans l'établissement (Chambre, Couloir, Réception, etc.)",
    [],
    { isSystem: false, isRequired: false, allowCustom: true }
  ),

  floors: createListConfig('Étages', "Étages de l'établissement (générés automatiquement)", [], {
    isSystem: false,
    isRequired: false,
    allowCustom: true,
  }),

  buildings: createListConfig('Bâtiments', "Bâtiments ou ailes de l'établissement", [], {
    isSystem: false,
    isRequired: false,
    allowCustom: true,
  }),

  assignees: createListConfig(
    'Assignés',
    'Personnes pouvant être assignées aux interventions',
    [],
    { isSystem: false, isRequired: false, allowCustom: true }
  ),

  partCategories: createListConfig('Catégories de pièces', 'Catégories de pièces détachées', [], {
    isSystem: false,
    isRequired: false,
    allowCustom: true,
  }),
});

// ============================================================================
// DÉTECTION PARAMÈTRES RÉGIONAUX
// ============================================================================

/**
 * Détecter les paramètres régionaux en fonction du pays
 */
const detectRegionalSettings = (country?: string): Partial<EstablishmentSettings> => {
  const countryLower = country?.toLowerCase() || '';

  // France et pays francophones
  if (
    countryLower.includes('france') ||
    countryLower.includes('belgique') ||
    countryLower.includes('suisse') ||
    countryLower.includes('luxembourg')
  ) {
    return {
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr',
      currency: 'EUR',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
    };
  }

  // Royaume-Uni
  if (countryLower.includes('royaume-uni') || countryLower.includes('uk')) {
    return {
      timezone: 'Europe/London',
      defaultLanguage: 'en',
      currency: 'GBP',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
    };
  }

  // États-Unis
  if (countryLower.includes('états-unis') || countryLower.includes('usa')) {
    return {
      timezone: 'America/New_York',
      defaultLanguage: 'en',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
    };
  }

  // Par défaut : France
  return {
    timezone: 'Europe/Paris',
    defaultLanguage: 'fr',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
  };
};

/**
 * Configuration email intelligente
 */
const getSmartEmailConfig = (
  options: InitializationOptions
): {
  notificationEmail?: string;
  orderEmail?: string;
} => {
  const emails = {
    notificationEmail: undefined as string | undefined,
    orderEmail: undefined as string | undefined,
  };

  // Priorité : contact.email > userEmail
  const primaryEmail = options.contact?.email || options.userEmail;

  if (primaryEmail) {
    emails.notificationEmail = primaryEmail;
    emails.orderEmail = primaryEmail;
  }

  return emails;
};

/**
 * Configuration planning par défaut
 */
const getDefaultBusinessHours = () => ({
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '17:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
});

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

/**
 * Initialiser complètement un nouvel établissement
 */
export const initializeNewEstablishment = async (
  options: InitializationOptions
): Promise<InitializationResult> => {
  const result: InitializationResult = {
    success: false,
    listsCreated: [],
    settingsApplied: [],
    errors: [],
  };

  try {
    console.log('🚀 Initialisation établissement:', options.establishmentId);

    // 1. Créer les listes de référence
    await initializeReferenceLists(options, result);

    // 2. Appliquer les paramètres régionaux
    await applyRegionalSettings(options, result);

    // 3. Ajouter l'utilisateur propriétaire
    await addOwnerToEstablishment(options, result);

    result.success = result.errors.length === 0;

    console.log('✅ Initialisation terminée:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    result.errors.push((error as Error).message);
    return result;
  }
};

/**
 * Initialiser les listes de référence
 */
const initializeReferenceLists = async (
  options: InitializationOptions,
  result: InitializationResult
): Promise<void> => {
  try {
    const lists = getPrefilledLists();

    const listsData: EstablishmentReferenceLists = {
      establishmentId: options.establishmentId,
      version: 1,
      lastModified: new Date(),
      modifiedBy: options.userId,
      lists,
    };

    const listsDocRef = doc(
      db,
      'establishments',
      options.establishmentId,
      'config',
      'reference-lists'
    );

    await setDoc(listsDocRef, {
      ...listsData,
      lastModified: serverTimestamp(),
    });

    result.listsCreated = Object.keys(lists);
    console.log(`✅ ${result.listsCreated.length} listes créées`);
  } catch (error) {
    console.error('❌ Erreur création listes:', error);
    result.errors.push('Échec création listes: ' + (error as Error).message);
  }
};

/**
 * Appliquer les paramètres régionaux et emails
 */
const applyRegionalSettings = async (
  options: InitializationOptions,
  result: InitializationResult
): Promise<void> => {
  try {
    const regionalSettings = detectRegionalSettings(options.address?.country);
    const emailConfig = getSmartEmailConfig(options);
    const businessHours = getDefaultBusinessHours();

    const settingsUpdate: Partial<EstablishmentSettings> = {
      ...regionalSettings,
      ...emailConfig,
      businessHours,
      interventionPrefix: 'INT',
      interventionStartNumber: 1,
    };

    const establishmentRef = doc(db, 'establishments', options.establishmentId);

    await updateDoc(establishmentRef, {
      'settings.timezone': settingsUpdate.timezone,
      'settings.defaultLanguage': settingsUpdate.defaultLanguage,
      'settings.currency': settingsUpdate.currency,
      'settings.dateFormat': settingsUpdate.dateFormat,
      'settings.timeFormat': settingsUpdate.timeFormat,
      'settings.notificationEmail': settingsUpdate.notificationEmail,
      'settings.orderEmail': settingsUpdate.orderEmail,
      'settings.businessHours': settingsUpdate.businessHours,
      'settings.interventionPrefix': settingsUpdate.interventionPrefix,
      'settings.interventionStartNumber': settingsUpdate.interventionStartNumber,
      updatedAt: serverTimestamp(),
    });

    result.settingsApplied = [
      'timezone',
      'language',
      'currency',
      'dateFormat',
      'timeFormat',
      'emails',
      'businessHours',
      'interventionNumbering',
    ];

    console.log('✅ Paramètres appliqués:', settingsUpdate);
  } catch (error) {
    console.error('❌ Erreur paramètres:', error);
    result.errors.push('Échec paramètres: ' + (error as Error).message);
  }
};

/**
 * Ajouter l'utilisateur propriétaire à l'établissement
 */
const addOwnerToEstablishment = async (
  options: InitializationOptions,
  result: InitializationResult
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', options.userId);

    await updateDoc(userRef, {
      establishmentIds: arrayUnion(options.establishmentId),
      updatedAt: serverTimestamp(),
    });

    result.settingsApplied.push('ownerAdded');
    console.log("✅ Propriétaire ajouté à l'établissement");
  } catch (error) {
    console.error('❌ Erreur ajout propriétaire:', error);
    result.errors.push('Échec ajout propriétaire: ' + (error as Error).message);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initializeNewEstablishment,
  detectRegionalSettings,
  getSmartEmailConfig,
  getDefaultBusinessHours,
};
