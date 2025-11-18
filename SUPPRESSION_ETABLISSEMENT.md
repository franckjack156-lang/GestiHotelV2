# Système de Suppression Sécurisée d'Établissements

## Vue d'ensemble

Le système de suppression d'établissements a été conçu avec un **maximum de protections** pour éviter les suppressions accidentelles et garantir l'intégrité des données.

## Fonctionnalités

### 1. Vérifications Automatiques

Avant toute suppression, le système vérifie :

- ✅ **Nombre d'interventions** liées à l'établissement
- ✅ **Nombre d'utilisateurs** ayant accès à l'établissement
- ✅ **Documents associés** (listes de référence, config, etc.)
- ✅ **Dépendances critiques** (utilisateurs sans autre établissement)
- ✅ **Statut d'activité** (dernier établissement actif)

### 2. Protections Multiples

#### Blockers (Empêchent la suppression)

1. **Dernier établissement actif**
   - Au moins un établissement doit rester actif dans le système

2. **Utilisateurs orphelins**
   - Si des utilisateurs n'ont accès qu'à cet établissement, ils perdraient tout accès
   - La suppression est bloquée jusqu'à ce qu'ils aient accès à un autre établissement

#### Avertissements (Informent mais n'empêchent pas)

1. **Interventions existantes**
   - Le nombre d'interventions qui seront supprimées
   - Option pour supprimer ou non les interventions

2. **Utilisateurs affectés**
   - Le nombre d'utilisateurs qui perdront l'accès à cet établissement
   - (Mais qui ont accès à d'autres établissements)

3. **Données associées**
   - Listes de référence, configuration, statistiques, etc.

### 3. Processus de Confirmation

Le système exige **plusieurs confirmations** avant toute suppression :

#### Étape 1 : Vérification
- Analyse automatique des dépendances
- Affichage des statistiques

#### Étape 2 : Confirmation
1. **Saisie du nom**
   - L'utilisateur doit taper exactement le nom de l'établissement
   - Validation en temps réel (✅ nom confirmé)

2. **Checkbox de compréhension**
   - "Je comprends que cette action est irréversible"
   - Doit être cochée pour continuer

3. **Option de suppression des données liées**
   - Checkbox pour supprimer également les interventions
   - Clause explicite "Cette action est irréversible"

4. **Bouton désactivé**
   - Le bouton "Supprimer définitivement" reste désactivé tant que :
     * Le nom n'est pas correctement saisi
     * La checkbox de compréhension n'est pas cochée

#### Étape 3 : Traitement
- Animation de progression
- Suppression transactionnelle (batch Firestore)

#### Étape 4 : Résultat
- **Succès** : Affichage des collections supprimées
- **Erreur** : Affichage des erreurs et blockers

### 4. Traçabilité

Chaque suppression est **loggée** dans la collection `audit-logs` avec :
- ID et nom de l'établissement
- ID de l'utilisateur
- Timestamp
- Statistiques (interventions, utilisateurs, documents)
- Warnings

## Utilisation

### Interface Utilisateur

1. **Accès** : Page "Établissements" → Bouton "Poubelle" (icône rouge)

2. **Vérification** : Le système vérifie automatiquement les dépendances

3. **Confirmation** :
   - Lire attentivement les avertissements
   - Cocher "Supprimer également les interventions" si souhaité
   - Taper le nom exact de l'établissement
   - Cocher "Je comprends que c'est irréversible"
   - Cliquer sur "Supprimer définitivement"

4. **Résultat** : Message de confirmation ou d'erreur

### API Programmatique

```typescript
import {
  checkEstablishmentDeletion,
  deleteEstablishmentPermanently,
} from '@/features/establishments/services/establishmentDeletionService';

// 1. Vérifier si la suppression est possible
const check = await checkEstablishmentDeletion('establishment-id');

if (check.canDelete) {
  console.log('Warnings:', check.warnings);
  console.log('Stats:', check.stats);

  // 2. Supprimer
  const result = await deleteEstablishmentPermanently('establishment-id', {
    confirmationName: 'Nom exact de l\'établissement',
    deleteRelatedData: true, // Supprimer aussi les interventions
    userId: 'current-user-id',
  });

  if (result.success) {
    console.log('Supprimé:', result.deletedCollections);
  } else {
    console.error('Erreurs:', result.errors);
  }
} else {
  console.error('Blockers:', check.blockers);
}
```

## Architecture

### Fichiers

```
src/features/establishments/
├── services/
│   └── establishmentDeletionService.ts    # Service de suppression
├── components/
│   └── DeleteEstablishmentDialog.tsx      # Dialog UI
└── ...

src/pages/establishments/
└── EstablishmentsPages.tsx                # Intégration
```

### Types

```typescript
interface DeletionCheck {
  canDelete: boolean;
  warnings: string[];
  blockers: string[];
  stats: {
    interventionsCount: number;
    usersCount: number;
    documentsCount: number;
  };
}

interface DeletionOptions {
  deleteRelatedData?: boolean;  // Supprimer les interventions
  confirmationName: string;      // Nom de confirmation (requis)
  userId: string;                // ID utilisateur (pour logs)
}

interface DeletionResult {
  success: boolean;
  deletedEstablishmentId: string;
  deletedCollections: string[];
  errors: string[];
}
```

## Collections Supprimées

Lors de la suppression d'un établissement, les collections suivantes sont supprimées :

1. **Document principal** : `/establishments/{id}`
2. **Sous-collections** :
   - `/establishments/{id}/config/*`
   - `/establishments/{id}/settings/*`
   - `/establishments/{id}/stats/*`
   - `/establishments/{id}/audit/*`
   - `/establishments/{id}/config/reference-lists`
3. **Interventions** (si `deleteRelatedData = true`) : `/interventions` (où `establishmentId = {id}`)
4. **Mise à jour des utilisateurs** : Retrait de l'ID de l'établissement de `establishmentIds`

## Sécurité

- ✅ Validation stricte du nom de confirmation
- ✅ Détection des dépendances critiques
- ✅ Suppression transactionnelle (rollback en cas d'erreur)
- ✅ Logging pour audit
- ✅ Confirmations multiples
- ✅ Avertissements clairs
- ✅ Interface explicite sur l'irréversibilité

## Limitations

1. **Action irréversible** : Aucun système de récupération n'est prévu
2. **Dernier établissement** : Impossible de supprimer le dernier établissement actif
3. **Utilisateurs orphelins** : Impossible de supprimer si des utilisateurs n'auraient plus accès

## Recommandations

1. **Avant suppression** :
   - Vérifier qu'un autre établissement existe
   - S'assurer que tous les utilisateurs ont accès à un autre établissement
   - Exporter les données importantes si nécessaire

2. **Alternative** :
   - Utiliser la **désactivation** (`isActive = false`) au lieu de la suppression définitive
   - La fonction `deleteEstablishment()` du service fait un soft delete

3. **Backup** :
   - Envisager un export des données avant suppression
   - Les logs d'audit conservent une trace de la suppression

## Support

En cas de problème ou question :
- Consulter les logs dans la console navigateur
- Vérifier la collection `audit-logs` dans Firestore
- Contacter l'équipe de développement

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0.0
