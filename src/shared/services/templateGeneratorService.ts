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
 */
export const generateInterventionsTemplate = (): Blob => {
  // En-têtes avec indication des champs obligatoires
  const headers = {
    titre: 'TITRE *',
    description: 'DESCRIPTION *',
    type: 'TYPE *',
    categorie: 'CATEGORIE *',
    priorite: 'PRIORITE *',
    localisation: 'LOCALISATION *',
    numero_chambre: 'NUMERO CHAMBRE',
    etage: 'ETAGE',
    batiment: 'BATIMENT',
    urgent: 'URGENT',
    bloquant: 'BLOQUANT (Chambre)',
    technicien_assigne: 'TECHNICIEN (Email)',
    date_planifiee: 'DATE PLANIFIEE (JJ/MM/AAAA)',
    heure_planifiee: 'HEURE PLANIFIEE (HH:MM)',
    duree_estimee: 'DUREE ESTIMEE (minutes)',
    notes_internes: 'NOTES INTERNES',
    date_limite: 'DATE LIMITE (JJ/MM/AAAA)',
  };

  // Ligne d'instructions détaillées
  const instructions = {
    titre: '* = Champ obligatoire',
    description: 'Description détaillée du problème',
    type: 'plumbing | electricity | heating | air_conditioning | carpentry | painting | cleaning | locksmith | glazing | masonry | appliance | furniture | it | security | garden | pool | other',
    categorie: 'maintenance | repair | installation | inspection | emergency',
    priorite: 'low | normal | high | urgent | critical',
    localisation: 'Description du lieu (ex: Chambre, Couloir 2e etage, Hall)',
    numero_chambre: 'Numero de chambre si applicable',
    etage: 'Numero etage (1, 2, 3...)',
    batiment: 'Nom du batiment si plusieurs',
    urgent: 'oui | non - Marque comme urgente',
    bloquant: 'oui | non - Bloque la chambre',
    technicien_assigne: 'Email du technicien a assigner',
    date_planifiee: 'Date de planification (25/12/2025)',
    heure_planifiee: 'Heure de planification (14:30)',
    duree_estimee: 'Duree estimee en minutes (ex: 60)',
    notes_internes: 'Notes visibles uniquement par equipe',
    date_limite: 'Date limite personnalisee (25/12/2025)',
  };

  // Ligne vide
  const separator = {};

  // Exemples d'interventions
  const examples = [
    {
      titre: 'Fuite eau salle de bain chambre 301',
      description: 'Fuite importante au niveau du lavabo. Eau qui coule en continu.',
      type: 'plumbing',
      categorie: 'emergency',
      priorite: 'urgent',
      localisation: 'Chambre 301 - Salle de bain',
      numero_chambre: '301',
      etage: '3',
      batiment: 'Batiment Principal',
      urgent: 'oui',
      bloquant: 'oui',
      technicien_assigne: 'technicien@hotel.com',
      date_planifiee: '',
      heure_planifiee: '',
      duree_estimee: '90',
      notes_internes: 'Client occupe la chambre - Intervention urgente',
      date_limite: '',
    },
    {
      titre: 'Ampoule grillée couloir 2e étage',
      description: 'Ampoule LED du plafonnier grillée',
      type: 'electricity',
      categorie: 'maintenance',
      priorite: 'low',
      localisation: 'Couloir 2e etage',
      numero_chambre: '',
      etage: '2',
      batiment: '',
      urgent: 'non',
      bloquant: 'non',
      technicien_assigne: '',
      date_planifiee: '20/11/2025',
      heure_planifiee: '10:00',
      duree_estimee: '15',
      notes_internes: 'Prevoir echelle',
      date_limite: '',
    },
    {
      titre: 'Controle annuel climatisation chambre 205',
      description: 'Controle preventif annuel du systeme de climatisation',
      type: 'air_conditioning',
      categorie: 'maintenance',
      priorite: 'normal',
      localisation: 'Chambre 205',
      numero_chambre: '205',
      etage: '2',
      batiment: '',
      urgent: 'non',
      bloquant: 'non',
      technicien_assigne: '',
      date_planifiee: '25/11/2025',
      heure_planifiee: '14:00',
      duree_estimee: '45',
      notes_internes: 'Chambre libre ce jour',
      date_limite: '30/11/2025',
    },
  ];

  const data = [headers, instructions, separator, ...examples];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });

  // Définir la largeur des colonnes
  const colWidths = [
    { wch: 40 }, // titre
    { wch: 50 }, // description
    { wch: 20 }, // type
    { wch: 15 }, // categorie
    { wch: 12 }, // priorite
    { wch: 30 }, // localisation
    { wch: 15 }, // numero_chambre
    { wch: 8 },  // etage
    { wch: 20 }, // batiment
    { wch: 10 }, // urgent
    { wch: 18 }, // bloquant
    { wch: 25 }, // technicien_assigne
    { wch: 18 }, // date_planifiee
    { wch: 18 }, // heure_planifiee
    { wch: 18 }, // duree_estimee
    { wch: 40 }, // notes_internes
    { wch: 18 }, // date_limite
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

  // Ajouter une feuille d'aide
  const helpData = [
    { Champ: 'TITRE *', Description: 'Titre court et descriptif de intervention (obligatoire)', Exemple: 'Fuite eau chambre 301' },
    { Champ: 'DESCRIPTION *', Description: 'Description détaillée du problème (obligatoire)', Exemple: 'Fuite importante au niveau du lavabo' },
    { Champ: 'TYPE *', Description: 'Type intervention (obligatoire)', Exemple: 'plumbing, electricity, heating, air_conditioning, etc.' },
    { Champ: 'CATEGORIE *', Description: 'Catégorie intervention (obligatoire)', Exemple: 'maintenance, repair, installation, inspection, emergency' },
    { Champ: 'PRIORITE *', Description: 'Niveau de priorité (obligatoire)', Exemple: 'low, normal, high, urgent, critical' },
    { Champ: 'LOCALISATION *', Description: 'Lieu de intervention (obligatoire)', Exemple: 'Chambre 301, Couloir 2e étage' },
    { Champ: 'NUMERO CHAMBRE', Description: 'Numéro de chambre si applicable', Exemple: '301, 205' },
    { Champ: 'ETAGE', Description: 'Numéro étage', Exemple: '1, 2, 3' },
    { Champ: 'BATIMENT', Description: 'Nom du bâtiment', Exemple: 'Principal, Annexe' },
    { Champ: 'URGENT', Description: 'Marquer comme urgente (oui/non)', Exemple: 'oui, non' },
    { Champ: 'BLOQUANT', Description: 'Bloque la chambre (oui/non)', Exemple: 'oui, non' },
    { Champ: 'TECHNICIEN', Description: 'Email du technicien à assigner', Exemple: 'technicien@hotel.com' },
    { Champ: 'DATE PLANIFIEE', Description: 'Date de planification (JJ/MM/AAAA)', Exemple: '25/12/2025' },
    { Champ: 'HEURE PLANIFIEE', Description: 'Heure de planification (HH:MM)', Exemple: '14:30' },
    { Champ: 'DUREE ESTIMEE', Description: 'Durée estimée en minutes', Exemple: '60, 90, 120' },
    { Champ: 'NOTES INTERNES', Description: 'Notes visibles uniquement par équipe', Exemple: 'Chambre occupée' },
    { Champ: 'DATE LIMITE', Description: 'Date limite personnalisée (JJ/MM/AAAA)', Exemple: '30/11/2025' },
  ];

  const wsHelp = XLSX.utils.json_to_sheet(helpData);
  wsHelp['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsHelp, 'Aide');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
