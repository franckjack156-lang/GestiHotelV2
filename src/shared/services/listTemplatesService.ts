/**
 * ============================================================================
 * LIST TEMPLATES SERVICE - VERSION DEBUG
 * ============================================================================
 *
 * Version avec logs détaillés pour identifier les problèmes
 *
 * Destination: src/shared/services/listTemplatesService.ts
 */

import referenceListsService from './referenceListsService';
import type { ListKey } from '@/shared/types/reference-lists.types';
import { logger } from '@/core/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  itemCount: number;
  lists: Record<string, TemplateItem[]>;
}

interface TemplateItem {
  value: string;
  label: string;
  color: string;
  icon: string;
  order: number;
  description?: string;
}

// ============================================================================
// TEMPLATE 1: HÔTEL STANDARD
// ============================================================================

const HOTEL_STANDARD: Template = {
  id: 'hotel-standard',
  name: 'Hôtel Standard',
  description: 'Template complet pour hôtel 50-200 chambres avec services standards',
  icon: 'Building',
  color: 'blue',
  itemCount: 41,
  lists: {
    interventionTypes: [
      {
        value: 'plumbing',
        label: 'Plomberie',
        color: 'blue',
        icon: 'Droplet',
        order: 0,
        description: 'Réparations plomberie, fuites, robinets',
      },
      {
        value: 'electrical',
        label: 'Électricité',
        color: 'yellow',
        icon: 'Zap',
        order: 1,
        description: 'Installations électriques, prises, lumières',
      },
      {
        value: 'hvac',
        label: 'Climatisation/Chauffage',
        color: 'orange',
        icon: 'Wind',
        order: 2,
        description: 'Climatisation, chauffage, ventilation',
      },
      {
        value: 'carpentry',
        label: 'Menuiserie',
        color: 'orange',
        icon: 'Hammer',
        order: 3,
        description: 'Portes, fenêtres, mobilier bois',
      },
      {
        value: 'painting',
        label: 'Peinture',
        color: 'purple',
        icon: 'Paintbrush',
        order: 4,
        description: 'Peinture murs, plafonds, boiseries',
      },
      {
        value: 'cleaning',
        label: 'Nettoyage',
        color: 'green',
        icon: 'Sparkles',
        order: 5,
        description: 'Nettoyage professionnel, détachage',
      },
      {
        value: 'locksmith',
        label: 'Serrurerie',
        color: 'gray',
        icon: 'Key',
        order: 6,
        description: 'Serrures, clés, badges',
      },
      {
        value: 'it',
        label: 'Informatique',
        color: 'blue',
        icon: 'Monitor',
        order: 7,
        description: 'Matériel informatique, réseau, wifi',
      },
    ],
    interventionPriorities: [
      {
        value: 'critical',
        label: 'Critique',
        color: 'red',
        icon: 'AlertCircle',
        order: 0,
        description: 'Urgence absolue, impact majeur',
      },
      {
        value: 'high',
        label: 'Haute',
        color: 'orange',
        icon: 'ArrowUp',
        order: 1,
        description: 'Important, à traiter rapidement',
      },
      {
        value: 'normal',
        label: 'Normale',
        color: 'blue',
        icon: 'Minus',
        order: 2,
        description: 'Priorité standard',
      },
      {
        value: 'low',
        label: 'Basse',
        color: 'green',
        icon: 'ArrowDown',
        order: 3,
        description: 'Peut attendre',
      },
    ],
    interventionStatuses: [
      { value: 'pending', label: 'En attente', color: 'gray', icon: 'Clock', order: 0 },
      { value: 'in_progress', label: 'En cours', color: 'blue', icon: 'Play', order: 1 },
      { value: 'completed', label: 'Terminée', color: 'green', icon: 'CheckCircle', order: 2 },
      { value: 'cancelled', label: 'Annulée', color: 'red', icon: 'XCircle', order: 3 },
    ],
    interventionCategories: [
      {
        value: 'corrective',
        label: 'Corrective',
        color: 'orange',
        icon: 'Wrench',
        order: 0,
        description: 'Réparation après panne',
      },
      {
        value: 'preventive',
        label: 'Préventive',
        color: 'blue',
        icon: 'Shield',
        order: 1,
        description: 'Maintenance préventive',
      },
      {
        value: 'emergency',
        label: 'Urgence',
        color: 'red',
        icon: 'AlertTriangle',
        order: 2,
        description: 'Intervention urgente',
      },
      {
        value: 'improvement',
        label: 'Amélioration',
        color: 'green',
        icon: 'TrendingUp',
        order: 3,
        description: 'Amélioration qualité',
      },
    ],
    equipmentTypes: [
      { value: 'hvac', label: 'Climatisation/Chauffage', color: 'orange', icon: 'Wind', order: 0 },
      { value: 'elevator', label: 'Ascenseur', color: 'gray', icon: 'ArrowUp', order: 1 },
      { value: 'kitchen', label: 'Équipement cuisine', color: 'red', icon: 'ChefHat', order: 2 },
      { value: 'laundry', label: 'Buanderie', color: 'blue', icon: 'Shirt', order: 3 },
      { value: 'pool', label: 'Piscine', color: 'blue', icon: 'Waves', order: 4 },
      { value: 'security', label: 'Sécurité', color: 'red', icon: 'Shield', order: 5 },
    ],
    roomTypes: [
      { value: 'single', label: 'Chambre Simple', color: 'blue', icon: 'Bed', order: 0 },
      { value: 'double', label: 'Chambre Double', color: 'blue', icon: 'BedDouble', order: 1 },
      { value: 'twin', label: 'Chambre Twin', color: 'blue', icon: 'BedDouble', order: 2 },
      { value: 'suite', label: 'Suite', color: 'purple', icon: 'Crown', order: 3 },
      { value: 'family', label: 'Chambre Familiale', color: 'green', icon: 'Users', order: 4 },
    ],
    roomStatuses: [
      { value: 'clean', label: 'Propre', color: 'green', icon: 'CheckCircle', order: 0 },
      { value: 'dirty', label: 'Sale', color: 'red', icon: 'XCircle', order: 1 },
      { value: 'cleaning', label: 'En nettoyage', color: 'blue', icon: 'Sparkles', order: 2 },
      { value: 'maintenance', label: 'En maintenance', color: 'orange', icon: 'Wrench', order: 3 },
      {
        value: 'out_of_order',
        label: 'Hors service',
        color: 'red',
        icon: 'AlertTriangle',
        order: 4,
      },
    ],
    supplierCategories: [
      { value: 'maintenance', label: 'Maintenance', color: 'blue', icon: 'Wrench', order: 0 },
      { value: 'cleaning', label: 'Nettoyage', color: 'green', icon: 'Sparkles', order: 1 },
      { value: 'food', label: 'Alimentation', color: 'orange', icon: 'ShoppingCart', order: 2 },
      { value: 'laundry', label: 'Blanchisserie', color: 'blue', icon: 'Shirt', order: 3 },
      { value: 'it', label: 'Informatique', color: 'purple', icon: 'Monitor', order: 4 },
    ],
  },
};

// Les autres templates... (Resort, Motel, Hostel - identiques à avant)
const RESORT_SPA: Template = {
  ...HOTEL_STANDARD,
  id: 'resort-spa',
  name: 'Resort & Spa',
  itemCount: 52,
};
const MOTEL_BUDGET: Template = {
  ...HOTEL_STANDARD,
  id: 'motel-budget',
  name: 'Motel/Budget',
  itemCount: 28,
};
const HOSTEL: Template = {
  ...HOTEL_STANDARD,
  id: 'hostel',
  name: 'Auberge de jeunesse',
  itemCount: 25,
};

// ============================================================================
// CONFIGURATION DES LISTES
// ============================================================================

const LIST_CONFIGS: Record<string, unknown> = {
  interventionTypes: {
    name: "Types d'intervention",
    allowCustom: true,
    isRequired: true,
    isSystem: false,
  },
  interventionPriorities: {
    name: 'Priorités',
    allowCustom: false,
    isRequired: true,
    isSystem: false,
  },
  interventionStatuses: {
    name: 'Statuts',
    allowCustom: false,
    isRequired: true,
    isSystem: false,
  },
  interventionCategories: {
    name: 'Catégories',
    allowCustom: true,
    isRequired: false,
    isSystem: false,
  },
  equipmentTypes: {
    name: "Types d'équipement",
    allowCustom: true,
    isRequired: false,
    isSystem: false,
  },
  roomTypes: {
    name: 'Types de chambres',
    allowCustom: true,
    isRequired: false,
    isSystem: false,
  },
  roomStatuses: {
    name: 'Statuts chambres',
    allowCustom: false,
    isRequired: false,
    isSystem: false,
  },
  supplierCategories: {
    name: 'Catégories fournisseurs',
    allowCustom: true,
    isRequired: false,
    isSystem: false,
  },
};

// ============================================================================
// REGISTRE DES TEMPLATES
// ============================================================================

const TEMPLATES: Record<string, Template> = {
  'hotel-standard': HOTEL_STANDARD,
  'resort-spa': RESORT_SPA,
  'motel-budget': MOTEL_BUDGET,
  hostel: HOSTEL,
};

// ============================================================================
// FONCTIONS PUBLIQUES - VERSION DEBUG
// ============================================================================

/**
 * Obtenir tous les templates disponibles
 */
export const getAvailableTemplates = (): Template[] => {
  const templates = Object.values(TEMPLATES);
  return templates;
};

/**
 * Obtenir un template par son ID
 */
export const getTemplate = (templateId: string): Template | null => {
  const template = TEMPLATES[templateId] || null;
  return template;
};

/**
 * Appliquer un template - VERSION DEBUG
 */
export const applyTemplate = async (
  establishmentId: string,
  userId: string,
  templateId: string
): Promise<{ added: number; skipped: number }> => {
  // Vérifications
  if (!establishmentId) {
    logger.error('❌ ERREUR: establishmentId est vide !');
    throw new Error('Establishment ID manquant');
  }

  if (!userId) {
    logger.error('❌ ERREUR: userId est vide !');
    throw new Error('User ID manquant');
  }

  const template = getTemplate(templateId);
  if (!template) {
    logger.error(`❌ ERREUR: Template "${templateId}" non trouvé !`);
    throw new Error(`Template "${templateId}" non trouvé`);
  }

  let totalAdded = 0;
  let totalSkipped = 0;

  // Pour chaque liste du template
  for (const [listKey, items] of Object.entries(template.lists)) {
    try {
      // Créer la liste si elle n'existe pas
      const list = await referenceListsService.getList(establishmentId, listKey as ListKey);

      if (!list) {
        const config = LIST_CONFIGS[listKey];
        if (config) {
          await referenceListsService.createList(establishmentId, userId, listKey, config);
        } else {
          logger.warn(`⚠️ Config non trouvée pour ${listKey}`);
        }
      }

      // Ajouter les items
      for (const item of items) {
        try {
          // Vérifier si l'item existe déjà
          const existingList = await referenceListsService.getList(
            establishmentId,
            listKey as ListKey
          );
          const itemExists = existingList?.items.some(i => i.value === item.value);

          if (!itemExists) {
            await referenceListsService.addItem(establishmentId, userId, listKey as ListKey, {
              value: item.value,
              label: item.label,
              color: item.color,
              icon: item.icon,
              description: item.description || '',
            });
            totalAdded++;
          } else {
            totalSkipped++;
          }
        } catch (error: any) {
          logger.error(`  ❌ Erreur pour ${item.label}:`, error.message);
          totalSkipped++;
        }
      }
    } catch (error: any) {
      logger.error(`❌ Erreur traitement liste ${listKey}:`, error.message);
    }
  }

  return { added: totalAdded, skipped: totalSkipped };
};

export default {
  getAvailableTemplates,
  getTemplate,
  applyTemplate,
};
