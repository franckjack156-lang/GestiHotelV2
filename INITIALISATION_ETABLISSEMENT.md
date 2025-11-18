# 🚀 Automatisation de l'initialisation d'établissement

## Vue d'ensemble

Lors de la création d'un nouvel établissement, le système **initialise automatiquement** toutes les données essentielles pour une utilisation immédiate.

## ✅ Ce qui est automatisé

### 1. **Listes de référence pré-remplies**

#### Listes STABLES (ne peuvent pas être modifiées) :
- ✅ **Statuts d'intervention** (5 valeurs)
  - À faire (gris)
  - En cours (bleu)
  - En attente (orange)
  - Terminé (vert)
  - Annulé (rouge)

- ✅ **Priorités** (4 valeurs)
  - Basse (vert)
  - Normale (bleu)
  - Haute (orange)
  - Urgente (rouge)

#### Listes PERSONNALISABLES (peuvent être enrichies) :
- ✅ **Catégories d'intervention** (5 valeurs de base)
  - Maintenance, Réparation, Nettoyage, Inspection, Urgence

- ✅ **Types d'intervention** (9 valeurs de base)
  - Plomberie, Électricité, Climatisation, Chauffage
  - Menuiserie, Serrurerie, Peinture, Nettoyage, Informatique

- ✅ **Statuts de chambre** (5 valeurs de base)
  - Disponible, Occupé, En nettoyage, En maintenance, Bloqué

#### Listes VIDES (à remplir selon les besoins) :
- 📭 **Localisations** - À remplir avec vos zones spécifiques
- 📭 **Étages** - Générés automatiquement via la fonction existante
- 📭 **Bâtiments** - Si vous avez plusieurs bâtiments/ailes
- 📭 **Assignés** - Liste des techniciens/équipes
- 📭 **Catégories de pièces** - Pour l'inventaire

### 2. **Configuration email intelligente** 🧠

Le système détecte automatiquement les emails :
- **Priorité 1** : Email du contact de l'établissement (`contact.email`)
- **Priorité 2** : Email de l'utilisateur créateur
- **Application** : Configuré pour `notificationEmail` et `orderEmail`

**Exemple** :
```
Contact email: hotel@example.com
→ notificationEmail = hotel@example.com
→ orderEmail = hotel@example.com
```

### 3. **Paramètres régionaux auto-détectés** 🌍

Selon le **pays de l'adresse**, le système configure automatiquement :

| Pays | Timezone | Langue | Devise | Format date | Format heure |
|------|----------|--------|--------|-------------|--------------|
| 🇫🇷 France | Europe/Paris | fr | EUR | dd/MM/yyyy | 24h |
| 🇧🇪 Belgique | Europe/Paris | fr | EUR | dd/MM/yyyy | 24h |
| 🇨🇭 Suisse | Europe/Paris | fr | EUR | dd/MM/yyyy | 24h |
| 🇱🇺 Luxembourg | Europe/Paris | fr | EUR | dd/MM/yyyy | 24h |
| 🇬🇧 UK | Europe/London | en | GBP | dd/MM/yyyy | 24h |
| 🇺🇸 USA | America/New_York | en | USD | MM/dd/yyyy | 12h |
| 🏳️ Autre | Europe/Paris | fr | EUR | dd/MM/yyyy | 24h |

### 4. **Planning par défaut** 📅

Configuration automatique des heures d'ouverture :

| Jour | Horaires | Statut |
|------|----------|--------|
| Lundi - Vendredi | 08:00 - 18:00 | ✅ Ouvert |
| Samedi | 09:00 - 17:00 | ✅ Ouvert |
| Dimanche | Fermé | ❌ Fermé |

### 5. **Utilisateur propriétaire** 👤

L'utilisateur qui crée l'établissement est automatiquement :
- ✅ Ajouté à la liste `managerIds` de l'établissement
- ✅ L'établissement est ajouté à ses `establishmentIds`
- ✅ Accès immédiat sans configuration supplémentaire

### 6. **Autres paramètres** ⚙️

- **Préfixe interventions** : `INT`
- **Numéro de départ** : `1`
- **Timestamps** : `createdAt`, `updatedAt` automatiques

## 📝 Exemple concret

Lors de la création d'un établissement :

```typescript
{
  name: "Hôtel du Parc",
  type: "hotel",
  address: {
    street: "123 rue de Paris",
    city: "Lyon",
    country: "France"
  },
  contact: {
    email: "contact@hotelduparc.fr",
    phone: "0123456789"
  },
  totalRooms: 50,
  totalFloors: 5
}
```

**Le système crée automatiquement** :
1. ✅ 10 listes de référence (5 pré-remplies + 5 vides)
2. ✅ 28 items pré-configurés dans les listes stables
3. ✅ Configuration France (Europe/Paris, EUR, fr, 24h)
4. ✅ Emails → `notificationEmail` et `orderEmail` = `contact@hotelduparc.fr`
5. ✅ Planning 8h-18h du lundi au vendredi
6. ✅ Utilisateur ajouté automatiquement à l'établissement

## 🔧 Personnalisation après création

Vous pouvez ensuite :
- ➕ Ajouter des valeurs aux listes personnalisables
- 📝 Modifier les heures d'ouverture
- 🏢 Générer les étages automatiquement
- 👥 Ajouter d'autres utilisateurs
- 📧 Changer les emails de notification

## 🛡️ Sécurité et robustesse

- ❌ **Non-bloquant** : Si l'initialisation échoue, l'établissement est quand même créé
- 📋 **Logs détaillés** : Toutes les actions sont loggées dans la console
- ✅ **Atomic** : Les listes sont créées en une seule transaction
- 🔄 **Résilient** : Chaque étape gère ses propres erreurs

## 📊 Logs de débogage

Lors de la création, vous verrez dans la console :

```
🚀 Initialisation automatique de l'établissement...
🚀 Initialisation établissement: abc123...
✅ 10 listes créées
✅ Paramètres appliqués: {timezone: "Europe/Paris", ...}
✅ Propriétaire ajouté à l'établissement
✅ Établissement initialisé avec succès: {
  listsCreated: 10,
  settingsApplied: 8
}
```

## 🎯 Avantages

- ⚡ **Gain de temps** : Plus besoin de configurer manuellement
- 🎨 **Cohérence** : Tous les établissements ont la même structure
- 🌍 **Intelligent** : S'adapte automatiquement au pays
- 🚀 **Prêt à l'emploi** : L'établissement est utilisable immédiatement
- 📈 **Évolutif** : Facile d'ajouter de nouvelles automatisations

## 🔮 Futures améliorations possibles

- 🏨 Création automatique des chambres (optionnelle)
- 📝 Templates d'intervention selon le type d'établissement
- 🏪 Fournisseurs par défaut (quincaillerie, électricien, etc.)
- 📅 Configuration planning avancée (jours fériés, périodes spéciales)
- 🌐 Détection de langue via l'IP ou le navigateur
