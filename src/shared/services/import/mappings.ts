/**
 * ============================================================================
 * IMPORT SERVICE - MAPPINGS
 * ============================================================================
 *
 * Mappings des colonnes Excel vers les schémas de validation
 */

/**
 * Mapping des colonnes pour interventions - VERSION 2.0 (21 colonnes)
 */
export const INTERVENTION_KEY_MAPPING: Record<string, string> = {
  // Titre
  titre: 'titre',
  title: 'titre',
  'titre*': 'titre',

  // Description
  description: 'description',
  desc: 'description',
  'description*': 'description',

  // Statut
  statut: 'statut',
  status: 'statut',
  etat: 'statut',
  'statut*': 'statut',

  // Type
  type: 'type',

  // Catégorie
  categorie: 'categorie',
  category: 'categorie',

  // Priorité
  priorite: 'priorite',
  priority: 'priorite',

  // Localisation
  localisation: 'localisation',
  location: 'localisation',
  emplacement: 'localisation',
  lieu: 'localisation',

  // Numéro chambre
  numerochambre: 'numerochambre',
  numero_chambre: 'numerochambre',
  chambre: 'numerochambre',
  room: 'numerochambre',
  roomnumber: 'numerochambre',

  // Étage
  etage: 'etage',
  floor: 'etage',
  niveau: 'etage',

  // Bâtiment
  batiment: 'batiment',
  building: 'batiment',

  // Technicien
  technicien: 'technicien',
  technician: 'technicien',
  assignea: 'technicien',
  technicienprenomnom: 'technicien',

  // Créateur
  createur: 'createur',
  creator: 'createur',
  creepar: 'createur',
  createurprenomnom: 'createur',

  // Date création
  datecreation: 'datecreation',
  date_creation: 'datecreation',
  creationdate: 'datecreation',
  datecrea: 'datecreation',
  datecreationjjmmaaaa: 'datecreation',

  // Date planifiée
  dateplanifiee: 'dateplanifiee',
  date_planifiee: 'dateplanifiee',
  scheduleddate: 'dateplanifiee',
  dateprevue: 'dateplanifiee',
  dateplanifieejjmmaaaa: 'dateplanifiee',

  // Heure planifiée
  heureplanifiee: 'heureplanifiee',
  heure_planifiee: 'heureplanifiee',
  scheduledtime: 'heureplanifiee',
  heure: 'heureplanifiee',
  heureplanifieehhmm: 'heureplanifiee',

  // Durée estimée
  dureeestimee: 'dureeestimee',
  duree_estimee: 'dureeestimee',
  estimatedduration: 'dureeestimee',
  duree: 'dureeestimee',
  dureeestimeeminutes: 'dureeestimee',

  // Notes internes
  notesinternes: 'notesinternes',
  notes_internes: 'notesinternes',
  internalnotes: 'notesinternes',
  notes: 'notesinternes',

  // Notes résolution
  notesresolution: 'notesresolution',
  notes_resolution: 'notesresolution',
  resolutionnotes: 'notesresolution',

  // Date limite
  datelimite: 'datelimite',
  date_limite: 'datelimite',
  duedate: 'datelimite',
  deadline: 'datelimite',
  datelimitejjmmaaaa: 'datelimite',

  // Tags
  tags: 'tags',
  etiquettes: 'tags',
  tagsseparesparvirgules: 'tags',

  // Référence externe
  referenceexterne: 'referenceexterne',
  reference_externe: 'referenceexterne',
  externalreference: 'referenceexterne',
  reference: 'referenceexterne',
  ref: 'referenceexterne',
};

/**
 * Mapping des colonnes pour chambres
 */
export const ROOM_KEY_MAPPING: Record<string, string> = {
  numero: 'numero',
  number: 'numero',
  numerochambre: 'numero',
  roomnumber: 'numero',
  nom: 'nom',
  name: 'nom',
  batiment: 'batiment',
  building: 'batiment',
  etage: 'etage',
  floor: 'etage',
  niveau: 'etage',
  type: 'type',
  typechambre: 'type',
  roomtype: 'type',
  capacite: 'capacite',
  capacity: 'capacite',
  personnes: 'capacite',
  prix: 'prix',
  price: 'prix',
  tarif: 'prix',
  surface: 'surface',
  area: 'surface',
  taille: 'surface',
  description: 'description',
  desc: 'description',
  equipements: 'equipements',
  equipment: 'equipements',
  amenities: 'equipements',
};
