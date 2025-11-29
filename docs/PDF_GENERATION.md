# Génération de rapports PDF

## Vue d'ensemble

Le système de génération de rapports PDF utilise **jsPDF** et **jspdf-autotable** pour créer des documents PDF professionnels avec :
- En-têtes personnalisables avec logo
- Tableaux formatés automatiquement
- Numérotation des pages
- Pieds de page
- Statistiques et résumés

## Installation

Les dépendances ont déjà été installées :

```bash
npm install jspdf jspdf-autotable @types/jspdf
```

## Services disponibles

### 1. Service PDF (`src/shared/services/pdfService.ts`)

Service principal pour générer des PDF avec jsPDF.

#### Fonctions disponibles

##### `generateInterventionsPDF(interventions, options)`

Génère un PDF avec la liste des interventions sous forme de tableau.

**Paramètres :**
- `interventions` : Array<Intervention> - Liste des interventions
- `options` : PDFOptions
  - `title` : string - Titre du document
  - `subtitle?` : string - Sous-titre optionnel
  - `orientation?` : 'portrait' | 'landscape' - Orientation (défaut: landscape)
  - `logo?` : string - URL ou data URL du logo

**Retour :** Promise<Blob>

**Exemple :**
```typescript
import { generateInterventionsPDF, downloadPDF } from '@/shared/services/pdfService';

const handleExport = async () => {
  const blob = await generateInterventionsPDF(interventions, {
    title: 'Liste des interventions',
    subtitle: `${interventions.length} intervention(s)`,
    orientation: 'landscape',
  });

  downloadPDF(blob, 'interventions.pdf');
};
```

##### `generateInterventionDetailPDF(intervention, options)`

Génère un PDF détaillé pour une intervention spécifique.

**Paramètres :**
- `intervention` : Intervention - L'intervention à exporter
- `options` : PDFOptions

**Retour :** Promise<Blob>

**Exemple :**
```typescript
const blob = await generateInterventionDetailPDF(intervention, {
  title: `Intervention - ${intervention.title}`,
  subtitle: intervention.reference,
});

downloadPDF(blob, `intervention_${intervention.id}.pdf`);
```

##### `generateMonthlyReportPDF(data, options)`

Génère un rapport mensuel avec statistiques.

**Paramètres :**
- `data` : MonthlyReportData
  - `period` : string - Période du rapport
  - `totalInterventions` : number
  - `completedInterventions` : number
  - `pendingInterventions` : number
  - `averageResolutionTime` : number (en minutes)
  - `byStatus` : Record<string, number>
  - `byPriority` : Record<string, number>
  - `byType` : Record<string, number>
  - `topTechnicians?` : Array<{ name: string; count: number }>
  - `topLocations?` : Array<{ location: string; count: number }>
- `options` : PDFOptions

**Retour :** Promise<Blob>

**Exemple :**
```typescript
const reportData: MonthlyReportData = {
  period: 'Janvier 2024',
  totalInterventions: 150,
  completedInterventions: 120,
  pendingInterventions: 30,
  averageResolutionTime: 45,
  byStatus: {
    completed: 120,
    pending: 20,
    in_progress: 10,
  },
  byPriority: {
    high: 50,
    normal: 80,
    low: 20,
  },
  byType: {
    maintenance: 90,
    repair: 40,
    installation: 20,
  },
  topTechnicians: [
    { name: 'Jean Dupont', count: 45 },
    { name: 'Marie Martin', count: 38 },
  ],
};

const blob = await generateMonthlyReportPDF(reportData, {
  title: 'Rapport mensuel',
  subtitle: 'Janvier 2024',
});

downloadPDF(blob, 'rapport_janvier_2024.pdf');
```

##### `downloadPDF(blob, filename)`

Utilitaire pour télécharger un blob PDF.

**Paramètres :**
- `blob` : Blob - Le blob PDF
- `filename` : string - Nom du fichier (avec ou sans extension .pdf)

### 2. Service de rapports HTML/PDF (`src/shared/services/pdfReportService.ts`)

Service pour générer des rapports configurables et planifiés (génère du HTML pour conversion PDF côté serveur).

## Intégration dans les pages

### InterventionsPage

Bouton "Exporter PDF" ajouté dans la barre d'actions :

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={handleExportPDF}
  disabled={filteredInterventions.length === 0}
>
  <FileDown className="h-4 w-4" />
  <span className="hidden sm:inline ml-2">Exporter PDF</span>
</Button>
```

### InterventionDetailsPage

Option "Exporter PDF" dans le menu actions (MoreVertical) :

```typescript
<DropdownMenuItem onClick={handleExportPDF}>
  <Download className="mr-2 h-4 w-4" />
  Exporter PDF
</DropdownMenuItem>
```

## Structure du PDF généré

### En-tête
- Logo (si fourni)
- Titre du document
- Sous-titre
- Date de génération
- Ligne de séparation

### Corps
- **Liste d'interventions** : Tableau avec colonnes (Réf, Titre, Statut, Priorité, Type, Localisation, Assigné à, Date)
- **Détail intervention** : Sections (Informations générales, Assignation, Notes)
- **Rapport mensuel** : Statistiques, graphiques en barres, top techniciens

### Pied de page
- Numéro de page
- "Généré avec GestiHotel"

## Personnalisation

### Couleurs

Les couleurs sont définies dans le fichier `pdfService.ts` :

```typescript
const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};
```

### Ajouter un logo

Pour ajouter un logo dans le PDF :

```typescript
const logo = 'data:image/png;base64,...'; // ou URL

const blob = await generateInterventionsPDF(interventions, {
  title: 'Mon rapport',
  logo: logo,
});
```

### Labels personnalisés

Les labels des statuts, priorités et types sont définis dans des constantes :

```typescript
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  // ...
};
```

## Limitations

- Les images des interventions ne sont pas incluses dans le PDF (à implémenter si nécessaire)
- Le logo doit être une URL accessible ou une data URL
- La génération est côté client (peut être lente pour de grandes listes > 500 interventions)

## Améliorations futures

1. **Ajouter les photos** : Inclure les photos des interventions dans le PDF détaillé
2. **Graphiques avancés** : Utiliser une bibliothèque de graphiques pour des visualisations plus riches
3. **Templates personnalisables** : Permettre aux utilisateurs de choisir des templates
4. **Génération côté serveur** : Pour de meilleures performances avec de grandes quantités de données
5. **Signature électronique** : Permettre la signature des rapports d'intervention

## Dépannage

### Le PDF ne se télécharge pas

Vérifiez que le blob est bien généré et que les permissions du navigateur autorisent les téléchargements.

### Les caractères spéciaux ne s'affichent pas

jsPDF utilise des polices limitées par défaut. Pour supporter tous les caractères Unicode, il faut ajouter des polices personnalisées.

### Le tableau dépasse la page

Utilisez l'orientation 'landscape' pour les tableaux larges :

```typescript
generateInterventionsPDF(interventions, {
  orientation: 'landscape',
});
```

## Ressources

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jspdf-autotable Documentation](https://github.com/simonbengtsson/jsPDF-AutoTable)
