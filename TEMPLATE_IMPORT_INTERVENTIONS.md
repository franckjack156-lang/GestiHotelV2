# 📊 Template d'Import des Interventions - Guide Complet

## 🎯 Vue d'ensemble

Ce template Excel permet d'importer en masse des interventions dans GestiHôtel v2.

**Format supporté** : `.xlsx` (Excel 2007+)
**Encodage** : UTF-8
**Limite** : 1000 lignes par import

---

## 📋 Structure du fichier Excel

### En-têtes des colonnes (Ligne 1)

Le fichier doit contenir **une ligne d'en-tête** avec les noms des colonnes. Les noms sont **flexibles** (voir section "Noms de colonnes acceptés" ci-dessous).

### Données (Ligne 2+)

Chaque ligne représente une intervention à importer.

---

## 🔴 Champs OBLIGATOIRES

Ces champs **DOIVENT** être présents et remplis pour chaque intervention :

| Colonne | Type | Description | Exemple | Validation |
|---------|------|-------------|---------|------------|
| **Titre** ⚠️ | Texte | Titre de l'intervention | "Fuite d'eau salle de bain" | Min 3 caractères, Max 100 |
| **Type** ⚠️ | Texte | Type d'intervention | "Plomberie" | Obligatoire |
| **Priorité** ⚠️ | Texte | Niveau de priorité | "normale" | Valeurs : `basse`, `normale`, `haute`, `urgente` |

---

## 🟢 Champs OPTIONNELS

Ces champs peuvent être vides ou omis :

### Informations de base

| Colonne | Type | Description | Exemple | Validation |
|---------|------|-------------|---------|------------|
| **Description** | Texte | Description détaillée | "L'eau fuit du robinet..." | Max 2000 caractères |
| **Catégorie** | Texte | Catégorie d'intervention | "Réparation" | - |

### Localisation

| Colonne | Type | Description | Exemple | Validation |
|---------|------|-------------|---------|------------|
| **Localisation** | Texte | Description du lieu | "Salle de bain principale" | Max 200 caractères |
| **Chambre** | Texte | Numéro de chambre | "101" | Max 20 caractères |
| **Étage** | Texte/Nombre | Numéro d'étage | "1" ou "Rez-de-chaussée" | -5 à 200 |
| **Bâtiment** | Texte | Nom du bâtiment | "Bâtiment A" | Max 50 caractères |

### Flags / Indicateurs

| Colonne | Type | Description | Exemple | Validation |
|---------|------|-------------|---------|------------|
| **Urgent** | Booléen | Intervention urgente ? | "oui", "non", "1", "0", "true", "false" | Par défaut : "non" |
| **Bloquant** | Booléen | Bloque la chambre ? | "oui", "non", "1", "0", "true", "false" | Par défaut : "non" |

### Assignation & Planification (Non supportés à l'import)

> ⚠️ **Note** : Ces champs ne sont **pas encore supportés** à l'import mais seront ajoutés dans une version future :
> - Technicien assigné
> - Date planifiée
> - Durée estimée
> - Notes internes
> - Tags

---

## 📝 Valeurs acceptées par champ

### Priorité (OBLIGATOIRE)

Valeurs acceptées (case insensitive) :

| Valeur Excel | Valeur dans l'application |
|-------------|---------------------------|
| `basse` | Basse |
| `normale` | Normale ⭐ (par défaut) |
| `haute` | Haute |
| `urgente` | Urgente |

### Type (OBLIGATOIRE)

Valeurs dépendent de vos **listes de référence** configurées dans l'application.

Exemples courants :
- Plomberie
- Électricité
- Climatisation
- Menuiserie
- Serrurerie
- Peinture
- Nettoyage
- Maintenance
- Autre

> 💡 **Astuce** : Consultez vos listes de référence dans Paramètres > Listes de référence pour voir les valeurs exactes.

### Catégorie (OPTIONNEL)

Valeurs dépendent de vos **listes de référence** configurées dans l'application.

Exemples courants :
- Réparation
- Maintenance préventive
- Maintenance curative
- Installation
- Urgence
- Demande client

### Urgent (OPTIONNEL)

Valeurs acceptées (case insensitive) :

| Valeur Excel | Résultat |
|--------------|----------|
| `oui`, `yes`, `o`, `y` | ✅ Urgent |
| `1`, `true`, `vrai` | ✅ Urgent |
| `non`, `no`, `n` | ❌ Non urgent |
| `0`, `false`, `faux` | ❌ Non urgent |
| *vide* | ❌ Non urgent (défaut) |

### Bloquant (OPTIONNEL)

Valeurs acceptées (case insensitive) :

| Valeur Excel | Résultat |
|--------------|----------|
| `oui`, `yes`, `o`, `y` | 🚫 Bloquant (chambre bloquée) |
| `1`, `true`, `vrai` | 🚫 Bloquant |
| `non`, `no`, `n` | ✅ Non bloquant |
| `0`, `false`, `faux` | ✅ Non bloquant |
| *vide* | ✅ Non bloquant (défaut) |

---

## 🏷️ Noms de colonnes acceptés

Le système accepte **plusieurs variantes** de noms de colonnes (pratique si vous avez déjà un fichier existant).

### Pour "Titre" (OBLIGATOIRE)

- `Titre`
- `Title`
- `Nom`
- `Name`

### Pour "Description"

- `Description`
- `Desc`

### Pour "Type" (OBLIGATOIRE)

- `Type`

### Pour "Catégorie"

- `Catégorie`
- `Category`

### Pour "Priorité" (OBLIGATOIRE)

- `Priorité`
- `Priority`

### Pour "Localisation"

- `Localisation`
- `Location`
- `Emplacement`

### Pour "Chambre"

- `Chambre`
- `Room`
- `Numéro chambre`
- `Numero Chambre`

### Pour "Étage"

- `Étage`
- `Floor`
- `Niveau`

### Pour "Bâtiment"

- `Bâtiment`
- `Building`

### Pour "Urgent"

- `Urgent`
- `Urgence`

### Pour "Bloquant"

- `Bloquant`
- `Blocking`

> 💡 **Note** : Les noms de colonnes sont **insensibles à la casse** et aux **accents**. `Priorité` = `priorite` = `PRIORITE`

---

## 📄 Template Excel à télécharger

### Version minimale (Champs obligatoires uniquement)

| Titre ⚠️ | Type ⚠️ | Priorité ⚠️ |
|---------|--------|------------|
| Fuite robinet chambre 101 | Plomberie | urgente |
| Ampoule grillée couloir | Électricité | basse |
| Climatisation en panne | Climatisation | haute |

### Version complète (Tous les champs)

| Titre ⚠️ | Description | Type ⚠️ | Catégorie | Priorité ⚠️ | Localisation | Chambre | Étage | Bâtiment | Urgent | Bloquant |
|---------|-------------|--------|-----------|------------|--------------|---------|-------|----------|--------|----------|
| Fuite robinet chambre 101 | L'eau fuit du robinet de la douche depuis hier | Plomberie | Réparation | urgente | Salle de bain | 101 | 1 | A | oui | oui |
| Ampoule grillée couloir | Ampoule du couloir étage 2 ne fonctionne plus | Électricité | Maintenance | basse | Couloir étage 2 | | 2 | A | non | non |
| Climatisation en panne | La clim ne refroidit plus correctement | Climatisation | Réparation | haute | Chambre principale | 205 | 2 | B | non | oui |
| Peinture écaillée | Mur de la chambre présente des écailles | Peinture | Maintenance préventive | normale | Chambre | 310 | 3 | A | non | non |

---

## ✅ Exemples de lignes valides

### Intervention urgente avec tous les détails

```
Titre: Fuite d'eau importante chambre 101
Description: L'eau coule du plafond de la salle de bain. Client évacué temporairement.
Type: Plomberie
Catégorie: Urgence
Priorité: urgente
Localisation: Salle de bain principale
Chambre: 101
Étage: 1
Bâtiment: Bâtiment A
Urgent: oui
Bloquant: oui
```

### Intervention simple (champs minimaux)

```
Titre: Changer ampoule
Type: Électricité
Priorité: basse
```

### Intervention sans chambre (zone commune)

```
Titre: Réparer porte d'entrée
Description: La porte de l'entrée principale ne ferme pas correctement
Type: Menuiserie
Catégorie: Réparation
Priorité: normale
Localisation: Hall d'entrée
Urgent: non
Bloquant: non
```

---

## ❌ Exemples d'erreurs courantes

### ❌ Titre trop court

```
Titre: Eau
Type: Plomberie
Priorité: haute
```

**Erreur** : `Le titre doit contenir au moins 3 caractères`

**Solution** : `Titre: Fuite d'eau`

---

### ❌ Priorité invalide

```
Titre: Réparer climatisation
Type: Climatisation
Priorité: moyenne
```

**Erreur** : `La priorité doit être: basse, normale, haute ou urgente`

**Solution** : `Priorité: normale`

---

### ❌ Type manquant

```
Titre: Intervention chambre 101
Priorité: haute
```

**Erreur** : `Le type est requis`

**Solution** : Ajouter `Type: Plomberie`

---

### ❌ Valeur booléenne invalide

```
Titre: Fuite d'eau
Type: Plomberie
Priorité: urgente
Urgent: peut-être
```

**Erreur** : `La valeur "Urgent" doit être: oui, non, true, false, 1 ou 0`

**Solution** : `Urgent: oui`

---

## 🔄 Processus d'import

### 1. Préparation du fichier

1. Téléchargez le template Excel vierge
2. Remplissez les données (minimum : Titre, Type, Priorité)
3. Vérifiez les valeurs des colonnes Priorité, Urgent, Bloquant
4. Sauvegardez en `.xlsx`

### 2. Import dans l'application

1. Allez dans **Interventions** > **Importer**
2. Cliquez sur **"Choisir un fichier"**
3. Sélectionnez votre fichier Excel
4. Patientez pendant la validation...
5. Consultez le rapport d'import :
   - ✅ **Lignes valides** : Nombre d'interventions qui seront importées
   - ❌ **Lignes invalides** : Erreurs détaillées par ligne
6. Si des erreurs : Téléchargez le rapport, corrigez le fichier, réessayez
7. Si tout est OK : Cliquez sur **"Confirmer l'import"**

### 3. Après l'import

- Les interventions sont créées avec le statut **"En attente"** (`pending`)
- Le créateur est l'utilisateur connecté
- L'établissement est celui actuellement sélectionné
- Les interventions apparaissent dans la liste
- Vous pouvez ensuite les assigner, planifier, etc.

---

## 📊 Rapport d'erreurs

Si votre import contient des erreurs, vous recevrez un rapport détaillé :

```
RAPPORT D'ERREURS D'IMPORT
==================================================

Ligne 3:
  - Champ "titre": Le titre doit contenir au moins 3 caractères
    Valeur reçue: "AB"

Ligne 5:
  - Champ "priorite": La priorité doit être: basse, normale, haute ou urgente
    Valeur reçue: "moyenne"

Ligne 8:
  - Champ "type": Le type est requis
    Valeur reçue: ""
```

**Actions** :
1. Téléchargez le rapport en cliquant sur "Télécharger le rapport"
2. Ouvrez votre fichier Excel
3. Corrigez les lignes indiquées
4. Relancez l'import

---

## 💡 Conseils et bonnes pratiques

### ✅ DO - À faire

1. **Testez avec un petit fichier** (5-10 lignes) avant d'importer en masse
2. **Utilisez des valeurs cohérentes** pour Type et Catégorie (référez-vous à vos listes)
3. **Remplissez la Description** pour faciliter le travail des techniciens
4. **Indiquez le numéro de chambre** quand c'est pertinent
5. **Marquez "Urgent" et "Bloquant"** uniquement si nécessaire
6. **Encodez en UTF-8** pour éviter les problèmes d'accents
7. **Vérifiez les doublons** avant d'importer

### ❌ DON'T - À éviter

1. ❌ Ne dépassez pas **1000 lignes** par import
2. ❌ N'utilisez pas de **formules Excel** dans les cellules
3. ❌ Ne laissez pas de **lignes vides** au milieu du fichier
4. ❌ N'importez pas de **données sensibles** dans Description
5. ❌ Ne mélangez pas **différents formats de date** (non supportés pour l'instant)
6. ❌ N'utilisez pas de **caractères spéciaux** dans les noms de colonnes

---

## 🚀 Champs à venir (Prochaines versions)

Ces champs seront supportés dans les futures mises à jour :

### Assignation & Planification

| Champ | Type | Description |
|-------|------|-------------|
| **Technicien** | Texte | Email ou nom du technicien à assigner |
| **Date planifiée** | Date | Date/heure de planification (format ISO 8601) |
| **Durée estimée** | Nombre | Durée estimée en minutes |

### Notes & Détails

| Champ | Type | Description |
|-------|------|-------------|
| **Notes internes** | Texte | Notes internes (non visibles client) |
| **Référence externe** | Texte | Référence PMS ou autre système |

### Tags & Classification

| Champ | Type | Description |
|-------|------|-------------|
| **Tags** | Texte | Tags séparés par des virgules |

### Workflow

| Champ | Type | Description |
|-------|------|-------------|
| **Statut** | Texte | Statut initial (pending, assigned, etc.) |
| **Validation requise** | Booléen | Nécessite une validation admin |

---

## 🔧 Support technique

### En cas de problème

1. **Vérifiez le format** : Le fichier doit être `.xlsx`
2. **Vérifiez les en-têtes** : Ligne 1 doit contenir les noms de colonnes
3. **Vérifiez les champs obligatoires** : Titre, Type, Priorité
4. **Consultez le rapport d'erreurs** détaillé

### Questions fréquentes

**Q : Combien d'interventions puis-je importer en une fois ?**
R : Maximum 1000 lignes par import. Pour plus, divisez en plusieurs fichiers.

**Q : Puis-je importer des interventions déjà assignées ?**
R : Pas encore, cette fonctionnalité arrive bientôt. Pour l'instant, assignez après import.

**Q : Les accents sont-ils supportés ?**
R : Oui, assurez-vous que votre fichier est encodé en UTF-8.

**Q : Puis-je modifier les interventions après import ?**
R : Oui, toutes les interventions importées peuvent être éditées normalement.

**Q : L'import supprime-t-il les interventions existantes ?**
R : Non, l'import **ajoute** de nouvelles interventions sans toucher aux existantes.

---

## 📥 Téléchargement du template

### Template vierge (Excel)

Vous pouvez créer votre propre fichier Excel avec cette structure :

**Ligne 1 (En-têtes)** :
```
Titre | Description | Type | Catégorie | Priorité | Localisation | Chambre | Étage | Bâtiment | Urgent | Bloquant
```

**Ligne 2+ (Données)** :
```
[Vos données ici]
```

### Template pré-rempli (Exemples)

Fichier Excel avec 5 exemples d'interventions à adapter :
- Fuite d'eau urgente
- Maintenance électrique
- Climatisation en panne
- Peinture écaillée
- Serrure bloquée

> 💾 **Note** : Les templates Excel sont disponibles dans l'interface d'import de l'application (bouton "Télécharger le template").

---

## 🎯 Résumé

### Champs OBLIGATOIRES (3)

1. ⚠️ **Titre** (min 3 caractères)
2. ⚠️ **Type** (selon vos listes de référence)
3. ⚠️ **Priorité** (`basse`, `normale`, `haute`, `urgente`)

### Champs RECOMMANDÉS (3)

1. 💡 **Description** (pour contexte)
2. 💡 **Localisation** (pour localiser)
3. 💡 **Chambre** (si applicable)

### Champs OPTIONNELS (5)

1. Catégorie
2. Étage
3. Bâtiment
4. Urgent
5. Bloquant

### Format du fichier

- ✅ Extension : `.xlsx`
- ✅ Encodage : UTF-8
- ✅ Ligne 1 : En-têtes
- ✅ Ligne 2+ : Données
- ✅ Max 1000 lignes

---

**Dernière mise à jour** : 2025-01-16
**Version du template** : 1.0
**Compatibilité** : GestiHôtel v2
