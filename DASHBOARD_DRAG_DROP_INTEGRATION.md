# Dashboard Drag & Drop Integration - Documentation

## Vue d'ensemble

Le système de dashboard personnalisable intègre maintenant un système complet de **drag & drop** et de **redimensionnement** pour les widgets, basé sur `react-grid-layout`.

## Fonctionnalités implémentées

### 1. DashboardGrid Component
- **Fichier**: `src/features/dashboard/components/DashboardGrid.tsx`
- **Fonction**: Grille interactive avec drag & drop et redimensionnement
- **Caractéristiques**:
  - Grille de 12 colonnes
  - Hauteur de ligne de 30px
  - Réorganisation par glisser-déposer
  - Redimensionnement en tirant sur le coin inférieur droit
  - Contraintes de taille (min/max)
  - Compactage vertical automatique
  - Support du mode édition

### 2. Intégration dans Dashboard.tsx
- **Fichier**: `src/pages/Dashboard.tsx`
- **Modifications**:
  - Import de `DashboardGrid`
  - Ajout du handler `handleLayoutChange` pour sauvegarder les modifications
  - Remplacement de la grille simple par `DashboardGrid`
  - Persistance automatique des positions et tailles dans Firestore

### 3. Mode édition amélioré dans DashboardEditMode
- **Fichier**: `src/features/dashboard/components/DashboardEditMode.tsx`
- **Nouvelles fonctionnalités**:
  - **Toggle Liste/Grille**: Boutons pour basculer entre deux modes d'affichage
  - **Mode Liste**: Liste verticale avec drag & drop simple (existant)
  - **Mode Grille**: Grille interactive avec `DashboardGrid` permettant:
    - Drag & drop bidimensionnel
    - Redimensionnement des widgets
    - Prévisualisation en temps réel
  - Aide contextuelle expliquant comment utiliser le mode grille

## Utilisation

### Pour l'utilisateur final

#### 1. Activer le mode édition
1. Cliquer sur le bouton **"Mode Édition"** dans le dashboard
2. Une modal s'ouvre avec la liste des widgets

#### 2. Choisir le mode de visualisation
- **Mode Liste** (par défaut):
  - Affiche les widgets en liste verticale
  - Permet de réorganiser par drag & drop
  - Affiche/masque les widgets avec le bouton œil
  - Boutons pour masquer/afficher rapidement

- **Mode Grille**:
  - Cliquer sur le bouton **"Grille"** en haut à droite
  - Affiche les widgets dans une grille interactive
  - **Réorganiser**: Cliquer et glisser un widget vers une nouvelle position
  - **Redimensionner**: Tirer sur le coin inférieur droit d'un widget
  - Les modifications sont appliquées en temps réel localement
  - Aide contextuelle affichée en bas

#### 3. Sauvegarder les modifications
- Cliquer sur **"Sauvegarder et quitter"**
- Les positions et tailles sont persistées dans Firestore
- Le dashboard se met à jour automatiquement

### Pour les développeurs

#### Structure des widgets avec positions

```typescript
interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    row: number;  // Position Y dans la grille
    col: number;  // Position X dans la grille (0-11)
  };
  visible: boolean;
  // ... autres propriétés
}
```

#### Mapping des tailles

```typescript
const WIDGET_SIZE_MAP = {
  small: { w: 3, h: 4 },    // 1/4 de la largeur
  medium: { w: 6, h: 4 },   // 1/2 de la largeur
  large: { w: 9, h: 6 },    // 3/4 de la largeur
  full: { w: 12, h: 8 },    // Pleine largeur
};
```

#### Ajout d'un nouveau widget avec position

```typescript
const newWidget: WidgetConfig = {
  id: `widget-${Date.now()}`,
  type: 'stats_card',
  title: 'Nouveau Widget',
  size: 'medium',
  position: { row: 0, col: 0 },  // En haut à gauche
  visible: true,
  dataSource: 'static',
};
```

## Architecture technique

### Flux de données

```
Utilisateur interagit avec DashboardGrid
         ↓
handleLayoutChange (DashboardGrid)
         ↓
onLayoutChange callback
         ↓
handleLayoutChange (Dashboard.tsx)
         ↓
updatePreferences (useDashboard hook)
         ↓
dashboardService.updatePreferences
         ↓
Firestore (persistance)
         ↓
Mise à jour automatique du dashboard
```

### Conversion layout ↔ widgets

1. **Widgets → Layout** (pour react-grid-layout):
```typescript
const layout: Layout[] = widgets.map((widget, index) => {
  const size = WIDGET_SIZE_MAP[widget.size];
  return {
    i: widget.id,
    x: widget.position?.col || (index * 3) % 12,
    y: widget.position?.row || Math.floor((index * 3) / 12) * 4,
    w: size.w,
    h: size.h,
    minW: 3,
    maxW: 12,
  };
});
```

2. **Layout → Widgets** (après modification):
```typescript
const updatedWidgets = widgets.map(widget => {
  const layoutItem = newLayout.find(l => l.i === widget.id);

  // Déterminer la nouvelle taille
  let newSize: WidgetSize = 'medium';
  if (layoutItem.w <= 3) newSize = 'small';
  else if (layoutItem.w <= 6) newSize = 'medium';
  else if (layoutItem.w <= 9) newSize = 'large';
  else newSize = 'full';

  return {
    ...widget,
    size: newSize,
    position: {
      row: layoutItem.y,
      col: layoutItem.x,
    },
  };
});
```

## Styles et personnalisation

### Styles inclus dans DashboardGrid

- **Placeholder**: Zone bleue en pointillé lors du drag
- **Handle de redimensionnement**: Icône dans le coin inférieur droit
- **Effet hover**: Ombre portée au survol en mode édition
- **Dark mode**: Support complet avec styles adaptés

### Classes CSS importantes

```css
.dashboard-grid-item.edit-mode {
  cursor: move;
  transition: box-shadow 0.2s;
}

.react-grid-item.react-grid-placeholder {
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
}

.react-grid-item > .react-resizable-handle {
  /* Handle de redimensionnement */
}
```

## Performance

### Optimisations

1. **useMemo** pour le calcul du layout
2. **useCallback** pour les handlers
3. **Compactage vertical** pour éviter les espaces vides
4. **CSS transforms** pour des animations fluides
5. **Sauvegarde différée** uniquement au clic sur "Sauvegarder"

## Limites et contraintes

### Tailles
- **Largeur minimum**: 3 colonnes (1/4 de la grille)
- **Largeur maximum**: 12 colonnes (pleine largeur)
- **Hauteur minimum**: 3 unités
- **Hauteur maximum**: 12 unités

### Grille
- **Colonnes**: 12 (fixe)
- **Hauteur de ligne**: 30px
- **Marges**: 16px entre les widgets

## Dépendances

```json
{
  "react-grid-layout": "^1.4.4",
  "react-resizable": "^3.0.5"
}
```

### CSS requis

```typescript
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

## Exemples d'utilisation

### Exemple 1: Dashboard simple
```tsx
<DashboardGrid
  widgets={visibleWidgets}
  onLayoutChange={handleLayoutChange}
  isEditMode={false}  // Mode affichage normal
/>
```

### Exemple 2: Mode édition
```tsx
<DashboardGrid
  widgets={widgets}
  interventionStats={interventionStats}
  timelineData={timelineData}
  roomStats={roomStats}
  technicianPerformance={technicianPerformance}
  calculatedStats={calculatedStats}
  chartData={chartData}
  onNavigate={navigate}
  onLayoutChange={handleGridLayoutChange}
  isEditMode={true}  // Drag & drop activé
/>
```

## Troubleshooting

### Les widgets ne se déplacent pas
- Vérifier que `isEditMode={true}`
- Vérifier que `isDraggable={isEditMode}` dans GridLayout

### Les positions ne sont pas sauvegardées
- Vérifier que `onLayoutChange` est bien défini
- Vérifier la persistance dans `updatePreferences`
- Vérifier les erreurs dans la console

### Les widgets se chevauchent
- Vérifier `preventCollision={false}` dans GridLayout
- Vérifier `compactType="vertical"`

### Le redimensionnement ne fonctionne pas
- Vérifier que `isResizable={isEditMode}` dans GridLayout
- Vérifier l'import du CSS de react-resizable
- Vérifier les contraintes min/max

## Évolutions futures possibles

1. **Templates de disposition**: Sauvegarder/charger des dispositions prédéfinies
2. **Partage de dispositions**: Partager une configuration entre utilisateurs
3. **Responsive breakpoints**: Adapter la grille selon la taille d'écran
4. **Undo/Redo**: Annuler/refaire les modifications
5. **Widget grouping**: Grouper plusieurs widgets ensemble
6. **Locked widgets**: Verrouiller certains widgets
7. **Export/Import**: Exporter/importer la configuration en JSON

## Ressources

- [React Grid Layout Documentation](https://github.com/react-grid-layout/react-grid-layout)
- [React Resizable Documentation](https://github.com/react-grid-layout/react-resizable)
- [Guide des widgets personnalisés](./DASHBOARD_WIDGETS_GUIDE.md)
