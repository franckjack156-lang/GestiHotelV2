# Quick Start - Système d'Audit Logging

## 🚀 Démarrage rapide

Le système d'audit a été installé avec succès ! Voici comment l'utiliser immédiatement.

## 📍 Accès à la page d'audit

### URL

```
/app/settings/audit-logs
```

### Navigation

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Paramètres**
3. Cliquez sur **Journal d'audit** (ou accédez directement via l'URL)

### Permissions requises

- Rôles autorisés : `admin`, `super_admin`, `editor`
- Les autres utilisateurs verront un message d'accès refusé

## 💻 Utilisation dans le code

### Option 1 : Dans un composant React (recommandé)

```typescript
import { useAuditLog } from '@/shared/hooks/useAuditLog';

export const MyComponent = () => {
  const { logCreate, logUpdate, logDelete } = useAuditLog();

  const handleCreate = async () => {
    // Votre logique de création
    const id = await createSomething(data);

    // Logger l'action
    await logCreate('intervention', id, 'Nom de l\'intervention');
  };

  const handleUpdate = async () => {
    // Récupérer les données avant
    const oldData = await getSomething(id);

    // Effectuer la mise à jour
    await updateSomething(id, newData);

    // Récupérer les données après
    const updatedData = await getSomething(id);

    // Logger avec détection auto des changements
    await logUpdate('intervention', id, 'Nom', oldData, updatedData);
  };

  const handleDelete = async () => {
    // Votre logique de suppression
    await deleteSomething(id);

    // Logger la suppression
    await logDelete('intervention', id, 'Nom de l\'intervention');
  };

  return (/* ... */);
};
```

### Option 2 : Dans un service

```typescript
import { logAction, calculateChanges } from '@/shared/services/auditService';

export const createIntervention = async (
  establishmentId: string,
  data: CreateInterventionData
): Promise<string> => {
  // Créer l'intervention
  const docRef = await addDoc(collectionRef, interventionData);

  // Logger la création
  await logAction(establishmentId, {
    action: 'create',
    entityType: 'intervention',
    entityId: docRef.id,
    entityName: data.title,
    metadata: {
      priority: data.priority,
      category: data.category,
    },
  });

  return docRef.id;
};
```

## 🎯 Actions rapides

### Logger une connexion

```typescript
import { logLogin } from '@/shared/services/auditService';

await logLogin(establishmentId);
```

### Logger une déconnexion

```typescript
import { logLogout } from '@/shared/services/auditService';

await logLogout(establishmentId);
```

### Logger un changement de permission

```typescript
import { logPermissionChange } from '@/shared/services/auditService';

await logPermissionChange(establishmentId, userId, 'user', 'admin');
```

### Logger un export

```typescript
import { logExport } from '@/shared/services/auditService';

await logExport(establishmentId, 'intervention', {
  format: 'csv',
  count: 100,
});
```

## 📊 Types disponibles

### Types d'actions

- `'create'` - Création
- `'update'` - Modification
- `'delete'` - Suppression
- `'restore'` - Restauration
- `'login'` - Connexion
- `'logout'` - Déconnexion
- `'export'` - Export
- `'import'` - Import
- `'permission_change'` - Changement de permission
- `'status_change'` - Changement de statut
- `'assignment'` - Assignation
- `'bulk_update'` - Modification en masse
- `'bulk_delete'` - Suppression en masse

### Types d'entités

- `'intervention'`
- `'room'`
- `'user'`
- `'establishment'`
- `'settings'`
- `'template'`
- `'supplier'`
- `'inventory'`
- `'reference_list'`
- `'notification'`
- `'report'`

## 🔍 Recherche et filtres

Dans la page `/app/settings/audit-logs`, vous pouvez :

1. **Rechercher** par :
   - Email de l'utilisateur
   - Nom de l'utilisateur
   - ID de l'entité
   - Nom de l'entité

2. **Filtrer** par :
   - Type d'action
   - Type d'entité
   - Date de début
   - Date de fin
   - Limite de résultats (25, 50, 100, 200)

3. **Exporter** les résultats en :
   - CSV (pour Excel)
   - JSON

4. **Voir les détails** :
   - Cliquer sur l'icône "œil" pour voir les changements détaillés

## ⚙️ Configuration Firestore

### Règles de sécurité

Les règles suivantes sont déjà configurées dans `firestore.rules` :

```javascript
match /audit-logs/{logId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated();
  allow update, delete: if isSuperAdmin();
}
```

### Index recommandés

Pour optimiser les performances, créez ces index dans la console Firebase :

1. **Collection** : `audit-logs`
   - `establishmentId` (Asc) + `timestamp` (Desc)

2. **Collection** : `audit-logs`
   - `establishmentId` (Asc) + `action` (Asc) + `timestamp` (Desc)

3. **Collection** : `audit-logs`
   - `establishmentId` (Asc) + `entityType` (Asc) + `timestamp` (Desc)

4. **Collection** : `audit-logs`
   - `establishmentId` (Asc) + `userId` (Asc) + `timestamp` (Desc)

## 📚 Documentation complète

Pour plus d'informations, consultez :

- **Guide d'intégration** : `AUDIT_INTEGRATION_GUIDE.md`
- **Résumé du système** : `AUDIT_SYSTEM_SUMMARY.md`
- **Changelog** : `CHANGELOG_AUDIT_SYSTEM.md`

## ❓ FAQ

### Q: L'audit va-t-il ralentir mon application ?

**R:** Non, le logging est asynchrone et ne bloque jamais les opérations principales. En cas d'erreur, le log échoue silencieusement sans impacter l'utilisateur.

### Q: Combien de temps sont conservés les logs ?

**R:** Actuellement, ils sont conservés indéfiniment. Vous pouvez implémenter une politique de rétention si nécessaire.

### Q: Puis-je modifier ou supprimer un log ?

**R:** Seuls les super_admin peuvent modifier ou supprimer les logs. C'est une protection contre la manipulation de l'historique.

### Q: L'adresse IP est-elle enregistrée ?

**R:** Pas encore. L'IP nécessite l'implémentation côté serveur (Cloud Functions). Pour le moment, seul le User Agent est collecté.

### Q: Comment tester le système ?

**R:**

1. Créez une intervention ou modifiez un utilisateur
2. Allez sur `/app/settings/audit-logs`
3. Vous devriez voir les actions dans la liste

## 🎓 Exemple complet

```typescript
import { useAuditLog } from '@/shared/hooks/useAuditLog';
import { toast } from 'sonner';

export const InterventionForm = () => {
  const { logCreate, logUpdate, logDelete } = useAuditLog();

  const handleSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        // Mode édition
        const oldIntervention = await getIntervention(id);
        await updateIntervention(id, data);
        const newIntervention = await getIntervention(id);

        await logUpdate(
          'intervention',
          id,
          data.title,
          oldIntervention,
          newIntervention,
          { reason: 'User update via form' }
        );

        toast.success('Intervention mise à jour');
      } else {
        // Mode création
        const id = await createIntervention(data);

        await logCreate(
          'intervention',
          id,
          data.title,
          { priority: data.priority, category: data.category }
        );

        toast.success('Intervention créée');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    try {
      const intervention = await getIntervention(id);

      await deleteIntervention(id);

      await logDelete(
        'intervention',
        id,
        intervention.title,
        { reason: 'User deletion', reference: intervention.reference }
      );

      toast.success('Intervention supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Vos champs de formulaire */}
    </form>
  );
};
```

## 🚨 Important

- ✅ Toujours logger APRÈS le succès de l'opération
- ✅ Inclure des métadonnées utiles pour le contexte
- ✅ Ne jamais logger de données sensibles (mots de passe, clés API, etc.)
- ✅ Le logging ne doit JAMAIS bloquer le flux principal

## 🎉 C'est tout !

Le système d'audit est maintenant prêt à l'emploi. Commencez par tester la page `/app/settings/audit-logs` puis intégrez progressivement l'audit dans vos services.

Bon logging ! 📝

---

**Version** : 1.0.0
**Date** : 29 Novembre 2025
