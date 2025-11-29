# Guide UI - Boutons d'export PDF

## Localisation des boutons d'export PDF dans l'interface

### 1. Page Liste des interventions (InterventionsPage)

**Emplacement :** Barre d'actions principale, en haut à droite

**Chemin :** `/app/interventions`

**Hiérarchie visuelle :**
```
┌─────────────────────────────────────────────────────────────────┐
│ Interventions                                                   │
│ Gérez et suivez toutes vos interventions                       │
│                                                                 │
│ [Kanban] [Liste]  [Actualiser] [Exporter PDF] [Corbeille] ... │
│                                   ^^^^^^^^^^^                   │
│                                   NOUVEAU !                     │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Stats Cards]                                           │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [Barre de recherche et filtres]                                │
│                                                                 │
│ [Liste/Kanban des interventions]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Apparence du bouton :**
- **Variant :** Outline (contour)
- **Taille :** Small
- **Icon :** FileDown (flèche vers le bas dans un document)
- **Texte :** "Exporter PDF" (caché sur mobile, visible sur desktop)
- **État désactivé :** Grisé quand aucune intervention à exporter
- **Responsive :**
  - Mobile : Icon seule
  - Desktop : Icon + texte

**Code HTML généré :**
```html
<button class="inline-flex items-center justify-center ... border ...">
  <svg class="h-4 w-4"><!-- FileDown icon --></svg>
  <span class="hidden sm:inline ml-2">Exporter PDF</span>
</button>
```

**Comportement au clic :**
1. Toast "Génération du PDF en cours..."
2. Génération du PDF (2-5 secondes selon nombre d'interventions)
3. Téléchargement automatique du fichier
4. Toast "PDF généré avec succès"

**Nom du fichier téléchargé :**
```
interventions_2024-11-29_1430.pdf
```

---

### 2. Page Détail d'intervention (InterventionDetailsPage)

**Emplacement :** Menu dropdown "..." (MoreVertical), en haut à droite

**Chemin :** `/app/interventions/:id`

**Hiérarchie visuelle :**
```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Titre de l'intervention                          [Démarrer] │
│     #REF-001                                          [...] ← ICI│
│                                                          │        │
│ [Statut] [Priorité] [Type] [URGENT] • Chambre 101      ▼        │
│                                                  ┌─────────────┐ │
│ ┌──────────────────────────────────────────────┐│ Modifier    │ │
│ │ [Détails][Comments][Photos][Pièces][Temps]  ││ Exporter PDF│ │
│ └──────────────────────────────────────────────┘│ Partager    │ │
│                                                  │─────────────│ │
│ [Contenu de l'onglet actif]                    │ Mettre en   │ │
│                                                  │ pause       │ │
│                                                  │─────────────│ │
│                                                  │ Supprimer   │ │
│                                                  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Apparence de l'option :**
- **Icon :** Download (flèche vers le bas)
- **Texte :** "Exporter PDF"
- **Position :** Deuxième option du menu (après "Modifier")
- **Séparateur :** Aucun séparateur avant cette option

**Code HTML généré :**
```html
<div role="menuitem" class="...">
  <svg class="mr-2 h-4 w-4"><!-- Download icon --></svg>
  Exporter PDF
</div>
```

**Comportement au clic :**
1. Fermeture du menu dropdown
2. Toast "Génération du PDF en cours..."
3. Génération du PDF détaillé (1-2 secondes)
4. Téléchargement automatique du fichier
5. Toast "PDF généré avec succès"

**Nom du fichier téléchargé :**
```
intervention_REF-001_2024-11-29_1430.pdf
```

---

## Styles et responsive

### Desktop (>= 640px)
```tsx
<Button variant="outline" size="sm">
  <FileDown className="h-4 w-4" />
  <span className="hidden sm:inline ml-2">Exporter PDF</span>
</Button>
```
**Affichage :** `[📄] Exporter PDF`

### Mobile (< 640px)
```tsx
<Button variant="outline" size="sm">
  <FileDown className="h-4 w-4" />
  <span className="hidden sm:inline ml-2">Exporter PDF</span>
</Button>
```
**Affichage :** `[📄]`

---

## Feedback utilisateur

### États du toast

**Loading :**
```
⏳ Génération du PDF en cours...
```

**Success :**
```
✅ PDF généré avec succès
```

**Error :**
```
❌ Erreur lors de la génération du PDF
```

---

## Accessibilité

### Bouton InterventionsPage
- **Label :** "Exporter PDF"
- **Title/Aria-label :** Automatique via le texte
- **Disabled state :** `aria-disabled="true"` quand désactivé
- **Keyboard :** Accessible via Tab + Enter

### Option menu InterventionDetailsPage
- **Role :** `menuitem`
- **Label :** "Exporter PDF"
- **Keyboard :** Accessible via flèches + Enter dans le menu ouvert

---

## Exemples de contenus PDF

### Liste d'interventions (landscape)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]   Liste des interventions       Généré le 29/11/24 14:30│
│           42 intervention(s)                                     │
│─────────────────────────────────────────────────────────────────│
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Réf    │ Titre        │ Statut    │ Priorité │ Type    │...│ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ INT-001│ Fuite salle..│ En cours  │ Urgent   │ Plomberi│...│ │
│ │ INT-002│ Climatisati..│ Terminée  │ Normal   │ Mainten │...│ │
│ │ ...                                                        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Total: 42 intervention(s)                                       │
│                                                                  │
│─────────────────────────────────────────────────────────────────│
│            Page 1 / 2                    Généré avec GestiHotel │
└─────────────────────────────────────────────────────────────────┘
```

### Détail intervention (portrait)

```
┌──────────────────────────────────────────────┐
│  [Logo]   Intervention - Fuite salle de bain │
│           #INT-001                           │
│           Généré le 29/11/24 14:30           │
│──────────────────────────────────────────────│
│                                              │
│ Informations générales                      │
│ ──────────────────────────────────────────  │
│ Référence      INT-001                       │
│ Titre          Fuite dans la salle de bain   │
│ Description    Fuite d'eau sous le lavabo... │
│ Type           Plomberie                     │
│ Statut         En cours                      │
│ Priorité       Urgent                        │
│ Localisation   Chambre 101                   │
│                                              │
│ Assignation et planification                │
│ ──────────────────────────────────────────  │
│ Assigné à      Jean Dupont                   │
│ Créé par       Marie Martin                  │
│ Date création  28/11/2024 10:30              │
│ Planifié pour  29/11/2024 08:00              │
│ Démarré le     29/11/2024 08:15              │
│ Durée estimée  60 min                        │
│                                              │
│ Notes internes                               │
│ ──────────────────────────────────────────  │
│ Besoin de pièce de rechange...              │
│                                              │
│──────────────────────────────────────────────│
│ Page 1 / 1         Généré avec GestiHotel   │
└──────────────────────────────────────────────┘
```

---

## Tests utilisateur

### Checklist de tests UI

**InterventionsPage :**
- [ ] Le bouton est visible sur desktop
- [ ] Le bouton montre uniquement l'icon sur mobile
- [ ] Le bouton est désactivé quand aucune intervention
- [ ] Le bouton est actif quand il y a des interventions
- [ ] Le toast de chargement s'affiche
- [ ] Le PDF se télécharge automatiquement
- [ ] Le toast de succès s'affiche
- [ ] Le nom de fichier est correct
- [ ] Le PDF contient toutes les interventions filtrées

**InterventionDetailsPage :**
- [ ] L'option "Exporter PDF" est dans le menu "..."
- [ ] L'icon Download est visible
- [ ] Le clic ferme le menu et lance l'export
- [ ] Le toast de chargement s'affiche
- [ ] Le PDF se télécharge automatiquement
- [ ] Le toast de succès s'affiche
- [ ] Le nom de fichier contient la référence
- [ ] Le PDF contient toutes les infos de l'intervention

### Scénarios d'erreur

**Aucune intervention :**
- [ ] Le bouton est grisé
- [ ] Le clic ne fait rien
- [ ] Pas de toast d'erreur

**Erreur de génération :**
- [ ] Toast d'erreur s'affiche
- [ ] Message d'erreur dans la console
- [ ] Pas de téléchargement de fichier corrompu

---

## Personnalisation pour votre établissement

### Ajouter le logo de l'établissement

**Étape 1 :** Préparer le logo
- Format : PNG ou JPG
- Taille recommandée : 300x300px
- Fond transparent (PNG) recommandé

**Étape 2 :** Convertir en data URL
```typescript
// Exemple avec logo en ligne
const logo = 'https://mon-etablissement.com/logo.png';

// OU convertir en base64
const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEU...';
```

**Étape 3 :** Passer le logo dans les options
```typescript
const blob = await generateInterventionsPDF(interventions, {
  title: 'Mes interventions',
  logo: logo,
});
```

### Personnaliser les couleurs

Éditer `src/shared/services/pdfService.ts` :
```typescript
const COLORS = {
  primary: '#votre-couleur',      // Ex: #e74c3c
  secondary: '#votre-couleur',    // Ex: #34495e
  // ...
};
```

---

## Support

Pour toute question sur l'utilisation de la fonctionnalité d'export PDF :
1. Consulter la documentation complète : `docs/PDF_GENERATION.md`
2. Voir les exemples : `src/shared/services/pdfExamples.ts`
3. Vérifier le changelog : `CHANGELOG_PDF.md`
