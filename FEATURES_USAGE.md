# Guide d'utilisation du système de fonctionnalités

## Vue d'ensemble

Le système de fonctionnalités permet de masquer dynamiquement des parties de l'interface utilisateur selon les fonctionnalités activées pour chaque établissement.

## Méthodes de protection

### 1. Protection conditionnelle avec `useFeature` (Recommandée)

Pour masquer des éléments dans une page :

```tsx
import { useFeature } from '@/features/establishments/hooks/useFeature';

const MyComponent = () => {
  const { hasFeature } = useFeature();

  return (
    <div>
      {/* Toujours visible */}
      <h1>Titre</h1>

      {/* Visible uniquement si la fonctionnalité est activée */}
      {hasFeature('comments') && (
        <CommentsSection />
      )}

      {/* Vérifier plusieurs fonctionnalités */}
      {hasFeature('photos') && hasFeature('documents') && (
        <MediaGallery />
      )}
    </div>
  );
};
```

### 2. Protection de routes avec `FeatureGuard`

Pour protéger une page entière :

```tsx
// Dans router.tsx
import { FeatureGuard } from '@/shared/components/guards/FeatureGuard';

{
  path: 'planning',
  element: (
    <FeatureGuard feature="interventionPlanning">
      <PlanningPage />
    </FeatureGuard>
  ),
}
```

### 3. Vérifications multiples

```tsx
const { hasFeature, hasAnyFeature, hasAllFeatures } = useFeature();

// Vérifier une seule fonctionnalité
if (hasFeature('photos')) {
  // ...
}

// Au moins une fonctionnalité activée
if (hasAnyFeature('photos', 'documents')) {
  // Afficher section médias
}

// Toutes les fonctionnalités activées
if (hasAllFeatures('timeTracking', 'invoicing')) {
  // Afficher facturation complète
}
```

## Exemples d'implémentation

### Exemple 1 : Onglets conditionnels

```tsx
import { useFeature } from '@/features/establishments/hooks/useFeature';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

const InterventionDetails = () => {
  const { hasFeature } = useFeature();

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Détails</TabsTrigger>

        {hasFeature('comments') && (
          <TabsTrigger value="comments">Commentaires</TabsTrigger>
        )}

        {hasFeature('photos') && (
          <TabsTrigger value="photos">Photos</TabsTrigger>
        )}

        {hasFeature('parts') && (
          <TabsTrigger value="parts">Pièces</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="details">
        <DetailsTab />
      </TabsContent>

      {hasFeature('comments') && (
        <TabsContent value="comments">
          <CommentsTab />
        </TabsContent>
      )}

      {hasFeature('photos') && (
        <TabsContent value="photos">
          <PhotosTab />
        </TabsContent>
      )}

      {hasFeature('parts') && (
        <TabsContent value="parts">
          <PartsTab />
        </TabsContent>
      )}
    </Tabs>
  );
};
```

### Exemple 2 : Boutons conditionnels

```tsx
const InterventionActions = () => {
  const { hasFeature } = useFeature();

  return (
    <div className="flex gap-2">
      <Button>Modifier</Button>

      {hasFeature('partsOrderEmail') && (
        <Button onClick={sendOrderEmail}>
          Commander pièces
        </Button>
      )}

      {hasFeature('dataExport') && (
        <Button onClick={exportData}>
          Exporter
        </Button>
      )}
    </div>
  );
};
```

### Exemple 3 : Sections complètes

```tsx
const Dashboard = () => {
  const { hasFeature } = useFeature();

  return (
    <div className="grid gap-4">
      {/* Toujours visible */}
      <InterventionsSummary />

      {/* Section analytique conditionnelle */}
      {hasFeature('advancedStatistics') && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques avancées</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedCharts />
          </CardContent>
        </Card>
      )}

      {/* Section facturation conditionnelle */}
      {hasFeature('invoicing') && (
        <InvoicingWidget />
      )}
    </div>
  );
};
```

## Liste des fonctionnalités disponibles

### Core (Indispensables - toujours activées)
- `interventions` - Gestion des interventions
- `interventionQuickCreate` - Création rapide
- `history` - Historique

### Interventions
- `interventionGuidedCreate` - Création guidée
- `interventionTemplates` - Modèles d'intervention (🔜)
- `interventionImportExport` - Import/Export
- `interventionRecurrence` - Récurrence (🔜)
- `interventionPlanning` - Planning

### Communication
- `comments` - Commentaires
- `emailNotifications` - Notifications email
- `pushNotifications` - Notifications push (🔜)
- `internalChat` - Chat interne (🔜)

### Médias
- `photos` - Photos
- `documents` - Documents (🔜)
- `signatures` - Signatures électroniques (💎)

### Pièces et stocks
- `parts` - Gestion des pièces
- `partsOrderEmail` - Commande par email (✨)
- `inventory` - Gestion des stocks (🔜)
- `suppliers` - Fournisseurs (🔜)

### Temps et facturation
- `timeTracking` - Chronomètre
- `manualTimeEntry` - Saisie manuelle
- `invoicing` - Facturation (💎)
- `financialReports` - Rapports financiers (💎)

### Analytique
- `dashboard` - Tableau de bord
- `customReports` - Rapports personnalisés (💎)
- `advancedStatistics` - Statistiques avancées (💎)
- `dataExport` - Export de données

### Chambres
- `rooms` - Gestion des chambres
- `roomsQRCode` - QR Codes chambres (🔜)

### Intégrations
- `apiAccess` - Accès API (💎)
- `webhooks` - Webhooks (💎)
- `thirdPartyIntegrations` - Intégrations tierces (🔜)

## Bonnes pratiques

### ✅ À faire

1. **Toujours vérifier les fonctionnalités** avant d'afficher un élément UI lié à une fonctionnalité optionnelle
2. **Utiliser le bon niveau de protection** :
   - `useFeature()` pour les éléments UI
   - `FeatureGuard` pour les pages entières
3. **Penser aux dépendances** : si une fonctionnalité dépend d'une autre, vérifiez les deux si nécessaire
4. **Fournir des alternatives** : quand une fonctionnalité est désactivée, proposez une alternative ou un message clair

### ❌ À éviter

1. **Ne pas dupliquer les vérifications** : si un composant parent vérifie déjà, pas besoin de revérifier dans l'enfant
2. **Ne pas cacher les fonctionnalités essentielles** : les fonctionnalités marquées `isRequired` ne doivent jamais être cachées
3. **Ne pas oublier le contenu des onglets** : si vous cachez un `TabsTrigger`, cachez aussi son `TabsContent`

## Débuggage

Pour vérifier l'état des fonctionnalités en développement :

```tsx
const { features, getEnabledFeatures } = useFeature();

console.log('Toutes les features:', features);
console.log('Features activées:', getEnabledFeatures());
```

Le composant `FeatureGuard` affiche automatiquement des informations de debug en mode développement.

## Migration de code existant

Si vous avez du code existant à migrer :

1. Identifiez les éléments UI liés à des fonctionnalités
2. Importez `useFeature`
3. Enveloppez les éléments avec des conditions
4. Testez avec la fonctionnalité activée ET désactivée

Exemple de migration :

**Avant :**
```tsx
const MyPage = () => (
  <div>
    <CommentsSection />
    <PhotosSection />
  </div>
);
```

**Après :**
```tsx
const MyPage = () => {
  const { hasFeature } = useFeature();

  return (
    <div>
      {hasFeature('comments') && <CommentsSection />}
      {hasFeature('photos') && <PhotosSection />}
    </div>
  );
};
```
