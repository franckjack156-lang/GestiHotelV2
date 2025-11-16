# Système de Gestion des Fonctionnalités

## 📋 Vue d'ensemble

Le système de gestion des fonctionnalités permet d'activer ou de désactiver des modules spécifiques pour chaque établissement. Cela offre une flexibilité maximale pour adapter l'application aux besoins de chaque client.

## 🎯 Fonctionnalités disponibles

### ⚡ Essentielles (Indispensables)

Ces fonctionnalités sont toujours activées et ne peuvent pas être désactivées :

- **Gestion des interventions** - CRUD des interventions de maintenance
- **Création rapide** - Formulaire simplifié de création d'intervention
- **Historique** - Traçabilité complète des modifications

### 🔧 Interventions

- **Création guidée** - Wizard étape par étape
- **Modèles d'intervention** - Templates pré-remplis (🔜 Bientôt)
- **Import/Export** - Import et export Excel, CSV
- **Récurrence** - Interventions récurrentes automatiques (🔜 Bientôt)
- **Planning** - Vue calendrier et planification

### 💬 Communication

- **Commentaires** - Discussions sur les interventions
- **Notifications email** - Alertes par email
- **Notifications push** - Notifications mobiles (🔜 Bientôt)
- **Chat interne** - Messagerie instantanée (🔜 Bientôt)

### 📸 Médias

- **Photos** - Photos avant/pendant/après intervention
- **Documents** - Pièces jointes PDF, Word, etc. (🔜 Bientôt)
- **Signatures électroniques** - Signature numérique (💎 Premium)

### 📦 Pièces et stocks

- **Gestion des pièces** - Liste des pièces par intervention
- **Commande par email** - Envoi automatique de commandes (✨ Nouveau)
- **Gestion des stocks** - Suivi des stocks (🔜 Bientôt)
- **Fournisseurs** - Base de données des fournisseurs (🔜 Bientôt)

### ⏱️ Temps et facturation

- **Chronomètre** - Suivi du temps en temps réel
- **Saisie manuelle** - Ajout manuel de sessions
- **Facturation** - Génération de factures (💎 Premium)
- **Rapports financiers** - Analyses de rentabilité (💎 Premium)

### 📊 Analytique

- **Tableau de bord** - Vue d'ensemble et statistiques
- **Rapports personnalisés** - Création de rapports sur mesure (💎 Premium)
- **Statistiques avancées** - Analyses approfondies (💎 Premium)
- **Export de données** - Export Excel, PDF, CSV

### 🏨 Chambres

- **Gestion des chambres** - Base de données des chambres
- **QR Codes chambres** - Génération et scan de QR codes (🔜 Bientôt)

### 🔌 Intégrations

- **Accès API** - API REST pour intégrations externes (💎 Premium)
- **Webhooks** - Notifications automatiques (💎 Premium)
- **Intégrations tierces** - Connexion avec PMS (🔜 Bientôt)

## 🛠️ Utilisation

### Accéder à la gestion des fonctionnalités

1. Connectez-vous en tant que **Super Admin**
2. Allez dans **Paramètres** > **Fonctionnalités** ou accédez directement à `/settings/features`

### Activer/Désactiver une fonctionnalité

1. Trouvez la fonctionnalité souhaitée dans la liste
2. Utilisez le switch pour l'activer ou la désactiver
3. Cliquez sur **Enregistrer** pour sauvegarder les modifications

### Dépendances

Certaines fonctionnalités dépendent d'autres. Par exemple :

- **Commande par email** nécessite **Gestion des pièces**
- **Facturation** nécessite **Chronomètre**
- **Rapports financiers** nécessite **Facturation**

Le système empêche automatiquement :
- La désactivation d'une fonctionnalité si d'autres en dépendent
- L'activation d'une fonctionnalité si ses dépendances ne sont pas activées

## 💻 Utilisation dans le code

### Hook `useFeature`

```typescript
import { useFeature } from '@/features/establishments/hooks/useFeature';

// Vérifier une fonctionnalité spécifique
const MyComponent = () => {
  const isPhotosEnabled = useFeature('photos');

  if (!isPhotosEnabled) {
    return <div>Les photos ne sont pas disponibles</div>;
  }

  return <PhotoUploader />;
};

// Utiliser les fonctions utilitaires
const AnotherComponent = () => {
  const { hasFeature, hasAnyFeature, hasAllFeatures } = useFeature();

  // Vérifier une fonctionnalité
  if (hasFeature('parts')) {
    // Afficher le module pièces
  }

  // Vérifier si au moins une fonctionnalité est activée
  if (hasAnyFeature('photos', 'documents')) {
    // Afficher la section médias
  }

  // Vérifier si toutes les fonctionnalités sont activées
  if (hasAllFeatures('timeTracking', 'invoicing')) {
    // Afficher le module facturation complet
  }

  return <div>...</div>;
};
```

### Guard de route avec `FeatureGuard`

```typescript
import { FeatureGuard } from '@/shared/components/guards/FeatureGuard';

// Dans le router
{
  path: 'photos',
  element: (
    <FeatureGuard feature="photos">
      <PhotosPage />
    </FeatureGuard>
  ),
}
```

### Vérification conditionnelle dans l'UI

```typescript
import { useFeature } from '@/features/establishments/hooks/useFeature';

const InterventionDetails = () => {
  const { hasFeature } = useFeature();

  return (
    <div>
      <h1>Détails de l'intervention</h1>

      {/* Afficher les onglets conditionnellement */}
      <Tabs>
        <Tab label="Général" />

        {hasFeature('comments') && <Tab label="Commentaires" />}
        {hasFeature('photos') && <Tab label="Photos" />}
        {hasFeature('parts') && <Tab label="Pièces" />}
        {hasFeature('timeTracking') && <Tab label="Temps" />}
      </Tabs>
    </div>
  );
};
```

## 📝 Structure des données

### Type `EstablishmentFeatures`

```typescript
interface EstablishmentFeatures {
  // Core features (INDISPENSABLES)
  interventions: FeatureConfig;
  interventionQuickCreate: FeatureConfig;
  history: FeatureConfig;

  // Interventions - Optionnelles
  interventionGuidedCreate: FeatureConfig;
  interventionTemplates: FeatureConfig;
  // ... etc
}

interface FeatureConfig {
  enabled: boolean;
}
```

### Métadonnées des fonctionnalités

```typescript
interface FeatureMetadata {
  key: keyof EstablishmentFeatures;
  label: string;
  description: string;
  icon: string; // Nom de l'icône Lucide
  category: 'core' | 'interventions' | 'communication' | 'media' | 'parts' | 'time' | 'analytics' | 'rooms' | 'integrations';
  isRequired?: boolean; // Indispensable
  requiresConfig?: boolean; // Nécessite une configuration
  dependsOn?: (keyof EstablishmentFeatures)[]; // Dépendances
  badge?: 'new' | 'beta' | 'premium' | 'coming-soon'; // Badge
}
```

## 🔐 Permissions

- Seuls les **Super Admins** peuvent gérer les fonctionnalités
- Les modifications sont sauvegardées au niveau de l'établissement
- Chaque établissement peut avoir sa propre configuration

## 🎨 Badges

- **✨ Nouveau** - Fonctionnalité récemment ajoutée
- **🧪 Bêta** - En phase de test
- **💎 Premium** - Nécessite un abonnement premium
- **🔜 Bientôt** - En cours de développement

## 🚀 Ajout d'une nouvelle fonctionnalité

1. **Ajouter le champ dans `EstablishmentFeatures`** (`src/shared/types/establishment.types.ts`)
2. **Ajouter la configuration par défaut dans `DEFAULT_ESTABLISHMENT_FEATURES`**
3. **Ajouter les métadonnées dans `FEATURES_CATALOG`**
4. **Utiliser `useFeature()` dans le code pour vérifier l'activation**

### Exemple complet

```typescript
// 1. Dans establishment.types.ts
export interface EstablishmentFeatures {
  // ... autres fonctionnalités
  myNewFeature: FeatureConfig;
}

// 2. Configuration par défaut
export const DEFAULT_ESTABLISHMENT_FEATURES: EstablishmentFeatures = {
  // ... autres configs
  myNewFeature: { enabled: false },
};

// 3. Catalogue
export const FEATURES_CATALOG: FeatureMetadata[] = [
  // ... autres features
  {
    key: 'myNewFeature',
    label: 'Ma nouvelle fonctionnalité',
    description: 'Description de la fonctionnalité',
    icon: 'Star', // Icône Lucide
    category: 'interventions',
    dependsOn: ['interventions'], // Optionnel
    badge: 'new', // Optionnel
  },
];

// 4. Utilisation
const MyComponent = () => {
  const isEnabled = useFeature('myNewFeature');

  if (!isEnabled) return null;

  return <div>Ma nouvelle fonctionnalité !</div>;
};
```

## 📊 Migration des établissements existants

Les établissements existants recevront automatiquement la configuration par défaut définie dans `DEFAULT_ESTABLISHMENT_FEATURES` lors de leur prochaine mise à jour.

Pour forcer la mise à jour de tous les établissements :

```typescript
import { DEFAULT_ESTABLISHMENT_FEATURES } from '@/shared/types/establishment.types';

// Script de migration (à exécuter une seule fois)
const migrateEstablishments = async () => {
  const establishments = await getAllEstablishments();

  for (const establishment of establishments) {
    await updateEstablishment(establishment.id, {
      features: {
        ...DEFAULT_ESTABLISHMENT_FEATURES,
        ...establishment.features, // Conserver les features existantes
      },
    });
  }
};
```

## 🐛 Dépannage

### La fonctionnalité n'apparaît pas dans l'interface

1. Vérifiez que la fonctionnalité est bien activée dans `/settings/features`
2. Vérifiez que toutes les dépendances sont activées
3. Vérifiez que vous utilisez correctement `useFeature()`

### Je ne peux pas désactiver une fonctionnalité

1. Vérifiez que la fonctionnalité n'est pas marquée comme `isRequired`
2. Vérifiez qu'aucune autre fonctionnalité n'en dépend
3. Désactivez d'abord les fonctionnalités dépendantes

### Les modifications ne sont pas sauvegardées

1. Vérifiez que vous êtes connecté en tant que Super Admin
2. Vérifiez que vous cliquez bien sur "Enregistrer"
3. Consultez la console pour voir s'il y a des erreurs

## 📚 Ressources

- [Documentation Lucide Icons](https://lucide.dev) - Pour trouver des icônes
- [Firestore](https://firebase.google.com/docs/firestore) - Base de données utilisée
