# Template Import Interventions - Version 2.0

## 📊 Vue d'ensemble

Nouveau template Excel avec **21 colonnes** pour l'import d'interventions, incluant les données de création ET de vie des interventions.

## ✅ Champs Obligatoires (3)

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **TITRE *** | Titre court et descriptif | "Fuite eau chambre 301" |
| **DESCRIPTION *** | Description détaillée du problème | "Fuite importante au niveau du lavabo" |
| **STATUT *** | Statut de l'intervention | "nouveau", "en_cours", "termine" |

### Valeurs possibles pour STATUT:
- `nouveau` - Nouvelle intervention créée
- `en_attente` - En attente d'assignation ou d'action
- `assigne` - Assignée à un technicien
- `en_cours` - En cours de traitement
- `en_pause` - Mise en pause temporaire
- `termine` - Intervention terminée
- `annule` - Intervention annulée
- `reporte` - Intervention reportée

## 📝 Champs Optionnels - Classification (4)

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **TYPE** | Type d'intervention | "plumbing", "electricity" |
| **CATEGORIE** | Catégorie d'intervention | "maintenance", "repair", "emergency" |
| **PRIORITE** | Niveau de priorité | "low", "normal", "high", "urgent", "critical" |
| **LOCALISATION** | Lieu de l'intervention | "Chambre 301", "Couloir 2e étage" |

### Valeurs possibles:

**TYPE:**
- plumbing, electricity, heating, air_conditioning, carpentry, painting, cleaning, locksmith, glazing, masonry, appliance, furniture, it, security, garden, pool, other

**CATEGORIE:**
- maintenance, repair, installation, inspection, emergency

**PRIORITE:**
- low (Basse)
- normal (Normale)
- high (Haute)
- urgent (Urgente)
- critical (Critique)

## 📍 Champs Optionnels - Localisation (3)

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **NUMERO CHAMBRE** | Numéro de chambre | "301", "205" |
| **ETAGE** | Numéro d'étage (nombre) | 1, 2, 3 |
| **BATIMENT** | Nom du bâtiment | "Principal", "Annexe A" |

## 👤 Champs Optionnels - Personnes (2)

| Colonne | Description | Exemple | Notes |
|---------|-------------|---------|-------|
| **TECHNICIEN** | Prénom et nom du technicien | "Jean Dupont" | Plusieurs prénoms/noms possibles → matcher par nom complet |
| **CREATEUR** | Prénom et nom du créateur | "Marie Martin" | Si vide = utilisateur connecté |

### Matching technicien/créateur:
- Format: "Prénom Nom" (ex: "Jean Dupont")
- Si plusieurs utilisateurs ont le même prénom/nom → le système utilise le nom complet pour différencier
- Si aucun match → l'import échoue pour cette ligne avec un message d'erreur explicite

## 📅 Champs Optionnels - Dates et Durée (4)

| Colonne | Description | Format | Exemple |
|---------|-------------|--------|---------|
| **DATE CREATION** | Date de création | JJ/MM/AAAA | "15/11/2025" |
| **DATE PLANIFIEE** | Date de planification | JJ/MM/AAAA | "25/12/2025" |
| **HEURE PLANIFIEE** | Heure de planification | HH:MM | "14:30" |
| **DUREE ESTIMEE** | Durée estimée en minutes | Nombre | 60, 90, 120 |

**Notes:**
- Si DATE CREATION vide → date du jour
- Si DATE PLANIFIEE + HEURE PLANIFIEE → combine les deux pour créer le timestamp

## 📝 Champs Optionnels - Notes (2)

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **NOTES INTERNES** | Notes visibles par l'équipe uniquement | "Chambre occupée - prévoir clé" |
| **NOTES RESOLUTION** | Notes de résolution après clôture | "Problème résolu, pièce remplacée" |

## 🏷️ Champs Optionnels - Métadonnées (3)

| Colonne | Description | Format | Exemple |
|---------|-------------|--------|---------|
| **DATE LIMITE** | Date limite personnalisée | JJ/MM/AAAA | "30/11/2025" |
| **TAGS** | Tags séparés par virgules | "Tag1,Tag2,Tag3" | "Urgent,Client VIP,Maintenance" |
| **REFERENCE EXTERNE** | Référence externe (PMS, etc.) | Texte libre | "PMS-2025-1234" |

## 📋 Résumé: 21 Colonnes au Total

### Ordre des colonnes:
1. TITRE *
2. DESCRIPTION *
3. STATUT *
4. TYPE
5. CATEGORIE
6. PRIORITE
7. LOCALISATION
8. NUMERO CHAMBRE
9. ETAGE
10. BATIMENT
11. TECHNICIEN (Prenom Nom)
12. CREATEUR (Prenom Nom)
13. DATE CREATION (JJ/MM/AAAA)
14. DATE PLANIFIEE (JJ/MM/AAAA)
15. HEURE PLANIFIEE (HH:MM)
16. DUREE ESTIMEE (minutes)
17. NOTES INTERNES
18. NOTES RESOLUTION
19. DATE LIMITE (JJ/MM/AAAA)
20. TAGS (séparés par virgules)
21. REFERENCE EXTERNE

## 📊 Exemples Inclus dans le Template

Le template contient 3 exemples d'interventions:

### Exemple 1: Urgence en cours
- Fuite eau salle de bain chambre 301
- Statut: `en_cours`
- Priorité: `urgent`
- Technicien assigné: Jean Dupont
- Tags: Urgent,Plomberie

### Exemple 2: Maintenance simple non assignée
- Ampoule grillée couloir 2e étage
- Statut: `nouveau`
- Priorité: `low`
- Non assigné

### Exemple 3: Maintenance terminée
- Contrôle annuel climatisation chambre 205
- Statut: `termine`
- Priorité: `normal`
- Technicien: Pierre Leroy
- Notes de résolution complètes

## 📄 Feuilles du Template

### Feuille 1: "Interventions"
- Ligne 1: En-têtes avec astérisques pour les champs obligatoires
- Ligne 2: Instructions détaillées avec valeurs possibles
- Ligne 3: Ligne vide (séparateur)
- Lignes 4-6: 3 exemples d'interventions

### Feuille 2: "Aide"
- Documentation complète de chaque champ
- Description détaillée
- Exemples d'utilisation
- Valeurs possibles

## 🔄 Différences avec la Version 1.0

### ❌ Supprimé:
- URGENT (case à cocher) → remplacé par priorité "urgent" dans PRIORITE
- BLOQUANT (case à cocher) → supprimé, géré autrement
- TECHNICIEN (Email) → remplacé par Prénom Nom

### ✅ Ajouté:
- STATUT * (obligatoire)
- CREATEUR (Prenom Nom)
- DATE CREATION
- NOTES RESOLUTION
- TAGS
- REFERENCE EXTERNE

### 🔄 Modifié:
- TYPE: obligatoire → optionnel
- CATEGORIE: obligatoire → optionnel
- PRIORITE: obligatoire → optionnel
- LOCALISATION: obligatoire → optionnel
- TECHNICIEN: Email → Prénom Nom

## 💡 Cas d'Usage

### Import de Migration
Importer des interventions historiques depuis un ancien système avec dates de création passées et statuts variés (termine, annule, etc.)

### Import d'Interventions Planifiées
Importer un planning d'interventions de maintenance préventive avec dates futures et techniciens pré-assignés.

### Import d'Urgences
Importer des interventions urgentes en cours depuis un système externe avec statut "en_cours" et priorité "urgent" ou "critical".

### Import avec Traçabilité Complète
Importer des interventions avec créateur, dates, tags et références externes pour une traçabilité complète.

## 🎯 Validation lors de l'Import

### Contrôles effectués:
1. ✅ Champs obligatoires présents (TITRE, DESCRIPTION, STATUT)
2. ✅ Format des dates valide (JJ/MM/AAAA)
3. ✅ Format de l'heure valide (HH:MM)
4. ✅ Valeur STATUT dans la liste autorisée
5. ✅ Valeurs TYPE, CATEGORIE, PRIORITE dans les listes (si renseignées)
6. ✅ ETAGE est un nombre (si renseigné)
7. ✅ DUREE ESTIMEE est un nombre (si renseignée)
8. ✅ TECHNICIEN et CREATEUR existent dans la base (matching par nom complet)

### Erreurs possibles:
- "Champ obligatoire manquant: TITRE"
- "Statut invalide: 'en_cour' (valeurs: nouveau, en_attente, assigne, en_cours...)"
- "Technicien introuvable: 'Jean Dupon'"
- "Créateur introuvable: 'Marie Dubo'"
- "Format de date invalide: '32/13/2025' (attendu: JJ/MM/AAAA)"
- "Plusieurs utilisateurs trouvés pour 'Jean Dupont' - impossible de déterminer lequel"

## 📝 Notes Techniques

### Génération du Template
- Service: `src/shared/services/templateGeneratorService.ts`
- Fonction: `generateInterventionsTemplate()`
- Format: XLSX (Excel)
- Nom du fichier: `gestihotel_template_interventions_YYYY-MM-DD.xlsx`

### Largeurs de Colonnes
Optimisées pour la lisibilité:
- Titres/Descriptions: 40-50 caractères
- Dates: 18 caractères
- Notes: 40 caractères
- Tags: 30 caractères
- Autres: 8-25 caractères selon le contenu

## 🚀 Téléchargement

Le template peut être téléchargé depuis:
- Page Interventions → Bouton "Importer" → "Télécharger le template"
- Fonction: `downloadInterventionsTemplate()`

---

**Version:** 2.0
**Date:** 17/11/2025
**Colonnes:** 21
**Champs obligatoires:** 3 (TITRE, DESCRIPTION, STATUT)
**Compatibilité:** GestiHôtel v2.0+
