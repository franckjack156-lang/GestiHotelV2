/**
 * ============================================================================
 * LIST TEMPLATES SERVICE
 * ============================================================================
 *
 * Service pour gérer les templates de listes de référence par type d'établissement
 *
 * Fonctionnalités:
 * - Templates prédéfinis par type d'établissement
 * - Application automatique lors du setup
 * - Templates personnalisés sauvegardables
 * - Import/Export de templates
 *
 * Destination: src/shared/services/listTemplatesService.ts
 */

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import referenceListsService from './referenceListsService';
import type {
  EstablishmentReferenceLists,
  ListKey,
  ListConfig,
} from '@/shared/types/reference-lists.types';
import { EstablishmentType } from '@/shared/types/establishment.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ListTemplate {
  id: string;
  name: string;
  description: string;
  establishmentTypes: EstablishmentType[];
  lists: Partial<Record<ListKey, Omit<ListConfig, 'items'> & { items: any[] }>>;
  isSystem: boolean;
  createdBy?: string;
  createdAt?: Date;
}

// ============================================================================
// TEMPLATES PRÉDÉFINIS
// ============================================================================

/**
 * Template pour Hôtel Standard
 */
const HOTEL_STANDARD_TEMPLATE: ListTemplate = {
  id: 'hotel-standard',
  name: 'Hôtel Standard',
  description: 'Template pour hôtel classique 50-200 chambres',
  establishmentTypes: [EstablishmentType.HOTEL],
  isSystem: true,
  lists: {
    interventionTypes: {
      name: "Types d'intervention",
      description: "Catégories principales d'interventions techniques",
      icon: 'Wrench',
      color: 'blue',
      allowCustom: true,
      isRequired: true,
      isSystem: false,
      items: [
        {
          id: 'plumbing',
          value: 'plumbing',
          label: 'Plomberie',
          color: 'blue',
          icon: 'Droplet',
          order: 0,
          isActive: true,
          description: 'Interventions liées à la plomberie',
        },
        {
          id: 'electrical',
          value: 'electrical',
          label: 'Électricité',
          color: 'yellow',
          icon: 'Zap',
          order: 1,
          isActive: true,
          description: 'Interventions électriques',
        },
        {
          id: 'hvac',
          value: 'hvac',
          label: 'Climatisation / Chauffage',
          color: 'cyan',
          icon: 'Wind',
          order: 2,
          isActive: true,
          description: 'Systèmes de climatisation et chauffage',
        },
        {
          id: 'carpentry',
          value: 'carpentry',
          label: 'Menuiserie',
          color: 'orange',
          icon: 'Hammer',
          order: 3,
          isActive: true,
          description: 'Réparations menuiserie et mobilier',
        },
        {
          id: 'painting',
          value: 'painting',
          label: 'Peinture',
          color: 'purple',
          icon: 'Paintbrush',
          order: 4,
          isActive: true,
          description: 'Travaux de peinture',
        },
        {
          id: 'cleaning',
          value: 'cleaning',
          label: 'Nettoyage Spécial',
          color: 'green',
          icon: 'Sparkles',
          order: 5,
          isActive: true,
          description: 'Nettoyages spéciaux hors routine',
        },
        {
          id: 'locksmith',
          value: 'locksmith',
          label: 'Serrurerie',
          color: 'gray',
          icon: 'Key',
          order: 6,
          isActive: true,
          description: 'Interventions de serrurerie',
        },
        {
          id: 'it',
          value: 'it',
          label: 'Informatique',
          color: 'indigo',
          icon: 'Monitor',
          order: 7,
          isActive: true,
          description: 'Support informatique et télécoms',
        },
      ],
    },

    priorities: {
      name: 'Niveaux de priorité',
      description: 'Urgence des interventions',
      icon: 'AlertCircle',
      color: 'orange',
      allowCustom: false,
      isRequired: true,
      isSystem: true,
      items: [
        {
          id: 'urgent',
          value: 'urgent',
          label: 'Urgent',
          color: 'red',
          icon: 'AlertTriangle',
          order: 0,
          isActive: true,
          description: 'Intervention immédiate requise',
        },
        {
          id: 'high',
          value: 'high',
          label: 'Haute',
          color: 'orange',
          icon: 'AlertCircle',
          order: 1,
          isActive: true,
          description: 'À traiter dans la journée',
        },
        {
          id: 'normal',
          value: 'normal',
          label: 'Normale',
          color: 'blue',
          icon: 'Circle',
          order: 2,
          isActive: true,
          description: 'Priorité standard',
        },
        {
          id: 'low',
          value: 'low',
          label: 'Basse',
          color: 'gray',
          icon: 'CircleDot',
          order: 3,
          isActive: true,
          description: 'Peut attendre',
        },
      ],
    },

    statuses: {
      name: 'Statuts',
      description: 'États des interventions',
      icon: 'CircleDot',
      color: 'green',
      allowCustom: false,
      isRequired: true,
      isSystem: true,
      items: [
        {
          id: 'draft',
          value: 'draft',
          label: 'Brouillon',
          color: 'gray',
          icon: 'FileEdit',
          order: 0,
          isActive: true,
        },
        {
          id: 'pending',
          value: 'pending',
          label: 'En attente',
          color: 'yellow',
          icon: 'Clock',
          order: 1,
          isActive: true,
        },
        {
          id: 'assigned',
          value: 'assigned',
          label: 'Assignée',
          color: 'blue',
          icon: 'UserCheck',
          order: 2,
          isActive: true,
        },
        {
          id: 'in_progress',
          value: 'in_progress',
          label: 'En cours',
          color: 'orange',
          icon: 'Wrench',
          order: 3,
          isActive: true,
        },
        {
          id: 'on_hold',
          value: 'on_hold',
          label: 'En pause',
          color: 'purple',
          icon: 'Pause',
          order: 4,
          isActive: true,
        },
        {
          id: 'completed',
          value: 'completed',
          label: 'Terminée',
          color: 'green',
          icon: 'CheckCircle',
          order: 5,
          isActive: true,
        },
        {
          id: 'closed',
          value: 'closed',
          label: 'Clôturée',
          color: 'green',
          icon: 'CheckCircle2',
          order: 6,
          isActive: true,
        },
        {
          id: 'cancelled',
          value: 'cancelled',
          label: 'Annulée',
          color: 'red',
          icon: 'XCircle',
          order: 7,
          isActive: true,
        },
      ],
    },

    categories: {
      name: 'Catégories',
      description: 'Classification des interventions',
      icon: 'Tags',
      color: 'purple',
      allowCustom: true,
      isRequired: false,
      isSystem: false,
      items: [
        {
          id: 'preventive',
          value: 'preventive',
          label: 'Maintenance Préventive',
          color: 'blue',
          icon: 'Shield',
          order: 0,
          isActive: true,
        },
        {
          id: 'corrective',
          value: 'corrective',
          label: 'Maintenance Corrective',
          color: 'orange',
          icon: 'Wrench',
          order: 1,
          isActive: true,
        },
        {
          id: 'emergency',
          value: 'emergency',
          label: 'Urgence',
          color: 'red',
          icon: 'AlertTriangle',
          order: 2,
          isActive: true,
        },
        {
          id: 'improvement',
          value: 'improvement',
          label: 'Amélioration',
          color: 'green',
          icon: 'TrendingUp',
          order: 3,
          isActive: true,
        },
      ],
    },

    roomTypes: {
      name: 'Types de chambres',
      description: 'Catégories de chambres',
      icon: 'BedDouble',
      color: 'pink',
      allowCustom: true,
      isRequired: false,
      isSystem: false,
      items: [
        {
          id: 'single',
          value: 'single',
          label: 'Chambre Simple',
          color: 'blue',
          icon: 'User',
          order: 0,
          isActive: true,
        },
        {
          id: 'double',
          value: 'double',
          label: 'Chambre Double',
          color: 'green',
          icon: 'Users',
          order: 1,
          isActive: true,
        },
        {
          id: 'suite',
          value: 'suite',
          label: 'Suite',
          color: 'purple',
          icon: 'Crown',
          order: 2,
          isActive: true,
        },
        {
          id: 'family',
          value: 'family',
          label: 'Chambre Familiale',
          color: 'orange',
          icon: 'Home',
          order: 3,
          isActive: true,
        },
      ],
    },

    commonAreas: {
      name: 'Zones communes',
      description: "Zones communes de l'établissement",
      icon: 'Building',
      color: 'cyan',
      allowCustom: true,
      isRequired: false,
      isSystem: false,
      items: [
        {
          id: 'reception',
          value: 'reception',
          label: 'Réception',
          color: 'blue',
          icon: 'Building',
          order: 0,
          isActive: true,
        },
        {
          id: 'lobby',
          value: 'lobby',
          label: 'Hall / Lobby',
          color: 'purple',
          icon: 'Sofa',
          order: 1,
          isActive: true,
        },
        {
          id: 'restaurant',
          value: 'restaurant',
          label: 'Restaurant',
          color: 'orange',
          icon: 'UtensilsCrossed',
          order: 2,
          isActive: true,
        },
        {
          id: 'bar',
          value: 'bar',
          label: 'Bar',
          color: 'yellow',
          icon: 'Wine',
          order: 3,
          isActive: true,
        },
        {
          id: 'gym',
          value: 'gym',
          label: 'Salle de sport',
          color: 'green',
          icon: 'Dumbbell',
          order: 4,
          isActive: true,
        },
        {
          id: 'parking',
          value: 'parking',
          label: 'Parking',
          color: 'gray',
          icon: 'Car',
          order: 5,
          isActive: true,
        },
        {
          id: 'corridor',
          value: 'corridor',
          label: 'Couloirs',
          color: 'slate',
          icon: 'ArrowRight',
          order: 6,
          isActive: true,
        },
      ],
    },
  },
};

/**
 * Template pour Resort/Spa
 */
const RESORT_TEMPLATE: ListTemplate = {
  id: 'resort-luxury',
  name: 'Resort & Spa',
  description: 'Template pour resort avec spa, piscine, services premium',
  establishmentTypes: [EstablishmentType.RESORT],
  isSystem: true,
  lists: {
    // Hérite des listes de base + additions spécifiques
    ...HOTEL_STANDARD_TEMPLATE.lists,

    interventionTypes: {
      ...HOTEL_STANDARD_TEMPLATE.lists.interventionTypes!,
      items: [
        ...HOTEL_STANDARD_TEMPLATE.lists.interventionTypes!.items,
        {
          id: 'pool',
          value: 'pool',
          label: 'Piscine / Spa',
          color: 'cyan',
          icon: 'Waves',
          order: 8,
          isActive: true,
          description: 'Maintenance piscine, jacuzzi, spa',
        },
        {
          id: 'landscaping',
          value: 'landscaping',
          label: 'Espaces verts',
          color: 'green',
          icon: 'TreePine',
          order: 9,
          isActive: true,
          description: 'Entretien jardins et espaces extérieurs',
        },
      ],
    },

    commonAreas: {
      ...HOTEL_STANDARD_TEMPLATE.lists.commonAreas!,
      items: [
        ...HOTEL_STANDARD_TEMPLATE.lists.commonAreas!.items,
        {
          id: 'spa',
          value: 'spa',
          label: 'Spa',
          color: 'purple',
          icon: 'Sparkles',
          order: 7,
          isActive: true,
        },
        {
          id: 'pool',
          value: 'pool',
          label: 'Piscine',
          color: 'blue',
          icon: 'Waves',
          order: 8,
          isActive: true,
        },
        {
          id: 'beach',
          value: 'beach',
          label: 'Plage privée',
          color: 'yellow',
          icon: 'Palmtree',
          order: 9,
          isActive: true,
        },
        {
          id: 'golf',
          value: 'golf',
          label: 'Golf',
          color: 'green',
          icon: 'Circle',
          order: 10,
          isActive: true,
        },
      ],
    },
  },
};

/**
 * Template pour Motel
 */
const MOTEL_TEMPLATE: ListTemplate = {
  id: 'motel-basic',
  name: 'Motel Basique',
  description: 'Template simplifié pour motel avec services essentiels',
  establishmentTypes: [EstablishmentType.MOTEL],
  isSystem: true,
  lists: {
    interventionTypes: {
      ...HOTEL_STANDARD_TEMPLATE.lists.interventionTypes!,
      items: HOTEL_STANDARD_TEMPLATE.lists.interventionTypes!.items.filter(item =>
        ['plumbing', 'electrical', 'hvac', 'cleaning', 'locksmith'].includes(item.value)
      ),
    },
    priorities: HOTEL_STANDARD_TEMPLATE.lists.priorities,
    statuses: HOTEL_STANDARD_TEMPLATE.lists.statuses,
    categories: {
      ...HOTEL_STANDARD_TEMPLATE.lists.categories!,
      items: HOTEL_STANDARD_TEMPLATE.lists.categories!.items.filter(item =>
        ['corrective', 'emergency'].includes(item.value)
      ),
    },
    roomTypes: {
      ...HOTEL_STANDARD_TEMPLATE.lists.roomTypes!,
      items: [
        {
          id: 'standard',
          value: 'standard',
          label: 'Chambre Standard',
          color: 'blue',
          icon: 'BedDouble',
          order: 0,
          isActive: true,
        },
      ],
    },
    commonAreas: {
      ...HOTEL_STANDARD_TEMPLATE.lists.commonAreas!,
      items: [
        {
          id: 'reception',
          value: 'reception',
          label: 'Réception',
          color: 'blue',
          icon: 'Building',
          order: 0,
          isActive: true,
        },
        {
          id: 'parking',
          value: 'parking',
          label: 'Parking',
          color: 'gray',
          icon: 'Car',
          order: 1,
          isActive: true,
        },
      ],
    },
  },
};

/**
 * Tous les templates disponibles
 */
export const AVAILABLE_TEMPLATES: Record<string, ListTemplate> = {
  'hotel-standard': HOTEL_STANDARD_TEMPLATE,
  'resort-luxury': RESORT_TEMPLATE,
  'motel-basic': MOTEL_TEMPLATE,
};

/**
 * Mapping type établissement → templates recommandés
 */
export const RECOMMENDED_TEMPLATES: Record<EstablishmentType, string[]> = {
  [EstablishmentType.HOTEL]: ['hotel-standard'],
  [EstablishmentType.RESORT]: ['resort-luxury', 'hotel-standard'],
  [EstablishmentType.MOTEL]: ['motel-basic'],
  [EstablishmentType.HOSTEL]: ['motel-basic'],
  [EstablishmentType.APARTMENT]: ['motel-basic'],
  [EstablishmentType.OTHER]: ['hotel-standard'],
};

// ============================================================================
// FONCTIONS
// ============================================================================

/**
 * Obtenir les templates disponibles pour un type d'établissement
 */
export const getTemplatesForEstablishmentType = (type: EstablishmentType): ListTemplate[] => {
  const templateIds = RECOMMENDED_TEMPLATES[type] || ['hotel-standard'];
  return templateIds.map(id => AVAILABLE_TEMPLATES[id]).filter(Boolean);
};

/**
 * Obtenir un template par son ID
 */
export const getTemplate = (templateId: string): ListTemplate | null => {
  return AVAILABLE_TEMPLATES[templateId] || null;
};

/**
 * Appliquer un template à un établissement
 */
export const applyTemplate = async (
  establishmentId: string,
  userId: string,
  templateId: string,
  options: {
    overwrite?: boolean; // Écraser les listes existantes
    merge?: boolean; // Fusionner avec l'existant
  } = { merge: true }
): Promise<void> => {
  try {
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" non trouvé`);
    }

    console.log(`🚀 Application du template "${template.name}"...`);

    // Vérifier si l'établissement a déjà des listes
    const existingLists = await referenceListsService.getAllLists(establishmentId);

    if (existingLists && !options.overwrite && !options.merge) {
      throw new Error('Listes déjà existantes. Utilisez overwrite: true ou merge: true');
    }

    // Si pas de listes existantes, initialiser
    if (!existingLists) {
      await referenceListsService.initializeEmptyLists(establishmentId, userId);
    }

    // Appliquer chaque liste du template
    let listsCreated = 0;
    let itemsAdded = 0;

    for (const [listKey, listConfig] of Object.entries(template.lists)) {
      try {
        // Vérifier si la liste existe déjà
        const existingList = await referenceListsService.getList(
          establishmentId,
          listKey as ListKey
        );

        if (!existingList) {
          // Créer la liste
          await referenceListsService.createList(establishmentId, userId, listKey, {
            name: listConfig.name,
            description: listConfig.description,
            icon: listConfig.icon,
            color: listConfig.color,
            allowCustom: listConfig.allowCustom,
            isRequired: listConfig.isRequired,
            isSystem: listConfig.isSystem,
          });
          listsCreated++;
        }

        // Ajouter les items
        if (listConfig.items && listConfig.items.length > 0) {
          for (const item of listConfig.items) {
            try {
              await referenceListsService.addItem(establishmentId, userId, listKey as ListKey, {
                value: item.value,
                label: item.label,
                color: item.color,
                icon: item.icon,
                description: item.description,
                order: item.order,
              });
              itemsAdded++;
            } catch (error: any) {
              // Ignorer si l'item existe déjà en mode merge
              if (options.merge && error.message.includes('existe déjà')) {
                console.log(`⚠️ Item "${item.value}" déjà existant, ignoré`);
              } else {
                console.error(`❌ Erreur ajout item "${item.value}":`, error);
              }
            }
          }
        }

        console.log(`✅ Liste "${listKey}" configurée`);
      } catch (error) {
        console.error(`❌ Erreur configuration liste "${listKey}":`, error);
      }
    }

    console.log(`🎉 Template appliqué avec succès !`);
    console.log(`   - ${listsCreated} listes créées`);
    console.log(`   - ${itemsAdded} items ajoutés`);
  } catch (error) {
    console.error('❌ Erreur application template:', error);
    throw error;
  }
};

/**
 * Obtenir tous les templates disponibles
 */
export const getAllTemplates = (): ListTemplate[] => {
  return Object.values(AVAILABLE_TEMPLATES);
};

/**
 * Sauvegarder un template personnalisé
 */
export const saveCustomTemplate = async (
  userId: string,
  template: Omit<ListTemplate, 'id' | 'isSystem' | 'createdAt' | 'createdBy'>
): Promise<string> => {
  try {
    const templateId = `custom-${Date.now()}`;
    const newTemplate: ListTemplate = {
      ...template,
      id: templateId,
      isSystem: false,
      createdBy: userId,
      createdAt: new Date(),
    };

    // Sauvegarder dans Firestore
    await setDoc(doc(db, 'templates', templateId), newTemplate);

    console.log(`✅ Template personnalisé sauvegardé: ${templateId}`);
    return templateId;
  } catch (error) {
    console.error('❌ Erreur sauvegarde template:', error);
    throw error;
  }
};

/**
 * Charger les templates personnalisés d'un utilisateur
 */
export const getUserCustomTemplates = async (userId: string): Promise<ListTemplate[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'templates'));
    const templates = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }) as ListTemplate)
      .filter(t => t.createdBy === userId);

    return templates;
  } catch (error) {
    console.error('❌ Erreur chargement templates:', error);
    return [];
  }
};

// Alias pour compatibilité
export const getAvailableTemplates = getTemplatesForEstablishmentType;
export const getTemplateById = getTemplate;

// Export du service
const listTemplatesService = {
  getTemplatesForEstablishmentType,
  getAvailableTemplates,
  getTemplate,
  getTemplateById,
  applyTemplate,
  getAllTemplates,
  saveCustomTemplate,
  getUserCustomTemplates,
  AVAILABLE_TEMPLATES,
  RECOMMENDED_TEMPLATES,
};

export default listTemplatesService;
