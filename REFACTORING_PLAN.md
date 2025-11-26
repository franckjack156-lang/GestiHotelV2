# PLAN DE REFACTORING COMPLET - GestiHotel V2

**Date**: 26 novembre 2025
**Status**: EN COURS
**Score actuel**: 60/100
**Objectif**: 85/100 en 3 mois

---

## ✅ PHASE 0 - FONDATIONS (FAIT - 26 nov)

### Fichiers créés

1. **`src/core/utils/logger.ts`** ✅
   - Logger centralisé avec niveaux (debug, info, warn, error)
   - Intégration Sentry automatique
   - Désactivation auto en production (sauf erreurs)
   - Support de contexte et timestamps

2. **`src/shared/utils/storeHelpers.ts`** ✅
   - `withLoading`: Wrapper async avec loading/error auto
   - `withRetry`: Retry avec backoff exponentiel
   - `with ErrorHandling`: Gestion erreurs avec fallback
   - `debounce` et `throttle` helpers

3. **`src/core/services/permissionService.ts`** ✅
   - Service centralisé de permissions
   - Cache pour performance
   - Support permissions custom
   - Méthodes: `hasPermission`, `checkPermission`, `isAdmin`, `isSuperAdmin`
   - Validation `canManageUser`, `canAssignRole`

---

## 🔄 PHASE 1 - NETTOYAGE CRITIQUE (À FAIRE)

### 1.1 - Remplacer tous les console.log par logger

**Commande de recherche:**
```bash
grep -r "console\.\(log\|warn\|error\|info\)" src/ --exclude-dir=node_modules | wc -l
# Résultat: 210+ occurrences
```

**Plan:**
- Créer script de remplacement automatique
- Passer fichier par fichier pour les cas complexes
- Valider que les contexts sont pertinents

**Script à créer:** `scripts/replace-console-logs.sh`

### 1.2 - Supprimer les 23 eslint-disable

**Fichiers concernés:**
```
src/features/dashboard/components/DashboardGrid.tsx
src/pages/Dashboard.tsx
src/features/dashboard/components/WidgetRenderer.tsx
src/features/dashboard/components/DashboardEditMode.tsx
... (19 autres)
```

**Actions:**
- Fixer les erreurs TypeScript sous-jacentes
- Corriger les `any` par des types appropriés
- Nettoyer les imports inutilisés
- Résoudre les problèmes de dépendances useEffect

### 1.3 - Nettoyer les 50+ TODO

**Stratégie:**
- Extraire tous les TODO: `grep -rn "TODO:" src/`
- Créer des issues GitHub pour chacun
- Supprimer les TODO du code
- Ajouter règle ESLint pour bloquer les nouveaux TODO

---

## 🔒 PHASE 2 - SÉCURITÉ (CRITIQUE)

### 2.1 - Durcir les Firestore Rules

**Problèmes identifiés:**

1. **Vulnérabilité création utilisateur** (firestore.rules:68):
```javascript
// AVANT (VULNÉRABLE)
allow create: if isAuthenticated() && (
  isOwner(userId) ||  // ⚠️ N'importe qui peut s'attribuer n'importe quel userId
  isAdmin()
);

// APRÈS (SÉCURISÉ)
allow create: if isAuthenticated() && (
  request.resource.data.id == request.auth.uid ||  // ✅ Force le bon userId
  isAdmin()
);
```

2. **Pas de validation des champs interventions**:
```javascript
// AJOUTER
match /interventions/{interventionId} {
  allow create: if isAuthenticated()
    && request.resource.data.keys().hasAll(['title', 'status', 'establishmentId', 'createdBy'])
    && request.resource.data.title is string
    && request.resource.data.title.size() >= 3
    && request.resource.data.title.size() <= 200
    && request.resource.data.status in ['pending', 'in_progress', 'completed', 'cancelled']
    && request.resource.data.createdBy == request.auth.uid  // ✅ Force le bon createdBy
    && request.resource.data.establishmentId is string;
}
```

3. **Implémenter rate limiting** (Firebase Functions):
   - Créer Cloud Function pour rate limiting
   - 100 actions/heure par utilisateur
   - Stockage dans Realtime Database avec TTL

### 2.2 - Validation Zod sur TOUS les formulaires

**Formulaires critiques à valider:**

1. **CreateInterventionForm**
2. **InterventionEditForm**
3. **UserCreateForm**
4. **UserEditForm**
5. **EstablishmentSettingsForm**
6. **LoginForm** / **SignupForm**

**Schémas Zod à créer:**
```typescript
// src/features/interventions/schemas/interventionSchemas.ts
export const createInterventionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['maintenance', 'repair', 'cleaning', 'other']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  roomId: z.string().optional(),
  assignedTo: z.string().optional(),
  // ... validation complète
});
```

---

## ⚡ PHASE 3 - PERFORMANCE

### 3.1 - Pagination Firestore

**Fichier:** `src/features/interventions/hooks/useInterventionsPaginated.ts` (À CRÉER)

```typescript
export const useInterventionsPaginated = (pageSize = 50) => {
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    const q = query(
      collection(db, 'interventions'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const newInterventions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setInterventions(prev => [...prev, ...newInterventions]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === pageSize);
  }, [lastDoc, pageSize]);

  return { interventions, loadMore, hasMore };
};
```

### 3.2 - Virtualisation des listes

**Installer:** `@tanstack/react-virtual`

**Fichiers à modifier:**
- `InterventionsPage.tsx` (liste interventions)
- `RoomsPages.tsx` (liste chambres)
- `UsersManagementSection.tsx` (liste utilisateurs)

### 3.3 - Optimiser usePermissions

**Problème actuel:** Les fonctions ne sont pas mémoïsées → re-renders inutiles

**Solution:**
```typescript
const hasPermission = useCallback(
  (permission: Permission): boolean => {
    return permissionService.hasPermission(user, permission);
  },
  [user?.id, user?.role, user?.customPermissions] // Dépendances précises
);
```

---

## 🧪 PHASE 4 - TESTS (CRITIQUE - Couverture < 5%)

### 4.1 - Tests Services (Semaines 1-2)

**Services à tester en priorité:**

1. **interventionService.ts** (1032 lignes) - 20 tests
   - `createIntervention`
   - `updateIntervention`
   - `deleteIntervention`
   - `getInterventions`
   - `subscribeToInterventions`

2. **authService.ts** - 15 tests
   - `loginWithEmail`
   - `signupWithEmail`
   - `logout`
   - `resetPassword`

3. **referenceListsService.ts** (1388 lignes) - 25 tests
   - `getReferenceList`
   - `updateReferenceList`
   - `updateInterventionsByReferenceChange`

**Objectif:** 40% de couverture

### 4.2 - Tests Hooks (Semaines 3-4)

1. **useInterventions** - 10 tests
2. **useAuth** - 8 tests
3. **usePermissions** - 12 tests (optimisé)
4. **useDashboard** - 8 tests

**Objectif:** 55% de couverture

### 4.3 - Tests Composants (Semaines 5-6)

1. **InterventionsPage** (refactoré < 300 lignes) - 15 tests
2. **InterventionForm** - 20 tests
3. **Dashboard** - 10 tests

**Objectif:** 70% de couverture

### 4.4 - Tests E2E (Semaines 7-8)

**À implémenter avec Playwright:**
1. Flow authentification (5 tests)
2. Flow création intervention (5 tests)
3. Flow planning (5 tests)
4. Flow gestion utilisateurs (3 tests)

---

## 📊 PHASE 5 - REFACTORING FICHIERS GIGANTESQUES

### Fichiers à découper

1. **InterventionsPage.tsx** (1555 → < 300 lignes)
```
src/pages/interventions/
  ├── InterventionsPage.tsx (< 200 lignes)
  ├── components/
  │   ├── KanbanView.tsx
  │   ├── TableView.tsx
  │   ├── InterventionFiltersBar.tsx
  │   ├── InterventionStats.tsx
  │   ├── BulkActionsToolbar.tsx
  │   └── InterventionQuickActions.tsx
```

2. **referenceListsService.ts** (1388 → < 400 lignes)
```
src/shared/services/referenceLists/
  ├── index.ts
  ├── referenceListsService.ts (core logic < 300 lignes)
  ├── updateInterventionsByReference.ts
  ├── referenceListsValidation.ts
  └── referenceListsCache.ts
```

3. **CreateInterventionPage.tsx** (1164 → < 300 lignes)
4. **PlanningPage.tsx** (1060 → < 300 lignes)

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Score Global Cible: 85/100

| Aspect | Actuel | Objectif | Poids |
|--------|--------|----------|-------|
| Architecture | 7/10 | 8.5/10 | 15% |
| Qualité du code | 6/10 | 9/10 | 20% |
| Performance | 6.5/10 | 9/10 | 15% |
| Sécurité | 7/10 | 9.5/10 | 20% |
| Tests | 3/10 | 8/10 | 20% |
| Dette technique | 4/10 | 8/10 | 10% |

### KPIs

- ✅ 0 console.log en production
- ✅ 0 TODO dans le code
- ✅ 0 eslint-disable
- ✅ 0 erreur TypeScript
- ✅ Couverture tests ≥ 70%
- ✅ Lighthouse score > 90
- ✅ LCP < 2.5s, FID < 100ms
- ✅ Bundle < 500KB
- ✅ Pas de fichier > 500 lignes

---

## 📅 TIMELINE

### Mois 1 (Décembre 2025)
- ✅ Semaine 1-2: Phase 0 (Fondations) + Phase 1 (Nettoyage)
- ✅ Semaine 3-4: Phase 2 (Sécurité) + Tests services critiques

### Mois 2 (Janvier 2026)
- ✅ Semaine 5-6: Phase 3 (Performance) + Tests hooks/composants
- ✅ Semaine 7-8: Phase 4 (Tests E2E) + Refactoring fichiers

### Mois 3 (Février 2026)
- ✅ Semaine 9-10: Phase 5 (Refactoring final) + Accessibilité
- ✅ Semaine 11-12: Documentation + Audit final

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

1. ✅ Commit fondations (logger, helpers, permissionService)
2. Remplacer console.log par logger (script automatique)
3. Fixer les 22 erreurs TypeScript
4. Supprimer les 23 eslint-disable
5. Sécuriser Firestore Rules
6. Créer schémas Zod pour formulaires critiques

**Temps estimé Phase 1:** 2 semaines (à temps plein)
**Date cible fin Phase 1:** 10 décembre 2025
