/**
 * Default Reference Lists
 *
 * Listes de référence par défaut pour les nouveaux établissements
 * Ces listes sont automatiquement créées lors de l'initialisation d'un établissement
 */

import type { ListConfig, ReferenceItem } from '@/shared/types/reference-lists.types';

/**
 * Créer un item de référence
 */
const createItem = (
  value: string,
  label: string,
  order: number,
  options?: {
    color?: string;
    icon?: string;
    description?: string;
  }
): ReferenceItem => ({
  id: `${value}_${Date.now()}_${order}`,
  value,
  label,
  order,
  isActive: true,
  color: options?.color,
  icon: options?.icon,
  description: options?.description,
  usageCount: 0,
  createdAt: new Date(),
});

/**
 * Listes par défaut pour les types d'intervention
 */
const interventionTypesDefault: ListConfig = {
  name: "Types d'intervention",
  description: 'Différents types de travaux et interventions',
  allowCustom: true,
  isRequired: true,
  isSystem: false,
  items: [
    createItem('plumbing', 'Plomberie', 1, { color: 'blue', icon: 'Droplet' }),
    createItem('electricity', 'Électricité', 2, { color: 'yellow', icon: 'Zap' }),
    createItem('heating', 'Chauffage', 3, { color: 'orange', icon: 'Flame' }),
    createItem('air_conditioning', 'Climatisation', 4, { color: 'cyan', icon: 'Wind' }),
    createItem('carpentry', 'Menuiserie', 5, { color: 'amber', icon: 'Hammer' }),
    createItem('painting', 'Peinture', 6, { color: 'purple', icon: 'Paintbrush' }),
    createItem('locksmith', 'Serrurerie', 7, { color: 'gray', icon: 'Key' }),
    createItem('cleaning', 'Nettoyage', 8, { color: 'green', icon: 'Sparkles' }),
    createItem('it', 'Informatique', 9, { color: 'indigo', icon: 'Monitor' }),
    createItem('furniture', 'Mobilier', 10, { color: 'rose', icon: 'Armchair' }),
    createItem('appliance', 'Électroménager', 11, { color: 'teal', icon: 'Refrigerator' }),
    createItem('gardening', 'Jardinage', 12, { color: 'lime', icon: 'TreeDeciduous' }),
    createItem('security', 'Sécurité', 13, { color: 'red', icon: 'Shield' }),
    createItem('telecom', 'Télécom', 14, { color: 'sky', icon: 'Phone' }),
    createItem('other', 'Autre', 15, { color: 'gray', icon: 'MoreHorizontal' }),
  ],
};

/**
 * Priorités d'intervention
 */
const interventionPrioritiesDefault: ListConfig = {
  name: 'Priorités',
  description: "Niveaux de priorité des interventions",
  allowCustom: false,
  isRequired: true,
  isSystem: true, // Système car utilisé dans la logique métier
  items: [
    createItem('low', 'Basse', 1, { color: 'green', icon: 'ArrowDown' }),
    createItem('normal', 'Normale', 2, { color: 'blue', icon: 'Minus' }),
    createItem('high', 'Haute', 3, { color: 'orange', icon: 'ArrowUp' }),
    createItem('urgent', 'Urgente', 4, { color: 'red', icon: 'AlertCircle' }),
    createItem('critical', 'Critique', 5, { color: 'red', icon: 'AlertTriangle' }),
  ],
};

/**
 * Catégories d'intervention
 */
const interventionCategoriesDefault: ListConfig = {
  name: "Catégories d'intervention",
  description: "Nature de l'intervention",
  allowCustom: false,
  isRequired: true,
  isSystem: true,
  items: [
    createItem('maintenance', 'Maintenance préventive', 1, {
      color: 'blue',
      icon: 'Settings',
      description: 'Entretien régulier et préventif',
    }),
    createItem('repair', 'Réparation', 2, {
      color: 'orange',
      icon: 'Wrench',
      description: 'Correction de pannes ou dysfonctionnements',
    }),
    createItem('installation', 'Installation', 3, {
      color: 'green',
      icon: 'Plus',
      description: 'Mise en place de nouveaux équipements',
    }),
    createItem('inspection', 'Inspection', 4, {
      color: 'purple',
      icon: 'Eye',
      description: 'Contrôle et vérification',
    }),
    createItem('emergency', 'Urgence', 5, {
      color: 'red',
      icon: 'Siren',
      description: 'Intervention urgente nécessitant une action immédiate',
    }),
  ],
};

/**
 * Statuts d'intervention (système, non modifiable)
 */
const interventionStatusesDefault: ListConfig = {
  name: "Statuts d'intervention",
  description: "États du cycle de vie d'une intervention",
  allowCustom: false,
  isRequired: true,
  isSystem: true, // Ne peut pas être modifié
  items: [
    createItem('draft', 'Brouillon', 1, { color: 'gray', icon: 'FileEdit' }),
    createItem('pending', 'En attente', 2, { color: 'yellow', icon: 'Clock' }),
    createItem('assigned', 'Assignée', 3, { color: 'blue', icon: 'UserCheck' }),
    createItem('in_progress', 'En cours', 4, { color: 'indigo', icon: 'PlayCircle' }),
    createItem('on_hold', 'En pause', 5, { color: 'orange', icon: 'PauseCircle' }),
    createItem('completed', 'Terminée', 6, { color: 'green', icon: 'CheckCircle' }),
    createItem('validated', 'Validée', 7, { color: 'emerald', icon: 'CheckCheck' }),
    createItem('cancelled', 'Annulée', 8, { color: 'red', icon: 'XCircle' }),
  ],
};

/**
 * Types de chambres
 */
const roomTypesDefault: ListConfig = {
  name: 'Types de chambres',
  description: 'Classification des chambres',
  allowCustom: true,
  isRequired: false,
  isSystem: false,
  items: [
    createItem('single', 'Chambre simple', 1, { color: 'blue', icon: 'Bed' }),
    createItem('double', 'Chambre double', 2, { color: 'indigo', icon: 'BedDouble' }),
    createItem('twin', 'Chambre twin', 3, { color: 'purple', icon: 'BedDouble' }),
    createItem('suite', 'Suite', 4, { color: 'amber', icon: 'Crown' }),
    createItem('family', 'Chambre familiale', 5, { color: 'green', icon: 'Home' }),
    createItem('accessible', 'Chambre PMR', 6, { color: 'cyan', icon: 'Accessibility' }),
  ],
};

/**
 * Statuts de chambres
 */
const roomStatusesDefault: ListConfig = {
  name: 'Statuts de chambres',
  description: 'État des chambres',
  allowCustom: false,
  isRequired: false,
  isSystem: false,
  items: [
    createItem('available', 'Disponible', 1, { color: 'green', icon: 'Check' }),
    createItem('occupied', 'Occupée', 2, { color: 'blue', icon: 'User' }),
    createItem('cleaning', 'En nettoyage', 3, { color: 'yellow', icon: 'Sparkles' }),
    createItem('maintenance', 'Maintenance', 4, { color: 'orange', icon: 'Wrench' }),
    createItem('blocked', 'Bloquée', 5, { color: 'red', icon: 'Lock' }),
    createItem('out_of_service', 'Hors service', 6, { color: 'gray', icon: 'XCircle' }),
  ],
};

/**
 * Types de lits
 */
const bedTypesDefault: ListConfig = {
  name: 'Types de lits',
  description: 'Types de lits disponibles',
  allowCustom: true,
  isRequired: false,
  isSystem: false,
  items: [
    createItem('single', 'Lit simple', 1, { color: 'blue', icon: 'Bed' }),
    createItem('double', 'Lit double', 2, { color: 'indigo', icon: 'BedDouble' }),
    createItem('queen', 'Lit queen', 3, { color: 'purple', icon: 'BedDouble' }),
    createItem('king', 'Lit king', 4, { color: 'amber', icon: 'Crown' }),
    createItem('bunk', 'Lit superposé', 5, { color: 'cyan', icon: 'Layers' }),
    createItem('sofa', 'Canapé-lit', 6, { color: 'teal', icon: 'Armchair' }),
  ],
};

/**
 * Catégories de dépenses
 */
const expenseCategoriesDefault: ListConfig = {
  name: 'Catégories de dépenses',
  description: 'Types de dépenses',
  allowCustom: true,
  isRequired: false,
  isSystem: false,
  items: [
    createItem('materials', 'Matériaux', 1, { color: 'amber', icon: 'Package' }),
    createItem('labor', 'Main-d\'œuvre', 2, { color: 'blue', icon: 'Users' }),
    createItem('equipment', 'Équipement', 3, { color: 'purple', icon: 'Wrench' }),
    createItem('external', 'Prestation externe', 4, { color: 'indigo', icon: 'Building' }),
    createItem('emergency', 'Urgence', 5, { color: 'red', icon: 'AlertCircle' }),
    createItem('other', 'Autre', 6, { color: 'gray', icon: 'MoreHorizontal' }),
  ],
};

/**
 * Moyens de paiement
 */
const paymentMethodsDefault: ListConfig = {
  name: 'Moyens de paiement',
  description: 'Modes de règlement',
  allowCustom: true,
  isRequired: false,
  isSystem: false,
  items: [
    createItem('cash', 'Espèces', 1, { color: 'green', icon: 'Banknote' }),
    createItem('card', 'Carte bancaire', 2, { color: 'blue', icon: 'CreditCard' }),
    createItem('check', 'Chèque', 3, { color: 'indigo', icon: 'FileCheck' }),
    createItem('transfer', 'Virement', 4, { color: 'purple', icon: 'ArrowRightLeft' }),
    createItem('other', 'Autre', 5, { color: 'gray', icon: 'MoreHorizontal' }),
  ],
};

/**
 * Collection complète des listes par défaut
 */
export const DEFAULT_REFERENCE_LISTS: Record<string, ListConfig> = {
  // Interventions (essentielles)
  interventionTypes: interventionTypesDefault,
  interventionPriorities: interventionPrioritiesDefault,
  interventionCategories: interventionCategoriesDefault,
  interventionStatuses: interventionStatusesDefault,

  // Chambres (si feature activée)
  roomTypes: roomTypesDefault,
  roomStatuses: roomStatusesDefault,
  bedTypes: bedTypesDefault,

  // Finances (optionnel)
  expenseCategories: expenseCategoriesDefault,
  paymentMethods: paymentMethodsDefault,
};

/**
 * Obtenir les listes essentielles (toujours créées)
 */
export const getEssentialLists = (): Record<string, ListConfig> => {
  return {
    interventionTypes: interventionTypesDefault,
    interventionPriorities: interventionPrioritiesDefault,
    interventionCategories: interventionCategoriesDefault,
    interventionStatuses: interventionStatusesDefault,
  };
};

/**
 * Obtenir les listes selon les features activées
 */
export const getListsByFeatures = (features: {
  rooms?: boolean;
  exports?: boolean;
}): Record<string, ListConfig> => {
  const lists: Record<string, ListConfig> = { ...getEssentialLists() };

  // Ajouter les listes de rooms si feature activée
  if (features.rooms) {
    lists.roomTypes = roomTypesDefault;
    lists.roomStatuses = roomStatusesDefault;
    lists.bedTypes = bedTypesDefault;
  }

  // Ajouter les listes de finances si exports activés (pour les rapports)
  if (features.exports) {
    lists.expenseCategories = expenseCategoriesDefault;
    lists.paymentMethods = paymentMethodsDefault;
  }

  return lists;
};
