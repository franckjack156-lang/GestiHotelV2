# Guide du Système de Widgets Dashboard

## 📋 Vue d'ensemble

Le système de widgets du dashboard permet de créer des tableaux de bord entièrement personnalisables avec :
- **Drag & Drop** pour réorganiser les widgets
- **Redimensionnement** dynamique des widgets
- **Widgets personnalisables** (horloge, liens, boutons, notes, listes, iframes)
- **Widgets de données** (stats, graphiques, etc.)

## 🎯 Types de Widgets Disponibles

### Widgets de Données

| Type | Description | Options |
|------|-------------|---------|
| `stats_card` | Carte de statistiques | Icône, couleur, valeur, description |
| `line_chart` | Graphique en ligne | Légende, grille, tooltip, couleurs |
| `bar_chart` | Graphique en barres | Vertical/horizontal, valeurs affichées |
| `pie_chart` | Graphique circulaire | Donut, couleurs personnalisées |
| `area_chart` | Graphique en aires | Stacked, couleurs |

### Widgets Personnalisables

| Type | Description | Configuration |
|------|-------------|---------------|
| `clock` | Horloge | Format (12h/24h/analog), secondes, date, timezone |
| `quick_links` | Liens rapides | Liste de liens avec URL, icône, couleur |
| `button_grid` | Grille de boutons | Actions (navigate/external/custom) |
| `note` | Note/texte libre | Contenu, couleurs, taille police |
| `custom_list` | Liste personnalisée | Items, checkboxes, priorités |
| `iframe` | Site web intégré | URL, fullscreen, sandbox |

## 📐 Tailles de Widgets

Les widgets peuvent avoir 4 tailles :
- **small** : 1/4 de largeur (3 colonnes sur 12)
- **medium** : 1/2 de largeur (6 colonnes sur 12)
- **large** : 3/4 de largeur (9 colonnes sur 12)
- **full** : Pleine largeur (12 colonnes sur 12)

## 🔧 Comment Ajouter un Nouveau Widget

### 1. Widget Horloge

```typescript
{
  id: 'clock-1',
  type: 'clock',
  dataSource: 'static',
  title: 'Horloge',
  size: 'small',
  position: { row: 0, col: 0 },
  visible: true,
  clockOptions: {
    format: '24h', // '12h', '24h', 'analog'
    showSeconds: true,
    showDate: true,
    timezone: 'Europe/Paris' // optionnel
  }
}
```

### 2. Widget Liens Rapides

```typescript
{
  id: 'links-1',
  type: 'quick_links',
  dataSource: 'static',
  title: 'Liens Utiles',
  size: 'medium',
  position: { row: 0, col: 3 },
  visible: true,
  linksOptions: {
    columns: 2,
    links: [
      {
        id: 'link-1',
        label: 'Google',
        url: 'https://google.com',
        icon: 'external',
        color: 'blue',
        openInNewTab: true
      },
      {
        id: 'link-2',
        label: 'Documentation',
        url: 'https://docs.example.com',
        icon: 'external',
        color: 'green',
        openInNewTab: true
      }
    ]
  }
}
```

### 3. Widget Grille de Boutons

```typescript
{
  id: 'buttons-1',
  type: 'button_grid',
  dataSource: 'static',
  title: 'Actions Rapides',
  size: 'medium',
  position: { row: 0, col: 6 },
  visible: true,
  buttonsOptions: {
    columns: 2,
    buttons: [
      {
        id: 'btn-1',
        label: 'Nouvelle Intervention',
        action: 'navigate',
        target: '/app/interventions/create',
        icon: 'plus',
        variant: 'default'
      },
      {
        id: 'btn-2',
        label: 'Paramètres',
        action: 'navigate',
        target: '/app/settings',
        icon: 'settings',
        variant: 'outline'
      }
    ]
  }
}
```

### 4. Widget Note

```typescript
{
  id: 'note-1',
  type: 'note',
  dataSource: 'static',
  title: 'Note Importante',
  size: 'medium',
  position: { row: 1, col: 0 },
  visible: true,
  noteOptions: {
    content: 'Ceci est une note importante.\nSupporte plusieurs lignes.',
    backgroundColor: 'yellow',
    textColor: 'yellow',
    fontSize: 'medium' // 'small', 'medium', 'large'
  }
}
```

### 5. Widget Liste Personnalisée

```typescript
{
  id: 'list-1',
  type: 'custom_list',
  dataSource: 'static',
  title: 'Ma TODO List',
  size: 'medium',
  position: { row: 1, col: 6 },
  visible: true,
  customListOptions: {
    editable: true,
    showCheckboxes: true,
    items: [
      {
        id: 'item-1',
        text: 'Tâche 1',
        checked: false,
        priority: 'high'
      },
      {
        id: 'item-2',
        text: 'Tâche 2',
        checked: true,
        priority: 'medium'
      }
    ]
  }
}
```

### 6. Widget Iframe

```typescript
{
  id: 'iframe-1',
  type: 'iframe',
  dataSource: 'static',
  title: 'Météo',
  size: 'large',
  position: { row: 2, col: 0 },
  visible: true,
  iframeOptions: {
    url: 'https://example.com/weather',
    allowFullscreen: false,
    allowScripts: false // Pour la sécurité
  }
}
```

## 🎨 Mode Édition

Le mode édition permet de :
- ✅ Réorganiser les widgets par drag & drop
- ✅ Masquer/afficher les widgets
- ⏳ Redimensionner les widgets (avec react-grid-layout)
- ⏳ Ajouter de nouveaux widgets
- ⏳ Configurer les options de chaque widget

## 📁 Structure des Fichiers

```
src/features/dashboard/
├── components/
│   ├── widgets/
│   │   ├── ClockWidget.tsx          ✅ Créé
│   │   ├── QuickLinksWidget.tsx     ✅ Créé
│   │   ├── ButtonGridWidget.tsx     ✅ Créé
│   │   ├── NoteWidget.tsx           ✅ Créé
│   │   ├── CustomListWidget.tsx     ✅ Créé
│   │   └── IframeWidget.tsx         ✅ Créé
│   ├── WidgetRenderer.tsx           ✅ Mis à jour
│   ├── DashboardGrid.tsx            ✅ Créé
│   ├── DashboardEditMode.tsx        ✅ Créé
│   └── CustomizeDashboardDialog.tsx ⏳ À mettre à jour
├── types/
│   └── dashboard.types.ts           ✅ Étendu avec nouveaux types
├── services/
│   └── dashboardService.ts          ✅ Service complet
└── hooks/
    └── useDashboard.ts              ✅ Hook complet

```

## 🚀 Prochaines Étapes

### Phase 1 : Intégration du Grid Layout (En cours)
- [x] Créer DashboardGrid.tsx avec react-grid-layout
- [ ] Intégrer DashboardGrid dans Dashboard.tsx
- [ ] Permettre le redimensionnement des widgets
- [ ] Sauvegarder les positions et tailles

### Phase 2 : Interface de Configuration
- [ ] Créer WidgetConfigDialog pour configurer chaque type de widget
- [ ] Mettre à jour DashboardEditMode pour ajouter de nouveaux widgets
- [ ] Formulaires spécifiques pour chaque type de widget
- [ ] Validation des configurations

### Phase 3 : Fonctionnalités Avancées
- [ ] Templates de dashboards pré-configurés
- [ ] Import/Export de configurations
- [ ] Partage de dashboards entre utilisateurs
- [ ] Widgets avec refresh automatique

## 💡 Exemples d'Utilisation

### Dashboard pour Manager
- Stats interventions (large)
- Horloge (small)
- Liens rapides vers rapports (medium)
- Graphique évolution (large)

### Dashboard pour Technicien
- Mes interventions du jour (medium)
- Boutons actions rapides (medium)
- Horloge (small)
- Notes importantes (medium)

### Dashboard Personnalisé
- Mix de tous les types selon les besoins
- Organisation libre par drag & drop
- Tailles adaptées au contenu

## 🔒 Sécurité

### Widgets Iframe
- Utilise sandbox par défaut
- Scripts désactivés par défaut
- Permet fullscreen optionnel
- URLs validées côté client

### Widgets avec Actions
- Navigation interne validée
- Liens externes ouverts en noopener/noreferrer
- Actions personnalisées contrôlées

## 📝 Notes Techniques

- Les widgets utilisent le système de grille 12 colonnes
- Responsive avec breakpoints adaptés
- Dark mode supporté pour tous les widgets
- Optimisations de performance (memo, useCallback)
- Persistence dans Firestore par utilisateur/établissement
