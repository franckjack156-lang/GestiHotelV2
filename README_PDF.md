# Export PDF - Guide rapide

## Installation

```bash
npm install jspdf jspdf-autotable @types/jspdf
```

## Utilisation

### 1. Export liste d'interventions

```typescript
import { generateInterventionsPDF, downloadPDF } from '@/shared/services/pdfService';

const blob = await generateInterventionsPDF(interventions, {
  title: 'Liste des interventions',
  subtitle: `${interventions.length} intervention(s)`,
  orientation: 'landscape',
});

downloadPDF(blob, 'interventions.pdf');
```

### 2. Export détail d'intervention

```typescript
import { generateInterventionDetailPDF, downloadPDF } from '@/shared/services/pdfService';

const blob = await generateInterventionDetailPDF(intervention, {
  title: `Intervention - ${intervention.title}`,
  subtitle: intervention.reference,
});

downloadPDF(blob, `intervention_${intervention.id}.pdf`);
```

### 3. Export rapport mensuel

```typescript
import { generateMonthlyReportPDF, downloadPDF } from '@/shared/services/pdfService';

const reportData = {
  period: 'Janvier 2024',
  totalInterventions: 150,
  completedInterventions: 120,
  pendingInterventions: 30,
  averageResolutionTime: 45,
  byStatus: { completed: 120, pending: 20, in_progress: 10 },
  byPriority: { high: 50, normal: 80, low: 20 },
  byType: { maintenance: 90, repair: 40, installation: 20 },
};

const blob = await generateMonthlyReportPDF(reportData, {
  title: 'Rapport mensuel',
  subtitle: 'Janvier 2024',
});

downloadPDF(blob, 'rapport_janvier_2024.pdf');
```

## Fonctionnalités

- ✅ Export liste d'interventions (tableau paysage)
- ✅ Export détail intervention (portrait)
- ✅ Rapport mensuel avec statistiques
- ✅ En-tête et pied de page personnalisables
- ✅ Logo optionnel
- ✅ Pagination automatique
- ✅ Styles professionnels

## Interface utilisateur

### InterventionsPage
Bouton "Exporter PDF" dans la barre d'actions (en haut à droite)

### InterventionDetailsPage
Option "Exporter PDF" dans le menu "..." (MoreVertical)

## Documentation complète

- **Guide complet :** `docs/PDF_GENERATION.md`
- **Guide UI :** `docs/PDF_UI_GUIDE.md`
- **Exemples :** `src/shared/services/pdfExamples.ts`
- **Implémentation :** `IMPLEMENTATION_PDF.md`
- **Changelog :** `CHANGELOG_PDF.md`
- **Récapitulatif :** `RECAPITULATIF_PDF.md`

## Fichiers créés

### Services
- `src/shared/services/pdfService.ts` (580 lignes)
- `src/shared/services/pdfExamples.ts` (220 lignes)

### Documentation
- `docs/PDF_GENERATION.md` (350 lignes)
- `docs/PDF_UI_GUIDE.md` (400 lignes)
- `IMPLEMENTATION_PDF.md` (260 lignes)
- `CHANGELOG_PDF.md` (200 lignes)
- `RECAPITULATIF_PDF.md` (350 lignes)
- `README_PDF.md` (ce fichier)

## Fichiers modifiés

- `src/pages/interventions/InterventionsPage.tsx` (ajout bouton export)
- `src/pages/interventions/InterventionDetailsPage.tsx` (implémentation export)

## Tests

✅ Compilation TypeScript sans erreurs
⬜ Tests manuels à effectuer (voir IMPLEMENTATION_PDF.md)

## Support

Pour toute question, consulter `docs/PDF_GENERATION.md` section "Dépannage".

---

**Implémenté le :** 29/11/2024
**Par :** Claude (Anthropic)
**Version :** 1.0
