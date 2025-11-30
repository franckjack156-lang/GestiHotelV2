/**
 * ============================================================================
 * TEMPLATE GENERATOR SERVICE
 * ============================================================================
 *
 * Génère des templates Excel pour import de données
 */

import * as XLSX from 'xlsx';

/**
 * Génère un template Excel pour import interventions
 * Version 2.0 - 21 colonnes
 */
export const generateInterventionsTemplate = (): Blob => {
  // En-têtes avec indication des champs obligatoires
  const headers = {
    titre: 'TITRE *',
    description: 'DESCRIPTION',
    statut: 'STATUT *',
    type: 'TYPE',
    categorie: 'CATEGORIE',
    priorite: 'PRIORITE',
    localisation: 'LOCALISATION',
    numero_chambre: 'NUMERO CHAMBRE',
    etage: 'ETAGE',
    batiment: 'BATIMENT',
    technicien: 'TECHNICIEN (Prenom Nom)',
    createur: 'CREATEUR (Prenom Nom)',
    date_creation: 'DATE CREATION (JJ/MM/AAAA)',
    date_planifiee: 'DATE PLANIFIEE (JJ/MM/AAAA)',
    heure_planifiee: 'HEURE PLANIFIEE (HH:MM)',
    duree_estimee: 'DUREE ESTIMEE (minutes)',
    notes_internes: 'NOTES INTERNES',
    notes_resolution: 'NOTES RESOLUTION',
    date_limite: 'DATE LIMITE (JJ/MM/AAAA)',
    tags: 'TAGS (separés par virgules)',
    reference_externe: 'REFERENCE EXTERNE',
  };

  // Ligne d'instructions détaillées
  const instructions = {
    titre: '* = Champ obligatoire',
    description: 'Description détaillée du problème (recommandé)',
    statut: 'nouveau | en_attente | assigne | en_cours | en_pause | termine | annule | reporte',
    type: 'plumbing | electricity | heating | air_conditioning | carpentry | painting | cleaning | locksmith | glazing | masonry | appliance | furniture | it | security | garden | pool | other',
    categorie: 'maintenance | repair | installation | inspection | emergency',
    priorite: 'low | normal | high | urgent | critical',
    localisation: 'Description du lieu (ex: Chambre, Couloir 2e etage, Hall)',
    numero_chambre: 'Numero de chambre si applicable',
    etage: 'Numero etage (1, 2, 3...)',
    batiment: 'Nom du batiment si plusieurs',
    technicien: 'Prenom et nom du technicien (ex: Jean Dupont)',
    createur: 'Prenom et nom du createur (si vide = utilisateur connecte)',
    date_creation: 'Date de creation (25/12/2025) - si vide = aujourdhui',
    date_planifiee: 'Date de planification (25/12/2025)',
    heure_planifiee: 'Heure de planification (14:30)',
    duree_estimee: 'Duree estimee en minutes (ex: 60)',
    notes_internes: 'Notes visibles uniquement par equipe',
    notes_resolution: 'Notes de resolution apres cloture',
    date_limite: 'Date limite personnalisee (25/12/2025)',
    tags: 'Tags separes par virgules (ex: Urgent,Client VIP)',
    reference_externe: 'Reference externe (PMS, autre systeme)',
  };

  // Ligne vide
  const separator = {};

  // Exemples d'interventions
  const examples = [
    {
      titre: 'Fuite eau salle de bain chambre 301',
      description: 'Fuite importante au niveau du lavabo. Eau qui coule en continu.',
      statut: 'en_cours',
      type: 'plumbing',
      categorie: 'emergency',
      priorite: 'urgent',
      localisation: 'Chambre 301 - Salle de bain',
      numero_chambre: '301',
      etage: '3',
      batiment: 'Batiment Principal',
      technicien: 'Jean Dupont',
      createur: 'Marie Martin',
      date_creation: '15/11/2025',
      date_planifiee: '',
      heure_planifiee: '',
      duree_estimee: '90',
      notes_internes: 'Client occupe la chambre - Intervention urgente',
      notes_resolution: '',
      date_limite: '',
      tags: 'Urgent,Plomberie',
      reference_externe: 'PMS-2025-1234',
    },
    {
      titre: 'Ampoule grillée couloir 2e étage',
      description: 'Ampoule LED du plafonnier grillée',
      statut: 'nouveau',
      type: 'electricity',
      categorie: 'maintenance',
      priorite: 'low',
      localisation: 'Couloir 2e etage',
      numero_chambre: '',
      etage: '2',
      batiment: '',
      technicien: '',
      createur: '',
      date_creation: '',
      date_planifiee: '20/11/2025',
      heure_planifiee: '10:00',
      duree_estimee: '15',
      notes_internes: 'Prevoir echelle',
      notes_resolution: '',
      date_limite: '',
      tags: '',
      reference_externe: '',
    },
    {
      titre: 'Controle annuel climatisation chambre 205',
      description: 'Controle preventif annuel du systeme de climatisation',
      statut: 'termine',
      type: 'air_conditioning',
      categorie: 'maintenance',
      priorite: 'normal',
      localisation: 'Chambre 205',
      numero_chambre: '205',
      etage: '2',
      batiment: '',
      technicien: 'Pierre Leroy',
      createur: 'Sophie Dubois',
      date_creation: '10/11/2025',
      date_planifiee: '25/11/2025',
      heure_planifiee: '14:00',
      duree_estimee: '45',
      notes_internes: 'Chambre libre ce jour',
      notes_resolution: 'Controle effectue. Systeme en bon etat. Filtre change.',
      date_limite: '30/11/2025',
      tags: 'Maintenance,Climatisation',
      reference_externe: '',
    },
  ];

  const data = [headers, instructions, separator, ...examples];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });

  // Définir la largeur des colonnes (21 colonnes)
  const colWidths = [
    { wch: 40 }, // titre
    { wch: 50 }, // description
    { wch: 12 }, // statut
    { wch: 20 }, // type
    { wch: 15 }, // categorie
    { wch: 12 }, // priorite
    { wch: 30 }, // localisation
    { wch: 15 }, // numero_chambre
    { wch: 8 }, // etage
    { wch: 20 }, // batiment
    { wch: 25 }, // technicien (Prenom Nom)
    { wch: 25 }, // createur (Prenom Nom)
    { wch: 18 }, // date_creation
    { wch: 18 }, // date_planifiee
    { wch: 18 }, // heure_planifiee
    { wch: 18 }, // duree_estimee
    { wch: 40 }, // notes_internes
    { wch: 40 }, // notes_resolution
    { wch: 18 }, // date_limite
    { wch: 30 }, // tags
    { wch: 20 }, // reference_externe
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

  // Ajouter une feuille d'aide (21 champs)
  const helpData = [
    {
      Champ: 'TITRE *',
      Description: 'Titre court et descriptif de intervention (OBLIGATOIRE)',
      Exemple: 'Fuite eau chambre 301',
    },
    {
      Champ: 'DESCRIPTION',
      Description: 'Description détaillée du problème (recommandé)',
      Exemple: 'Fuite importante au niveau du lavabo',
    },
    {
      Champ: 'STATUT *',
      Description: 'Statut de intervention (OBLIGATOIRE)',
      Exemple: 'nouveau, en_attente, assigne, en_cours, en_pause, termine, annule, reporte',
    },
    {
      Champ: 'TYPE',
      Description: 'Type intervention (optionnel)',
      Exemple:
        'plumbing, electricity, heating, air_conditioning, carpentry, painting, cleaning, etc.',
    },
    {
      Champ: 'CATEGORIE',
      Description: 'Catégorie intervention (optionnel)',
      Exemple: 'maintenance, repair, installation, inspection, emergency',
    },
    {
      Champ: 'PRIORITE',
      Description: 'Niveau de priorité (optionnel)',
      Exemple: 'low, normal, high, urgent, critical',
    },
    {
      Champ: 'LOCALISATION',
      Description: 'Lieu de intervention (optionnel)',
      Exemple: 'Chambre 301, Couloir 2e étage, Hall',
    },
    {
      Champ: 'NUMERO CHAMBRE',
      Description: 'Numéro de chambre si applicable',
      Exemple: '301, 205',
    },
    { Champ: 'ETAGE', Description: 'Numéro étage (nombre)', Exemple: '1, 2, 3' },
    {
      Champ: 'BATIMENT',
      Description: 'Nom du bâtiment si plusieurs',
      Exemple: 'Principal, Annexe A',
    },
    {
      Champ: 'TECHNICIEN',
      Description: 'Prénom et nom du technicien à assigner',
      Exemple: 'Jean Dupont, Marie Martin',
    },
    {
      Champ: 'CREATEUR',
      Description: 'Prénom et nom du créateur (si vide = utilisateur connecté)',
      Exemple: 'Sophie Dubois',
    },
    {
      Champ: 'DATE CREATION',
      Description: "Date de création (JJ/MM/AAAA) - si vide = aujourd'hui",
      Exemple: '15/11/2025',
    },
    {
      Champ: 'DATE PLANIFIEE',
      Description: 'Date de planification (JJ/MM/AAAA)',
      Exemple: '25/12/2025',
    },
    { Champ: 'HEURE PLANIFIEE', Description: 'Heure de planification (HH:MM)', Exemple: '14:30' },
    {
      Champ: 'DUREE ESTIMEE',
      Description: 'Durée estimée en minutes (nombre)',
      Exemple: '60, 90, 120',
    },
    {
      Champ: 'NOTES INTERNES',
      Description: 'Notes visibles uniquement par équipe',
      Exemple: 'Chambre occupée - prévoir clé',
    },
    {
      Champ: 'NOTES RESOLUTION',
      Description: 'Notes de résolution après clôture',
      Exemple: 'Problème résolu, pièce remplacée',
    },
    {
      Champ: 'DATE LIMITE',
      Description: 'Date limite personnalisée (JJ/MM/AAAA)',
      Exemple: '30/11/2025',
    },
    {
      Champ: 'TAGS',
      Description: 'Tags séparés par virgules',
      Exemple: 'Urgent,Client VIP,Maintenance',
    },
    {
      Champ: 'REFERENCE EXTERNE',
      Description: 'Référence externe (PMS, autre système)',
      Exemple: 'PMS-2025-1234',
    },
  ];

  const wsHelp = XLSX.utils.json_to_sheet(helpData);
  wsHelp['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsHelp, 'Aide');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

/**
 * Télécharge le template interventions
 */
export const downloadInterventionsTemplate = () => {
  const blob = generateInterventionsTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = 'gestihotel_template_interventions_' + date + '.xlsx';
  link.click();
  URL.revokeObjectURL(url);
};
