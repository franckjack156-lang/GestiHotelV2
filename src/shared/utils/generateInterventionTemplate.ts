/**
 * ============================================================================
 * GENERATE INTERVENTION TEMPLATE
 * ============================================================================
 *
 * Génère un fichier Excel template pour l'import des interventions
 * Avec tous les champs disponibles et des exemples
 */

import * as XLSX from 'xlsx';

/**
 * Structure du template
 */
interface InterventionTemplateRow {
  'Titre ⚠️': string;
  'Description': string;
  'Type ⚠️': string;
  'Catégorie': string;
  'Priorité ⚠️': string;
  'Localisation': string;
  'Chambre': string;
  'Étage': string;
  'Bâtiment': string;
  'Urgent': string;
  'Bloquant': string;
  'Notes Internes': string;
  'Référence Externe': string;
}

/**
 * Données d'exemple pour le template
 */
const exampleData: InterventionTemplateRow[] = [
  {
    'Titre ⚠️': 'Fuite robinet chambre 101',
    'Description': "L'eau fuit du robinet de la douche depuis hier",
    'Type ⚠️': 'Plomberie',
    'Catégorie': 'Réparation',
    'Priorité ⚠️': 'urgente',
    'Localisation': 'Salle de bain',
    'Chambre': '101',
    'Étage': '1',
    'Bâtiment': 'A',
    'Urgent': 'oui',
    'Bloquant': 'oui',
    'Notes Internes': 'Client évacué temporairement',
    'Référence Externe': 'PMS-12345',
  },
  {
    'Titre ⚠️': 'Ampoule grillée couloir',
    'Description': 'Ampoule du couloir étage 2 ne fonctionne plus',
    'Type ⚠️': 'Électricité',
    'Catégorie': 'Maintenance',
    'Priorité ⚠️': 'basse',
    'Localisation': 'Couloir étage 2',
    'Chambre': '',
    'Étage': '2',
    'Bâtiment': 'A',
    'Urgent': 'non',
    'Bloquant': 'non',
    'Notes Internes': '',
    'Référence Externe': '',
  },
  {
    'Titre ⚠️': 'Climatisation en panne',
    'Description': 'La climatisation ne refroidit plus correctement',
    'Type ⚠️': 'Climatisation',
    'Catégorie': 'Réparation',
    'Priorité ⚠️': 'haute',
    'Localisation': 'Chambre principale',
    'Chambre': '205',
    'Étage': '2',
    'Bâtiment': 'B',
    'Urgent': 'no',
    'Bloquant': 'yes',
    'Notes Internes': '',
    'Référence Externe': 'TICKET-456',
  },
  {
    'Titre ⚠️': 'Peinture écaillée',
    'Description': 'Mur de la chambre présente des écailles de peinture',
    'Type ⚠️': 'Peinture',
    'Catégorie': 'Maintenance préventive',
    'Priorité ⚠️': 'normale',
    'Localisation': 'Chambre',
    'Chambre': '310',
    'Étage': '3',
    'Bâtiment': 'A',
    'Urgent': 'non',
    'Bloquant': 'non',
    'Notes Internes': '',
    'Référence Externe': '',
  },
  {
    'Titre ⚠️': 'Serrure bloquée',
    'Description': 'La serrure de la porte est bloquée, impossible de fermer à clé',
    'Type ⚠️': 'Serrurerie',
    'Catégorie': 'Réparation',
    'Priorité ⚠️': 'haute',
    'Localisation': 'Porte d\'entrée',
    'Chambre': '412',
    'Étage': '4',
    'Bâtiment': 'B',
    'Urgent': '1',
    'Bloquant': '0',
    'Notes Internes': 'Client signale le problème depuis 2 jours',
    'Référence Externe': '',
  },
];

/**
 * Génère un template vierge (sans exemples)
 */
export const generateBlankTemplate = (): ArrayBuffer => {
  const blankRow: InterventionTemplateRow = {
    'Titre ⚠️': '',
    'Description': '',
    'Type ⚠️': '',
    'Catégorie': '',
    'Priorité ⚠️': '',
    'Localisation': '',
    'Chambre': '',
    'Étage': '',
    'Bâtiment': '',
    'Urgent': '',
    'Bloquant': '',
    'Notes Internes': '',
    'Référence Externe': '',
  };

  const ws = XLSX.utils.json_to_sheet([blankRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

  // Générer le buffer
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

/**
 * Génère un template avec exemples
 */
export const generateExampleTemplate = (): ArrayBuffer => {
  const ws = XLSX.utils.json_to_sheet(exampleData);
  const wb = XLSX.utils.book_new();

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 30 }, // Titre
    { wch: 40 }, // Description
    { wch: 15 }, // Type
    { wch: 20 }, // Catégorie
    { wch: 12 }, // Priorité
    { wch: 25 }, // Localisation
    { wch: 10 }, // Chambre
    { wch: 8 },  // Étage
    { wch: 12 }, // Bâtiment
    { wch: 10 }, // Urgent
    { wch: 10 }, // Bloquant
    { wch: 30 }, // Notes Internes
    { wch: 20 }, // Référence Externe
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

  // Ajouter une feuille d'instructions
  const instructionsData = [
    ['GUIDE D\'UTILISATION DU TEMPLATE INTERVENTIONS'],
    [''],
    ['CHAMPS OBLIGATOIRES ⚠️'],
    ['Ces champs DOIVENT être remplis pour chaque ligne :'],
    ['1. Titre ⚠️', 'Titre de l\'intervention (3-100 caractères)'],
    ['2. Type ⚠️', 'Type d\'intervention selon vos listes de référence'],
    ['3. Priorité ⚠️', 'basse, normale, haute ou urgente'],
    [''],
    ['CHAMPS OPTIONNELS'],
    ['Description', 'Description détaillée (max 2000 caractères)'],
    ['Catégorie', 'Catégorie selon vos listes de référence'],
    ['Localisation', 'Description du lieu (max 200 caractères)'],
    ['Chambre', 'Numéro de chambre (max 20 caractères)'],
    ['Étage', 'Numéro d\'étage (-5 à 200)'],
    ['Bâtiment', 'Nom du bâtiment (max 50 caractères)'],
    ['Urgent', 'oui, non, yes, no, 1, 0, y, n, o'],
    ['Bloquant', 'oui, non, yes, no, 1, 0, y, n, o'],
    ['Notes Internes', 'Notes internes (max 1000 caractères)'],
    ['Référence Externe', 'Référence PMS ou autre (max 50 caractères)'],
    [''],
    ['VALEURS PRIORITÉ'],
    ['basse', 'Priorité basse'],
    ['normale', 'Priorité normale (par défaut)'],
    ['haute', 'Priorité haute'],
    ['urgente', 'Priorité urgente'],
    [''],
    ['VALEURS URGENT/BLOQUANT'],
    ['Pour "OUI"', 'oui, yes, 1, true, y, o'],
    ['Pour "NON"', 'non, no, 0, false, n'],
    ['Par défaut', 'Vide = NON'],
    [''],
    ['CONSEILS'],
    ['1. Testez avec 5-10 lignes avant d\'importer en masse'],
    ['2. Vérifiez les valeurs Type et Catégorie dans vos listes de référence'],
    ['3. Encodez le fichier en UTF-8 pour les accents'],
    ['4. Maximum 1000 lignes par import'],
    ['5. Ne laissez pas de lignes vides au milieu du fichier'],
    [''],
    ['NOMS DE COLONNES ACCEPTÉS (Variantes)'],
    ['Titre', 'Titre, Title, Nom, Name'],
    ['Type', 'Type'],
    ['Priorité', 'Priorité, Priority'],
    ['Localisation', 'Localisation, Location, Emplacement, Lieu'],
    ['Chambre', 'Chambre, Room, Numéro Chambre, RoomNumber'],
    ['Étage', 'Étage, Floor, Niveau'],
    ['Bâtiment', 'Bâtiment, Building'],
    [''],
    ['Pour plus d\'informations, consultez TEMPLATE_IMPORT_INTERVENTIONS.md'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Générer le buffer
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

/**
 * Télécharge le template vierge
 */
export const downloadBlankTemplate = () => {
  const buffer = generateBlankTemplate();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template-interventions-vierge.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Télécharge le template avec exemples
 */
export const downloadExampleTemplate = () => {
  const buffer = generateExampleTemplate();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template-interventions-exemples.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
