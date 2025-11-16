# Guide de la Messagerie Interne

## Vue d'ensemble

Le système de messagerie interne permet aux utilisateurs d'un établissement de communiquer en temps réel. Il supporte les conversations directes (1-1), les groupes, et les discussions liées aux interventions.

## Architecture

### Structure des données

```
conversations/
  {conversationId}/
    - type: 'direct' | 'group' | 'intervention'
    - participantIds: string[]
    - participants: ConversationParticipant[]
    - lastMessage: { content, senderId, senderName, createdAt }
    - unreadCount: Record<userId, number>
    - establishmentId: string
    - interventionId?: string (si lié à une intervention)

messages/
  {messageId}/
    - conversationId: string
    - type: 'text' | 'file' | 'image' | 'system'
    - content: string
    - senderId: string
    - senderName: string
    - readBy: string[]
    - attachments?: Attachment[]
    - reactions?: MessageReaction[]
    - replyTo?: { messageId, content, senderName }
```

### Composants principaux

#### 1. **MessagingPage** ([MessagingPage.tsx](src/pages/MessagingPage.tsx))
Page principale avec layout split-screen :
- Sidebar gauche : Liste des conversations
- Zone principale : Fenêtre de chat
- Dialog : Nouvelle conversation

**Features :**
- ✅ Temps réel via Firestore subscriptions
- ✅ Marquer messages comme lus automatiquement
- ✅ Chargement utilisateurs de l'établissement
- ✅ Protection par feature flag `internalChat`

#### 2. **ConversationList** ([ConversationList.tsx](src/features/messaging/components/ConversationList.tsx))
Liste des conversations avec :
- Avatar de l'interlocuteur
- Dernier message
- Heure du dernier message
- Compteur de messages non lus
- Bouton "Nouvelle conversation"

#### 3. **ChatWindow** ([ChatWindow.tsx](src/features/messaging/components/ChatWindow.tsx))
Fenêtre de discussion affichant :
- En-tête avec nom conversation et participants
- Liste des messages (scroll infini)
- Indicateurs de lecture
- Support des pièces jointes
- Réactions aux messages

#### 4. **MessageInput** ([MessageInput.tsx](src/features/messaging/components/MessageInput.tsx))
Zone de saisie avec :
- Textarea auto-expand
- Upload de fichiers
- Mentions (@utilisateur)
- Émojis
- Réponse à un message

#### 5. **NewConversationDialog** ([NewConversationDialog.tsx](src/features/messaging/components/NewConversationDialog.tsx))
Dialog pour créer une nouvelle conversation :
- Sélection du type (direct, groupe)
- Recherche et sélection d'utilisateurs
- Nom du groupe (si groupe)
- Lien avec une intervention (optionnel)

### Services

#### **messageService.ts** ([messageService.ts](src/features/messaging/services/messageService.ts))

**Conversations :**
```typescript
// Créer une conversation
createConversation(establishmentId, userId, data)

// Obtenir ou créer une conversation directe
getOrCreateDirectConversation(establishmentId, userId1, userId2)

// Écouter les conversations en temps réel
subscribeToConversations(establishmentId, userId, callback)

// Marquer comme lue
markConversationAsRead(conversationId, userId)
```

**Messages :**
```typescript
// Envoyer un message
sendMessage(conversationId, userId, userName, data)

// Écouter les messages en temps réel
subscribeToMessages(conversationId, callback)

// Marquer messages comme lus
markMessagesAsRead(messageIds, userId)

// Ajouter une réaction
addMessageReaction(messageId, userId, userName, emoji)

// Supprimer un message
deleteMessage(messageId)
```

### Hooks personnalisés

#### **useEstablishmentUsers** ([useEstablishmentUsers.ts](src/features/messaging/hooks/useEstablishmentUsers.ts))
Récupère les utilisateurs de l'établissement en temps réel.

```typescript
const { users, isLoading, error } = useEstablishmentUsers(establishmentId);
```

**Retourne :**
- `users`: Liste des utilisateurs avec { userId, name, email, avatar, role, isOnline }
- `isLoading`: État de chargement
- `error`: Erreur éventuelle

## Protection par Feature Flag

La messagerie est protégée par la feature `internalChat` :

### Dans le Router
```typescript
{
  path: 'messaging',
  element: (
    <FeatureGuard feature="internalChat">
      <MessagingPage />
    </FeatureGuard>
  ),
}
```

### Dans la Page
```typescript
if (!hasFeature('internalChat')) {
  return <FeatureDisabledMessage />;
}
```

### Dans le Sidebar
La feature `messaging` dans le sidebar pointe vers `internalChat` (à vérifier/corriger si nécessaire).

## Fonctionnalités

### ✅ Implémenté

1. **Conversations**
   - ✅ Conversations directes (1-1)
   - ✅ Groupes
   - ✅ Liées aux interventions
   - ✅ Temps réel (Firestore subscriptions)
   - ✅ Derniers messages
   - ✅ Compteurs non lus

2. **Messages**
   - ✅ Texte simple
   - ✅ Pièces jointes (images, fichiers)
   - ✅ Réponse à un message
   - ✅ Réactions (emojis)
   - ✅ Mentions (@user)
   - ✅ Marquer comme lu
   - ✅ Édition/suppression

3. **UI/UX**
   - ✅ Layout split-screen
   - ✅ Liste conversations avec recherche
   - ✅ Fenêtre de chat responsive
   - ✅ Input message riche
   - ✅ Dialog nouvelle conversation
   - ✅ Indicateurs visuels (non lus, en ligne)

4. **Sécurité**
   - ✅ Protection par feature flag
   - ✅ Isolation par établissement
   - ✅ Vérification des participants

### 🔜 À implémenter

1. **Présence utilisateur** (Statut en ligne/hors ligne)
2. **Indicateur de frappe** ("X est en train d'écrire...")
3. **Notifications push** (Nouveaux messages)
4. **Recherche dans messages** (Full-text search)
5. **Chargement pagination** (Load more messages)
6. **Archivage conversations**
7. **Épinglage conversations**
8. **Désactiver notifications** (Mute conversation)
9. **Transfert de messages**
10. **Audio/Vidéo** (Appels)

## Usage

### 1. Activer la fonctionnalité

En tant que Super Admin :
1. Aller dans `/app/settings/features`
2. Activer "Chat interne" (`internalChat`)
3. Sauvegarder

### 2. Accéder à la messagerie

1. Menu latéral → Messagerie
2. Ou directement : `/app/messaging`

### 3. Créer une conversation

1. Cliquer sur "+ Nouvelle conversation"
2. Sélectionner le type :
   - **Direct** : Conversation avec 1 personne
   - **Groupe** : Conversation avec plusieurs personnes
3. Rechercher et sélectionner les participants
4. (Optionnel) Donner un nom au groupe
5. Cliquer sur "Créer"

### 4. Envoyer un message

1. Sélectionner une conversation
2. Taper le message dans la zone de saisie
3. Appuyer sur Entrée ou cliquer sur Envoyer

### 5. Ajouter des pièces jointes

1. Cliquer sur l'icône 📎
2. Sélectionner les fichiers (max 10 MB)
3. Les fichiers apparaissent en prévisualisation
4. Envoyer le message

### 6. Répondre à un message

1. Survoler un message
2. Cliquer sur "Répondre"
3. Taper la réponse
4. Le message original apparaît en contexte

### 7. Réagir avec un emoji

1. Survoler un message
2. Cliquer sur l'icône emoji
3. Sélectionner un emoji
4. La réaction apparaît sous le message

## Structure Firestore

### Collection `conversations`

```json
{
  "id": "conv_abc123",
  "type": "direct",
  "participantIds": ["user1", "user2"],
  "participants": [
    {
      "userId": "user1",
      "name": "Jean Dupont",
      "email": "jean@hotel.fr",
      "avatar": "https://...",
      "role": "technician",
      "isOnline": true,
      "joinedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "lastMessage": {
    "content": "Bonjour, comment vas-tu ?",
    "senderId": "user1",
    "senderName": "Jean Dupont",
    "createdAt": "2025-01-15T14:30:00Z"
  },
  "unreadCount": {
    "user2": 3
  },
  "establishmentId": "est_123",
  "createdBy": "user1",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z"
}
```

### Collection `messages`

```json
{
  "id": "msg_xyz789",
  "conversationId": "conv_abc123",
  "type": "text",
  "content": "Bonjour, comment vas-tu ?",
  "senderId": "user1",
  "senderName": "Jean Dupont",
  "senderAvatar": "https://...",
  "readBy": ["user1"],
  "reactions": [
    {
      "emoji": "👍",
      "userId": "user2",
      "userName": "Marie Martin",
      "createdAt": "2025-01-15T14:35:00Z"
    }
  ],
  "createdAt": "2025-01-15T14:30:00Z"
}
```

## Règles de sécurité Firestore

```javascript
// Conversations: Lire seulement si participant
match /conversations/{conversationId} {
  allow read: if request.auth.uid in resource.data.participantIds;
  allow create: if request.auth.uid != null;
  allow update: if request.auth.uid in resource.data.participantIds;
}

// Messages: Lire seulement si participant de la conversation
match /messages/{messageId} {
  allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participantIds;
  allow create: if request.auth.uid != null;
  allow update, delete: if request.auth.uid == resource.data.senderId;
}
```

## Optimisations

### Performance

1. **Pagination** : Limiter les messages chargés (limit 50)
2. **Index Firestore** : Sur `conversationId`, `createdAt`
3. **Lazy loading** : Charger plus au scroll
4. **Debounce** : Sur la recherche conversations

### Stockage

1. **Compression images** : Avant upload
2. **Nettoyage** : Supprimer vieux fichiers
3. **Quotas** : Limiter taille/nombre fichiers

## Troubleshooting

### Messages ne s'affichent pas

1. Vérifier que `internalChat` est activé
2. Vérifier les règles Firestore
3. Console : Erreurs subscription
4. Vérifier que l'utilisateur est participant

### Utilisateurs ne se chargent pas

1. Vérifier que `establishmentId` est valide
2. Console : Erreur `useEstablishmentUsers`
3. Vérifier les permissions Firestore sur `users`

### Pièces jointes ne s'uploadent pas

1. Vérifier Storage rules
2. Vérifier taille fichier (max 10 MB)
3. Console : Erreurs upload
4. Vérifier connexion internet

## Ressources

- [Types](src/features/messaging/types/message.types.ts)
- [Services](src/features/messaging/services/messageService.ts)
- [Composants](src/features/messaging/components/)
- [Page principale](src/pages/MessagingPage.tsx)
- [Hook utilisateurs](src/features/messaging/hooks/useEstablishmentUsers.ts)
