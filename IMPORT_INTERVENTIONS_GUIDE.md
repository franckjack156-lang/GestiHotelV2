# 📥 Guide d'Import des Interventions

## 🎯 Vue d'ensemble

GestiHôtel v2 propose **deux templates Excel** pour importer vos interventions en masse :

1. **Template vierge** : Fichier vide prêt à remplir
2. **Template avec exemples** : Fichier pré-rempli avec 5 interventions exemple + feuille d'instructions

---

## 📊 Templates Disponibles

### 1. Template Vierge

**Nom du fichier** : `template-interventions-vierge.xlsx`

**Contenu** :
- ✅ Une feuille "Interventions" avec les en-têtes
- ✅ Une ligne vide prête à être remplie
- ✅ Tous les champs disponibles (13 colonnes)

**Idéal pour** :
- Commencer de zéro
- Import propre sans données exemple
- Intégration avec d'autres systèmes

---

### 2. Template avec Exemples

**Nom du fichier** : `template-interventions-exemples.xlsx`

**Contenu** :
- ✅ **Feuille 1 "Interventions"** : 5 interventions exemple
  - Fuite d'eau urgente
  - Ampoule grillée (maintenance)
  - Climatisation en panne
  - Peinture écaillée
  - Serrure bloquée
- ✅ **Feuille 2 "Instructions"** : Guide complet
  - Champs obligatoires
  - Champs optionnels
  - Valeurs acceptées pour chaque champ
  - Variantes de noms de colonnes
  - Conseils et bonnes pratiques

**Idéal pour** :
- Découvrir le format attendu
- Comprendre les valeurs possibles
- Formation des utilisateurs
- Tests rapides

---

## 🚀 Comment télécharger les templates

### Dans l'application

1. Allez dans **Interventions** > **Importer**
2. La boîte de dialogue d'import s'ouvre
3. Cliquez sur l'un des deux boutons :
   - **"Template vierge"** → Télécharge le template vide
   - **"Template avec exemples"** → Télécharge le template pré-rempli

### Programmatiquement

```typescript
import {
  downloadBlankTemplate,
  downloadExampleTemplate,
} from '@/shared/utils/generateInterventionTemplate';

// Télécharger le template vierge
downloadBlankTemplate();

// Télécharger le template avec exemples
downloadExampleTemplate();
```

---

## 📋 Structure des Colonnes

| # | Colonne | Obligatoire | Type | Exemple |
|---|---------|-------------|------|---------|
| 1 | **Titre** ⚠️ | ✅ Oui | Texte (3-100) | "Fuite robinet chambre 101" |
| 2 | Description | Non | Texte (0-2000) | "L'eau fuit du robinet..." |
| 3 | **Type** ⚠️ | ✅ Oui | Texte | "Plomberie" |
| 4 | Catégorie | Non | Texte | "Réparation" |
| 5 | **Priorité** ⚠️ | ✅ Oui | Enum | "urgente" |
| 6 | Localisation | Non | Texte (0-200) | "Salle de bain" |
| 7 | Chambre | Non | Texte (0-20) | "101" |
| 8 | Étage | Non | Texte/Nombre | "1" |
| 9 | Bâtiment | Non | Texte (0-50) | "A" |
| 10 | Urgent | Non | Booléen | "oui" |
| 11 | Bloquant | Non | Booléen | "non" |
| 12 | Notes Internes | Non | Texte (0-1000) | "Client évacué" |
| 13 | Référence Externe | Non | Texte (0-50) | "PMS-12345" |

---

## 📝 Exemples Inclus dans le Template

### Exemple 1 : Fuite d'eau urgente

```excel
Titre: Fuite robinet chambre 101
Description: L'eau fuit du robinet de la douche depuis hier
Type: Plomberie
Catégorie: Réparation
Priorité: urgente
Localisation: Salle de bain
Chambre: 101
Étage: 1
Bâtiment: A
Urgent: oui
Bloquant: oui
Notes Internes: Client évacué temporairement
Référence Externe: PMS-12345
```

**💡 Montre** : Intervention urgente avec tous les champs remplis

---

### Exemple 2 : Ampoule grillée

```excel
Titre: Ampoule grillée couloir
Description: Ampoule du couloir étage 2 ne fonctionne plus
Type: Électricité
Catégorie: Maintenance
Priorité: basse
Localisation: Couloir étage 2
Chambre: [vide]
Étage: 2
Bâtiment: A
Urgent: non
Bloquant: non
Notes Internes: [vide]
Référence Externe: [vide]
```

**💡 Montre** : Intervention simple sans chambre (zone commune)

---

### Exemple 3 : Climatisation en panne

```excel
Titre: Climatisation en panne
Description: La climatisation ne refroidit plus correctement
Type: Climatisation
Catégorie: Réparation
Priorité: haute
Localisation: Chambre principale
Chambre: 205
Étage: 2
Bâtiment: B
Urgent: no
Bloquant: yes
Notes Internes: [vide]
Référence Externe: TICKET-456
```

**💡 Montre** : Utilisation de valeurs anglaises pour Urgent/Bloquant

---

### Exemple 4 : Peinture écaillée

```excel
Titre: Peinture écaillée
Description: Mur de la chambre présente des écailles de peinture
Type: Peinture
Catégorie: Maintenance préventive
Priorité: normale
Localisation: Chambre
Chambre: 310
Étage: 3
Bâtiment: A
Urgent: non
Bloquant: non
Notes Internes: [vide]
Référence Externe: [vide]
```

**💡 Montre** : Maintenance préventive non urgente

---

### Exemple 5 : Serrure bloquée

```excel
Titre: Serrure bloquée
Description: La serrure de la porte est bloquée, impossible de fermer à clé
Type: Serrurerie
Catégorie: Réparation
Priorité: haute
Localisation: Porte d'entrée
Chambre: 412
Étage: 4
Bâtiment: B
Urgent: 1
Bloquant: 0
Notes Internes: Client signale le problème depuis 2 jours
Référence Externe: [vide]
```

**💡 Montre** : Utilisation de valeurs numériques (1/0) pour Urgent/Bloquant

---

## 📚 Feuille "Instructions" (Template avec exemples)

La feuille "Instructions" contient :

### Section 1 : Champs Obligatoires
- Liste des 3 champs requis
- Format attendu
- Exemples de valeurs

### Section 2 : Champs Optionnels
- Tous les champs facultatifs
- Limites de caractères
- Valeurs par défaut

### Section 3 : Valeurs Priorité
- basse
- normale (par défaut)
- haute
- urgente

### Section 4 : Valeurs Urgent/Bloquant
- Pour "OUI" : oui, yes, 1, true, y, o
- Pour "NON" : non, no, 0, false, n
- Par défaut : vide = NON

### Section 5 : Conseils
- Tester avec 5-10 lignes d'abord
- Vérifier les listes de référence
- Encodage UTF-8
- Maximum 1000 lignes
- Pas de lignes vides

### Section 6 : Noms de Colonnes Acceptés
- Variantes pour chaque colonne
- Exemples : Titre = Title = Nom = Name

---

## 🎨 Mise en Forme Excel

Les templates générés incluent :

### Largeurs de colonnes optimisées

```
Titre           : 30 caractères
Description     : 40 caractères
Type            : 15 caractères
Catégorie       : 20 caractères
Priorité        : 12 caractères
Localisation    : 25 caractères
Chambre         : 10 caractères
Étage           : 8 caractères
Bâtiment        : 12 caractères
Urgent          : 10 caractères
Bloquant        : 10 caractères
Notes Internes  : 30 caractères
Référence       : 20 caractères
```

### Symboles visuels

- ⚠️ sur les colonnes obligatoires (Titre, Type, Priorité)
- Facilite l'identification rapide

---

## 💻 Utilisation Programmatique

### Générer un template vierge

```typescript
import { generateBlankTemplate } from '@/shared/utils/generateInterventionTemplate';

// Générer le buffer Excel
const buffer = generateBlankTemplate();

// Créer un Blob
const blob = new Blob([buffer], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

// Télécharger
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'template-interventions-vierge.xlsx';
a.click();
```

### Générer un template avec exemples

```typescript
import { generateExampleTemplate } from '@/shared/utils/generateInterventionTemplate';

const buffer = generateExampleTemplate();
// ... même processus que ci-dessus
```

---

## 🔄 Workflow d'Import Complet

### 1. Télécharger le template

```
Interventions > Importer > "Template avec exemples"
```

### 2. Remplir le fichier Excel

- Supprimer les lignes exemple (ou les adapter)
- Ajouter vos interventions
- Vérifier les champs obligatoires (⚠️)
- Consulter la feuille "Instructions" si besoin

### 3. Importer dans l'application

```
Interventions > Importer > Choisir le fichier > Analyser
```

### 4. Vérifier le rapport

- ✅ **X lignes valides** : Seront importées
- ❌ **X erreurs** : À corriger

### 5. Corriger les erreurs (si nécessaire)

- Télécharger le rapport d'erreurs
- Ouvrir le fichier Excel
- Corriger les lignes indiquées
- Réimporter

### 6. Confirmer l'import

```
Importer X éléments
```

---

## ✅ Validation Automatique

Le système valide automatiquement :

### Champs obligatoires
- ✅ Titre présent et 3-100 caractères
- ✅ Type présent
- ✅ Priorité = basse/normale/haute/urgente

### Limites de caractères
- ✅ Description ≤ 2000
- ✅ Localisation ≤ 200
- ✅ Chambre ≤ 20
- ✅ Bâtiment ≤ 50
- ✅ Notes Internes ≤ 1000
- ✅ Référence Externe ≤ 50

### Valeurs énumérées
- ✅ Priorité dans la liste acceptée
- ✅ Urgent/Bloquant dans les formats acceptés

### Conversions automatiques
- ✅ Étage : "1" → 1 (number)
- ✅ Urgent : "oui" → true
- ✅ Bloquant : "no" → false

---

## 🆘 Résolution de Problèmes

### Problème : "Type de fichier invalide"

**Solution** : Le fichier doit être `.xlsx`. Vérifiez l'extension.

---

### Problème : "Ligne X: Le titre doit contenir au moins 3 caractères"

**Solution** : Le titre est trop court. Minimum 3 caractères.

---

### Problème : "Ligne X: La priorité doit être: basse, normale, haute ou urgente"

**Solution** : Valeur de priorité invalide. Utilisez exactement : `basse`, `normale`, `haute` ou `urgente` (en minuscules).

---

### Problème : "Ligne X: Le type est requis"

**Solution** : La colonne Type est vide. C'est un champ obligatoire.

---

### Problème : Accents mal affichés

**Solution** : Sauvegardez le fichier Excel en UTF-8.

---

### Problème : Import de 0 ligne alors que le fichier est rempli

**Solution** : Vérifiez que :
1. La ligne 1 contient bien les en-têtes
2. Les données commencent ligne 2
3. Pas de lignes vides au début

---

## 📊 Statistiques d'Import

Après l'analyse, vous verrez :

```
┌─────────────────────┐
│ Lignes totales : 10 │
├─────────────────────┤
│ Valides     : 8  ✅ │
│ Erreurs     : 2  ❌ │
└─────────────────────┘
```

**Vous pouvez** :
- ✅ Importer les 8 lignes valides immédiatement
- 📥 Télécharger le rapport d'erreurs pour corriger les 2 autres
- ❌ Annuler et corriger d'abord

---

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

1. **Testez avec un petit fichier** (5-10 lignes) avant l'import massif
2. **Utilisez le template avec exemples** pour comprendre le format
3. **Consultez la feuille "Instructions"** en cas de doute
4. **Vérifiez vos listes de référence** pour Type et Catégorie
5. **Remplissez la Description** pour aider les techniciens
6. **Encodez en UTF-8** pour les caractères spéciaux
7. **Sauvegardez régulièrement** votre fichier Excel

### ❌ À ÉVITER

1. ❌ Ne dépassez pas 1000 lignes par import
2. ❌ N'utilisez pas de formules Excel
3. ❌ Ne laissez pas de lignes vides au milieu
4. ❌ N'utilisez pas de caractères spéciaux dans les en-têtes
5. ❌ Ne mélangez pas les formats de priorité (utilisez toujours "basse", pas "Basse" ou "BASSE")

---

## 🔮 Évolutions Futures

### Champs à venir

Dans les prochaines versions, vous pourrez également importer :

- **Technicien assigné** : Email ou ID du technicien
- **Date planifiée** : Date/heure de planification
- **Durée estimée** : En minutes
- **Tags** : Séparés par des virgules
- **Statut initial** : pending, assigned, etc.

Ces champs seront automatiquement ajoutés aux templates.

---

## 📞 Support

### Ressources

- 📄 [TEMPLATE_IMPORT_INTERVENTIONS.md](TEMPLATE_IMPORT_INTERVENTIONS.md) - Documentation complète
- 💻 Templates Excel - Téléchargeables dans l'application
- 🐛 Issues GitHub - Pour signaler un problème

### Contact

Pour toute question sur l'import :
1. Consultez d'abord la documentation
2. Téléchargez le template avec exemples
3. Testez avec les données exemple
4. Ouvrez une issue GitHub si le problème persiste

---

**Version** : 1.0
**Dernière mise à jour** : 2025-01-16
**Compatibilité** : GestiHôtel v2
