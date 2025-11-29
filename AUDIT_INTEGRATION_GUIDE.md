# Guide d'intégration du système d'audit

## Vue d'ensemble

Le système d'audit logging a été implémenté pour tracer toutes les actions importantes dans l'application GestiHotel. Ce document explique comment intégrer l'audit dans vos services.

## Fichiers créés

### 1. Service d'audit

- **Fichier**: `src/shared/services/auditService.ts`
- **Fonctions principales**:
  - `logAction()` - Enregistrer une action
  - `getAuditLogs()` - Récupérer les logs avec filtres
  - `exportAuditLogs()` - Exporter les logs en CSV/JSON
  - `calculateChanges()` - Calculer les différences entre deux objets

### 2. Page d'administration

- **Fichier**: `src/pages/settings/AuditLogsPage.tsx`
- **URL**: `/app/settings/audit-logs`
- **Accès**: Réservé aux administrateurs (admin, super_admin, editor)

## Comment intégrer l'audit dans un service

### Exemple 1 : Audit pour création d'intervention

```typescript
import { logAction } from '@/shared/services/auditService';

export const createIntervention = async (
  establishmentId: string,
  userId: string,
  data: CreateInterventionData
): Promise<string> => {
  // ... votre logique de création ...

  const docRef = await addDoc(collectionRef, interventionData);

  // ✅ Logger l'action de création
  await logAction(establishmentId, {
    action: 'create',
    entityType: 'intervention',
    entityId: docRef.id,
    entityName: data.title,
    metadata: {
      priority: data.priority,
      category: data.category,
      isUrgent: data.isUrgent,
    },
  });

  return docRef.id;
};
```

### Exemple 2 : Audit pour mise à jour avec détection des changements

```typescript
import { logAction, calculateChanges } from '@/shared/services/auditService';

export const updateIntervention = async (
  establishmentId: string,
  interventionId: string,
  data: UpdateInterventionData
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

  // ✅ Récupérer les données avant modification
  const beforeSnapshot = await getDoc(docRef);
  const beforeData = beforeSnapshot.data();

  // Effectuer la mise à jour
  await updateDoc(docRef, updateData);

  // ✅ Récupérer les données après modification
  const afterSnapshot = await getDoc(docRef);
  const afterData = afterSnapshot.data();

  // ✅ Calculer et logger les changements
  const changes = calculateChanges(beforeData || {}, afterData || {});

  await logAction(establishmentId, {
    action: 'update',
    entityType: 'intervention',
    entityId: interventionId,
    entityName: afterData?.title,
    changes,
  });
};
```

### Exemple 3 : Audit pour suppression

```typescript
import { logAction } from '@/shared/services/auditService';

export const deleteIntervention = async (
  establishmentId: string,
  interventionId: string
): Promise<void> => {
  const docRef = doc(db, 'establishments', establishmentId, 'interventions', interventionId);

  // ✅ Récupérer les infos avant suppression
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();

  // Soft delete
  await updateDoc(docRef, { isDeleted: true, deletedAt: serverTimestamp() });

  // ✅ Logger la suppression
  await logAction(establishmentId, {
    action: 'delete',
    entityType: 'intervention',
    entityId: interventionId,
    entityName: data?.title,
    metadata: {
      reference: data?.reference,
      status: data?.status,
    },
  });
};
```

### Exemple 4 : Audit pour changement de permission

```typescript
import { logPermissionChange } from '@/shared/services/auditService';

export const updateUserRole = async (
  userId: string,
  oldRole: string,
  newRole: string,
  establishmentId: string
): Promise<void> => {
  // ... mise à jour du rôle ...

  // ✅ Logger le changement de permission
  await logPermissionChange(establishmentId, userId, oldRole, newRole);
};
```

### Exemple 5 : Audit pour login/logout

```typescript
import { logLogin, logLogout } from '@/shared/services/auditService';

// Dans authService.ts
export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Récupérer l'établissement de l'utilisateur
  const establishmentId = await getUserEstablishmentId(userCredential.user.uid);

  // ✅ Logger la connexion
  await logLogin(establishmentId);

  return userCredential.user;
};

export const logout = async (establishmentId: string) => {
  // ✅ Logger la déconnexion
  await logLogout(establishmentId);

  await signOut(auth);
};
```

### Exemple 6 : Audit pour export de données

```typescript
import { logExport } from '@/shared/services/auditService';

export const exportInterventions = async (
  establishmentId: string,
  filters: InterventionFilters,
  format: 'csv' | 'excel'
): Promise<Blob> => {
  // ... logique d'export ...

  // ✅ Logger l'export
  await logExport(establishmentId, 'intervention', {
    format,
    filters,
    count: data.length,
  });

  return blob;
};
```

## Types disponibles

### AuditAction

```typescript
type AuditAction =
  | 'create' // Création d'entité
  | 'update' // Modification d'entité
  | 'delete' // Suppression d'entité
  | 'restore' // Restauration depuis corbeille
  | 'login' // Connexion utilisateur
  | 'logout' // Déconnexion utilisateur
  | 'export' // Export de données
  | 'import' // Import de données
  | 'permission_change' // Changement de rôle/permissions
  | 'status_change' // Changement de statut
  | 'assignment' // Assignation à un utilisateur
  | 'bulk_update' // Modification en masse
  | 'bulk_delete'; // Suppression en masse
```

### AuditEntityType

```typescript
type AuditEntityType =
  | 'intervention'
  | 'room'
  | 'user'
  | 'establishment'
  | 'settings'
  | 'template'
  | 'supplier'
  | 'inventory'
  | 'reference_list'
  | 'notification'
  | 'report';
```

## Bonnes pratiques

### 1. Toujours logger les actions importantes

- ✅ Création, modification, suppression d'entités
- ✅ Changements de permissions ou de rôles
- ✅ Exports de données sensibles
- ✅ Connexions/déconnexions

### 2. Ne PAS logger

- ❌ Les consultations simples (GET)
- ❌ Les actions de l'interface (ouverture de menus, etc.)
- ❌ Les requêtes en temps réel (listeners)

### 3. Inclure des métadonnées pertinentes

```typescript
await logAction(establishmentId, {
  action: 'update',
  entityType: 'intervention',
  entityId: id,
  entityName: title,
  metadata: {
    // ✅ Informations utiles pour le contexte
    priority: 'urgent',
    category: 'plomberie',
    assignedTo: 'user123',
    // ❌ Éviter les données sensibles
    // password: '...',
    // apiKey: '...',
  },
});
```

### 4. Gérer les erreurs gracieusement

Le service d'audit est conçu pour ne jamais bloquer les opérations principales :

```typescript
try {
  await logAction(establishmentId, {...});
} catch (error) {
  // L'erreur est loggée mais n'interrompt pas le flux
  console.error('Erreur audit:', error);
}
```

## Visualisation des logs

### Accès à la page d'audit

1. Se connecter en tant qu'administrateur
2. Aller dans **Paramètres** > **Journal d'audit**
3. URL directe : `/app/settings/audit-logs`

### Fonctionnalités disponibles

- **Filtres** :
  - Par utilisateur
  - Par type d'action
  - Par type d'entité
  - Par période (date de début/fin)
  - Recherche textuelle

- **Export** :
  - Format CSV (pour Excel)
  - Format JSON (pour analyse)

- **Détails** :
  - Cliquer sur l'icône "œil" pour voir les détails complets
  - Visualiser les changements champ par champ
  - Consulter les métadonnées

## Sécurité et permissions

### Règles Firestore

Les logs d'audit sont protégés dans `firestore.rules` :

```
match /audit-logs/{logId} {
  // Lecture : Uniquement les admins
  allow read: if isAdmin();

  // Création : Tous les utilisateurs authentifiés
  allow create: if isAuthenticated();

  // Mise à jour et suppression : Seuls les super admins
  allow update, delete: if isSuperAdmin();
}
```

### Contrôle d'accès dans l'application

La page AuditLogsPage vérifie automatiquement les permissions :

```typescript
if (!['admin', 'super_admin', 'editor'].includes(currentUser.role)) {
  // Affiche un message d'accès refusé
}
```

## Migration des services existants

Pour ajouter l'audit à un service existant :

1. Importer le service d'audit :

```typescript
import { logAction, calculateChanges } from '@/shared/services/auditService';
```

2. Identifier les fonctions à auditer :
   - `create*` → action 'create'
   - `update*` → action 'update'
   - `delete*` → action 'delete'
   - Fonctions spéciales → actions appropriées

3. Ajouter les appels `logAction()` :
   - Après les opérations réussies
   - Avec les informations pertinentes

4. Tester en local et vérifier les logs dans `/app/settings/audit-logs`

## Roadmap

### Fonctionnalités à venir

- [ ] Dashboard analytics des logs
- [ ] Alertes sur actions suspectes
- [ ] Retention automatique des logs (archivage après X mois)
- [ ] API REST pour accès externe aux logs
- [ ] Logs d'audit pour les sous-collections (commentaires, photos, etc.)

### Services à intégrer

- [x] auditService.ts (créé)
- [x] AuditLogsPage.tsx (créée)
- [ ] interventionService.ts
- [ ] userService.ts
- [ ] authService.ts
- [ ] roomService.ts (si existe)
- [ ] establishmentService.ts

## Support

Pour toute question ou problème :

1. Consulter ce guide
2. Vérifier les logs de la console navigateur
3. Consulter la documentation Firebase
4. Créer un ticket de support si nécessaire

---

**Date de création** : 2025-01-XX
**Version** : 1.0
**Auteur** : Système d'audit GestiHotel
