/**
 * ============================================================================
 * NEW CONVERSATION DIALOG COMPONENT
 * ============================================================================
 *
 * Dialog pour créer une nouvelle conversation (directe ou groupe)
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Search,
  User,
  Users,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import type { CreateConversationData, ConversationType } from '../types/message.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// PROPS
// ============================================================================

export interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (data: CreateConversationData) => Promise<void>;
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  }[];
}

// ============================================================================
// USER ITEM COMPONENT
// ============================================================================

interface UserItemProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const UserItem: React.FC<UserItemProps> = ({
  user,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-accent',
        isSelected && 'bg-accent',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Checkbox
        checked={isSelected}
        disabled={disabled}
        className="flex-shrink-0"
      />

      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {user.name[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{user.name}</p>
          {user.role && (
            <Badge variant="secondary" className="text-xs">
              {user.role}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>

      {isSelected && (
        <Check className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onCreateConversation,
  users,
}) => {
  const [type, setType] = useState<ConversationType>('direct');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = useMemo(() => {
    if (!search) return users;

    const searchLower = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  // Utilisateurs sélectionnés
  const selectedUsers = useMemo(() => {
    return users.filter((user) => selectedUserIds.includes(user.id));
  }, [users, selectedUserIds]);

  // Reset form
  const resetForm = () => {
    setType('direct');
    setSelectedUserIds([]);
    setGroupName('');
    setDescription('');
    setSearch('');
    setIsCreating(false);
  };

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }

      // Pour conversation directe, limiter à 1 utilisateur
      if (type === 'direct') {
        return [userId];
      }

      return [...prev, userId];
    });
  };

  // Validation
  const canCreate = useMemo(() => {
    if (selectedUserIds.length === 0) return false;

    if (type === 'direct') {
      return selectedUserIds.length === 1;
    }

    if (type === 'group') {
      return selectedUserIds.length >= 2 && groupName.trim().length > 0;
    }

    return false;
  }, [type, selectedUserIds, groupName]);

  // Handle create
  const handleCreate = async () => {
    if (!canCreate) return;

    setIsCreating(true);

    try {
      const data: CreateConversationData = {
        type,
        participantIds: selectedUserIds,
      };

      if (type === 'group') {
        data.name = groupName.trim();
        if (description.trim()) {
          data.description = description.trim();
        }
      }

      await onCreateConversation(data);

      toast.success(
        type === 'direct'
          ? 'Conversation créée avec succès'
          : 'Groupe créé avec succès'
      );

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Type de conversation */}
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as ConversationType);
              setSelectedUserIds([]);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct" className="gap-2">
                <User className="h-4 w-4" />
                Conversation directe
              </TabsTrigger>
              <TabsTrigger value="group" className="gap-2">
                <Users className="h-4 w-4" />
                Groupe
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Nom et description du groupe */}
          {type === 'group' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="group-name">
                  Nom du groupe <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="group-name"
                  placeholder="Ex: Équipe technique"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isCreating}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Description (optionnelle)</Label>
                <Textarea
                  id="group-description"
                  placeholder="Description du groupe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isCreating}
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* Utilisateurs sélectionnés */}
          {selectedUsers.length > 0 && (
            <div>
              <Label className="mb-2 block">
                {type === 'direct'
                  ? 'Destinataire'
                  : `Membres sélectionnés (${selectedUsers.length})`}
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="gap-2 pr-1 pl-3 py-1.5"
                  >
                    <span className="font-medium">{user.name}</span>
                    <button
                      onClick={() => toggleUser(user.id)}
                      disabled={isCreating}
                      className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div>
            <Label className="mb-2 block">
              {type === 'direct'
                ? 'Sélectionner un utilisateur'
                : 'Sélectionner les membres'}
              {type === 'group' && (
                <span className="text-muted-foreground ml-1">(minimum 2)</span>
              )}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isCreating}
                className="pl-9"
              />
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search
                      ? 'Aucun utilisateur trouvé'
                      : 'Aucun utilisateur disponible'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    isSelected={selectedUserIds.includes(user.id)}
                    onToggle={() => toggleUser(user.id)}
                    disabled={isCreating}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Informations */}
          {type === 'group' && selectedUserIds.length === 1 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Un groupe nécessite au moins 2 membres.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                {type === 'direct' ? (
                  <User className="h-4 w-4 mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                {type === 'direct' ? 'Créer la conversation' : 'Créer le groupe'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
