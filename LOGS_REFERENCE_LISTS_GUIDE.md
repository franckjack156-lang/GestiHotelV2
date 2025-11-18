# 📊 Guide des Logs pour les Listes de Référence

## 🎯 Objectif

Ce guide explique comment utiliser les nouveaux outils de logging pour afficher un résumé détaillé de toutes les listes de référence par établissement.

---

## 🚀 Méthodes d'utilisation

### Méthode 1 : Via l'interface utilisateur (UI)

1. **Accédez aux paramètres** : Allez dans **Paramètres > Listes de référence**
2. **Ouvrez le menu Actions** : Cliquez sur le bouton "Actions" (avec l'icône ⋮)
3. **Choisissez un type de log** :
   - **Log compact** : Vue rapide avec une ligne par liste
   - **Log détaillé** : Vue complète avec tous les détails et items

4. **Consultez la console** : Ouvrez la console du navigateur (F12) pour voir les résultats

---

### Méthode 2 : Depuis la console du navigateur

#### Option A : Utiliser les fonctions globales (en mode dev)

```javascript
// Afficher un log compact
await window.debugReferenceLists.logCompact('your-establishment-id');

// Afficher un log détaillé
await window.debugReferenceLists.logSummary('your-establishment-id');

// Exécuter tous les tests
await window.debugReferenceLists.test('your-establishment-id');
```

#### Option B : Importer directement le service

```javascript
// Importer le service
const service = await import('/src/shared/services/referenceListsService.ts');

// Log compact
await service.logListsCompact('your-establishment-id');

// Log détaillé
await service.logListsSummary('your-establishment-id');
```

---

### Méthode 3 : Dans le code React

```typescript
import { useReferenceListsDebug } from '@/shared/hooks/useReferenceLists';

function MyComponent() {
  const { logSummary, logCompact, establishmentId } = useReferenceListsDebug();

  const handleDebug = async () => {
    // Log compact
    await logCompact();

    // Ou log détaillé
    await logSummary();
  };

  return (
    <button onClick={handleDebug}>
      Afficher les logs
    </button>
  );
}
```

---

## 📋 Exemples de sortie

### Log Compact

```
📋 [establishment-123] 19 listes:
   1. buildings                   (0 items) ✏️ 📭
   2. equipmentBrands             (0 items) ✏️ 📭
   3. equipmentLocations          (0 items) ✏️ 📭
   4. interventionCategories      (5 items) 🔒
   5. interventionPriorities      (3 items) 🔒
   6. interventionStatuses        (4 items) 🔒
   7. interventionTypes           (8 items) ✏️
   ...
```

**Légende** :
- 🔒 = Liste système (non modifiable)
- ✏️ = Liste personnalisable
- 📭 = Liste vide

---

### Log Détaillé

```
🔍 ========================================
📊 RÉSUMÉ DES LISTES - Établissement: establishment-123
==========================================

📋 Nombre total de listes: 19
📅 Dernière modification: Mon Jan 15 2025 10:30:00
👤 Modifié par: user-456
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
   ✏️ PERSONNALISABLE
   📊 Items: 8 total | 8 actifs | 0 inactifs
   📌 Items:
      ✅ Plomberie [blue] {Droplet} (utilisé 15 fois)
      ✅ Électricité [yellow] {Zap} (utilisé 23 fois)
      ✅ Chauffage [orange] {Flame} (utilisé 8 fois)
      ...

2. Priorités (interventionPriorities)
   🔒 SYSTÈME ⚠️ REQUIS
   📊 Items: 3 total | 3 actifs | 0 inactifs
   📌 Items:
      ✅ Basse [green] {ArrowDown}
      ✅ Normale [blue] {Circle}
      ✅ Urgente [red] {AlertCircle} (utilisé 25 fois)

...

==========================================
✅ Résumé terminé
```

---

## 🔍 Cas d'usage pratiques

### 1. Vérifier le nombre de listes après synchronisation

```typescript
// Après avoir cliqué sur "Synchroniser les listes"
await window.debugReferenceLists.logCompact('establishment-id');
```

### 2. Comparer deux établissements

```typescript
console.log('=== ÉTABLISSEMENT 1 ===');
await window.debugReferenceLists.logCompact('establishment-1');

console.log('\n=== ÉTABLISSEMENT 2 ===');
await window.debugReferenceLists.logCompact('establishment-2');
```

### 3. Investiguer un problème d'import

```typescript
// Avant l'import
await window.debugReferenceLists.logSummary('establishment-id');

// ... effectuer l'import ...

// Après l'import
await window.debugReferenceLists.logSummary('establishment-id');
```

### 4. Vérifier les listes vides

```typescript
// Le log détaillé affiche un badge 📭 pour les listes vides
await window.debugReferenceLists.logSummary('establishment-id');
// Cherchez les badges 📭 VIDE dans la sortie
```

---

## 💡 Conseils

1. **Utilisez `logCompact` en premier** pour avoir une vue d'ensemble rapide
2. **Utilisez `logSummary` pour investiguer** un problème spécifique
3. **Copiez les logs dans un fichier texte** pour comparer avant/après une opération
4. **En production** : Ces outils restent disponibles mais ne sont pas activés automatiquement

---

## 📚 Documentation détaillée

Pour plus d'informations techniques, consultez :
- [src/shared/services/DEBUG_REFERENCE_LISTS.md](src/shared/services/DEBUG_REFERENCE_LISTS.md)

---

## 🐛 Troubleshooting

### "window.debugReferenceLists is not defined"

**Solution** : Cela signifie que vous n'êtes pas en mode développement. Utilisez l'import direct :

```javascript
const service = await import('/src/shared/services/referenceListsService.ts');
await service.logListsCompact('your-id');
```

### "Aucune liste trouvée pour cet établissement"

**Solution** :
1. Vérifiez que l'ID de l'établissement est correct
2. Vérifiez que les listes ont été initialisées (cliquez sur "Synchroniser les listes")

### Les logs ne s'affichent pas

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreur dans la console
3. Essayez de rafraîchir la page (F5)

---

## ✅ Résumé

Vous disposez maintenant de 3 façons d'afficher les logs :

1. ✨ **Via l'UI** : Menu Actions > Log compact/détaillé
2. 🔧 **Via la console** : `window.debugReferenceLists.logSummary(id)`
3. 💻 **Dans le code** : Hook `useReferenceListsDebug`

Ces outils vous permettent de :
- ✅ Vérifier le nombre de listes par établissement
- ✅ Voir les détails de chaque liste
- ✅ Identifier les listes vides
- ✅ Comparer plusieurs établissements
- ✅ Déboguer les problèmes d'import/synchronisation

Bon debugging ! 🚀
