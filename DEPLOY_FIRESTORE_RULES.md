# Déploiement des règles Firestore

## Problème résolu

L'erreur "Missing or insufficient permissions" lors de la suppression d'établissements est causée par l'absence de règles Firestore pour la collection `audit-logs`.

## Solution

Les règles Firestore ont été mises à jour dans `firestore.rules` pour autoriser :

- ✅ **Lecture** : Uniquement les admins
- ✅ **Création** : Tous les utilisateurs authentifiés (pour le logging)
- ✅ **Mise à jour/Suppression** : Uniquement les super admins

## Déploiement requis

Pour que les changements prennent effet, vous devez déployer les nouvelles règles Firestore :

```bash
# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules

# OU déployer tout (rules + indexes)
firebase deploy --only firestore
```

## Vérification

Après le déploiement, vous pouvez vérifier que les règles sont bien appliquées :

1. Allez dans la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Firestore Database > Règles
4. Vérifiez que la section `audit-logs` est présente

## Alternative (si vous n'avez pas accès au déploiement)

Si vous ne pouvez pas déployer les règles maintenant, vous pouvez temporairement désactiver le logging en attendant :

**Option 1** : Ignorer les erreurs de logging (déjà implémenté)

- Le code ne bloque pas si le logging échoue
- L'établissement sera quand même supprimé
- Seule l'erreur dans la console sera visible

**Option 2** : Commenter le logging temporairement

- Ouvrir `src/features/establishments/services/establishmentDeletionService.ts`
- Commenter la ligne 208 : `// await logDeletionAction(...)`
