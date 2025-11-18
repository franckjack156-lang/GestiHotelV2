# 🔍 Debug des Listes de Référence

Ce fichier explique comment utiliser les fonctions de logging pour déboguer et analyser les listes de référence.

## 📋 Fonctions disponibles

### 1. `logListsSummary(establishmentId)`

Affiche un résumé **détaillé** de toutes les listes avec :
- Nombre total de listes
- Statistiques globales (items totaux, actifs, inactifs)
- Détail par liste avec badges (système, personnalisable, vide)
- Items de chaque liste (jusqu'à 10 items)

**Utilisation dans le code :**

```typescript
import referenceListsService from '@/shared/services/referenceListsService';

// Dans une fonction async
await referenceListsService.logListsSummary('establishment-id');
```

**Utilisation depuis React :**

```typescript
import { useReferenceListsDebug } from '@/shared/hooks/useReferenceLists';

function MyComponent() {
  const { logSummary } = useReferenceListsDebug();

  const handleDebug = async () => {
    await logSummary();
  };

  return <button onClick={handleDebug}>Afficher résumé</button>;
}
```

**Utilisation depuis la console du navigateur :**

```javascript
// Importer le service
const service = await import('/src/shared/services/referenceListsService.ts');

// Logger le résumé
await service.logListsSummary('your-establishment-id');
```

### 2. `logListsCompact(establishmentId)`

Affiche une vue **compacte** (une ligne par liste) avec :
- Nom de la clé
- Nombre d'items
- Badges (🔒 système, ✏️ personnalisable, 📭 vide)

**Utilisation :**

```typescript
import referenceListsService from '@/shared/services/referenceListsService';

await referenceListsService.logListsCompact('establishment-id');
```

**Depuis React :**

```typescript
const { logCompact } = useReferenceListsDebug();
await logCompact();
```

## 🎯 Cas d'usage

### Vérifier les listes après synchronisation

```typescript
// Dans ReferenceListsOrchestrator
const handleSync = async () => {
  await syncLists();
  // Vérifier le résultat
  await referenceListsService.logListsSummary(establishmentId);
};
```

### Comparer deux établissements

```typescript
await referenceListsService.logListsCompact('establishment-1');
await referenceListsService.logListsCompact('establishment-2');
```

### Débugger depuis la console (dev mode)

```javascript
// Dans la console du navigateur (F12)
window.debugReferenceLists = async (estId) => {
  const service = await import('/src/shared/services/referenceListsService.ts');
  await service.default.logListsSummary(estId);
};

// Puis appeler :
await window.debugReferenceLists('your-establishment-id');
```

## 📊 Exemple de sortie

### Vue détaillée (`logListsSummary`)

```
🔍 ========================================
📊 RÉSUMÉ DES LISTES - Établissement: abc123
==========================================

📋 Nombre total de listes: 19
📅 Dernière modification: Mon Jan 15 2025 10:30:00
👤 Modifié par: user123
🔢 Version: 5

📈 STATISTIQUES GLOBALES:
   • Items totaux: 45
   • Items actifs: 42
   • Items inactifs: 3
   • Listes système: 4
   • Listes personnalisables: 15
   • Listes vides: 10

📝 DÉTAIL PAR LISTE:

1. Types d'interventions (interventionTypes)
   ✏️ PERSONNALISABLE 📭 VIDE
   📊 Items: 0 total | 0 actifs | 0 inactifs

2. Priorités (interventionPriorities)
   🔒 SYSTÈME ⚠️ REQUIS
   📊 Items: 3 total | 3 actifs | 0 inactifs
   📌 Items:
      ✅ Basse [green] {ArrowDown}
      ✅ Normale [blue] {Circle}
      ✅ Urgente [red] {AlertCircle} (utilisé 25 fois)

...
```

### Vue compacte (`logListsCompact`)

```
📋 [abc123] 19 listes:
   1. buildings                   (0 items) ✏️ 📭
   2. equipmentBrands             (0 items) ✏️ 📭
   3. equipmentLocations          (0 items) ✏️ 📭
   4. equipmentTypes              (0 items) ✏️ 📭
   5. interventionCategories      (5 items) 🔒
   6. interventionPriorities      (3 items) 🔒
   7. interventionStatuses        (4 items) 🔒
   8. interventionTypes           (0 items) ✏️ 📭
   ...
```

## 🛠️ Ajouter un bouton de debug dans l'UI

Pour faciliter le debug pendant le développement :

```typescript
// Dans ReferenceListsOrchestrator.tsx
import { useReferenceListsDebug } from '@/shared/hooks/useReferenceLists';

export const ReferenceListsOrchestrator = () => {
  const { logSummary, logCompact } = useReferenceListsDebug();

  return (
    <div>
      {/* ... votre UI existante ... */}

      {/* Boutons de debug (à retirer en production) */}
      {import.meta.env.DEV && (
        <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200">
          <Button onClick={logCompact} variant="outline" size="sm">
            📋 Log Compact
          </Button>
          <Button onClick={logSummary} variant="outline" size="sm">
            🔍 Log Détaillé
          </Button>
        </div>
      )}
    </div>
  );
};
```

## 💡 Tips

1. **Utiliser `logCompact` en premier** pour avoir une vue d'ensemble rapide
2. **Utiliser `logSummary` pour investiguer** un problème spécifique
3. **Copier les logs** dans un fichier texte pour comparer avant/après
4. **Automatiser le logging** après certaines opérations critiques (sync, import)

## 🚀 En production

⚠️ **Important** : Ces fonctions de logging sont conçues pour le développement. En production :

- Ne pas appeler automatiquement (perf)
- Garder disponibles pour support client si besoin
- Utiliser uniquement via console ou bouton caché
- Considérer l'ajout d'un flag admin pour les activer
