# Guide de Traduction GestiHôtel

## 📁 Fichiers de traduction

Les traductions se trouvent dans:
- `src/shared/i18n/locales/fr.json` (Français - référence)
- `src/shared/i18n/locales/en.json` (Anglais)
- `src/shared/i18n/locales/es.json` (Espagnol)

## 🔧 Comment utiliser les traductions dans vos composants

### 1. Importer le hook useTranslation

```tsx
import { useTranslation } from 'react-i18next';

export const MonComposant = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('interventions.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### 2. Structure des clés de traduction

Les clés sont organisées par section:

- `nav.*` - Menu de navigation
- `header.*` - En-tête
- `dashboard.*` - Tableau de bord
- `interventions.*` - Page interventions
- `rooms.*` - Page chambres
- `planning.*` - Planning
- `notifications.*` - Notifications
- `settings.*` - Paramètres
- `users.*` - Utilisateurs
- `establishments.*` - Établissements
- `common.*` - Boutons/labels communs
- `footer.*` - Pied de page
- `validation.*` - Messages de validation

### 3. Traductions avec variables

```tsx
// Dans le JSON:
{
  "validation": {
    "min_length": "Minimum {{count}} caractères"
  }
}

// Dans le code:
t('validation.min_length', { count: 5 })
// Résultat: "Minimum 5 caractères"
```

## 📝 Pages à traduire

### Priorité HAUTE (navigation principale)

1. **Dashboard** (`src/pages/Dashboard.tsx`)
   - Importer `useTranslation`
   - Remplacer les titres par `t('dashboard.title')`
   - Remplacer les boutons par `t('common.xxx')`

2. **Interventions** (`src/pages/interventions/*.tsx`)
   - `InterventionsPage.tsx` → `t('interventions.title')`
   - `CreateInterventionPage.tsx` → `t('interventions.create')`
   - Labels de formulaire → `t('interventions.status')`, etc.

3. **Chambres** (`src/pages/rooms/*.tsx`)
   - Même logique que interventions

4. **Planning** (`src/pages/PlanningPage.tsx`)

5. **Notifications** (`src/pages/NotificationCenterPage.tsx`)

### Priorité MOYENNE

6. **Settings** (`src/pages/Settings.tsx`)
   - Déjà partiellement traduit
   - Compléter les labels manquants

7. **Utilisateurs** (`src/pages/users/*.tsx`)

8. **Établissements** (`src/pages/establishments/*.tsx`)

## 🎯 Exemple complet

### AVANT (non traduit):
```tsx
export const InterventionsPage = () => {
  return (
    <div>
      <h1>Liste des interventions</h1>
      <button>Créer une intervention</button>
      <button>Exporter</button>
    </div>
  );
};
```

### APRÈS (traduit):
```tsx
import { useTranslation } from 'react-i18next';

export const InterventionsPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('interventions.list')}</h1>
      <button>{t('interventions.create')}</button>
      <button>{t('common.export')}</button>
    </div>
  );
};
```

## ✅ Checklist par page

Pour chaque page à traduire:

- [ ] Importer `import { useTranslation } from 'react-i18next'`
- [ ] Ajouter `const { t } = useTranslation()`
- [ ] Remplacer les **titres** par `t('section.title')`
- [ ] Remplacer les **boutons** par `t('common.xxx')`
- [ ] Remplacer les **labels** par `t('section.label')`
- [ ] Remplacer les **placeholders** par `t('section.placeholder')`
- [ ] Remplacer les **messages d'erreur** par `t('validation.xxx')`
- [ ] Tester en changeant de langue dans les paramètres

## 🌍 Ajouter une nouvelle traduction

Si une clé n'existe pas encore:

1. Ajoutez-la dans `fr.json`:
```json
{
  "interventions": {
    "assigned_by": "Assigné par"
  }
}
```

2. Ajoutez la même clé dans `en.json` et `es.json`

3. Utilisez-la: `t('interventions.assigned_by')`

## 🚀 État actuel

✅ **Traduit:**
- Sidebar (menu navigation)
- Header (recherche, profil, déconnexion)
- Footer

❌ **À traduire:**
- Dashboard
- Pages Interventions
- Pages Chambres
- Planning
- Notifications
- Pages Utilisateurs
- Pages Établissements
- Paramètres (compléter)
- Composants de formulaires
- Messages toast/notifications

---

**Note:** Le système i18n est déjà configuré. Il suffit d'importer `useTranslation` et d'utiliser `t('cle.traduction')` partout où il y a du texte en dur!
