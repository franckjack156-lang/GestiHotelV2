/**
 * Comments List Component
 *
 * Composant pour afficher et gérer les commentaires d'une intervention
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Send, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useComments } from '../../hooks/useComments';
import type { Comment } from '../../types/comment.types';

interface CommentsListProps {
  interventionId: string;
  establishmentId: string;
}

export const CommentsList = ({ interventionId, establishmentId }: CommentsListProps) => {
  const {
    comments,
    count,
    loading,
    submitting,
    addComment,
    editComment,
    removeComment,
    canEdit,
    canDelete,
  } = useComments(interventionId, establishmentId);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  /**
   * Soumettre un nouveau commentaire
   */
  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const success = await addComment({ content: newComment });
    if (success) {
      setNewComment('');
    }
  };

  /**
   * Démarrer l'édition
   */
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  /**
   * Sauvegarder l'édition
   */
  const handleEdit = async (commentId: string) => {
    const success = await editComment(commentId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  /**
   * Annuler l'édition
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  /**
   * Supprimer un commentaire
   */
  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }
    await removeComment(commentId);
  };

  /**
   * Rendu d'un commentaire
   */
  const renderComment = (comment: Comment) => {
    const isEditing = editingId === comment.id;
    const isSystem = comment.contentType === 'system';

    return (
      <div
        key={comment.id}
        className={`flex gap-3 p-4 rounded-lg ${
          isSystem
            ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          {comment.authorPhotoURL ? (
            <img src={comment.authorPhotoURL} alt={comment.authorName} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </Avatar>

        {/* Contenu */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.authorName}</span>
                {isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    Système
                  </Badge>
                )}
                {comment.isEdited && !isSystem && (
                  <span className="text-xs text-gray-500">(modifié)</span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {comment.createdAt?.toDate &&
                  format(comment.createdAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>

            {/* Actions */}
            {!isSystem && (canEdit(comment) || canDelete(comment)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit(comment) && (
                    <DropdownMenuItem onClick={() => startEdit(comment)}>
                      <Edit2 size={14} className="mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {canDelete(comment) && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Contenu */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)}>
                  Sauvegarder
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <p className={`text-sm ${isSystem ? 'text-gray-600 dark:text-gray-400 italic' : ''}`}>
              {comment.content}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={20} />
          Commentaires
          {count > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {count}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nouveau commentaire */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={3}
            disabled={submitting}
            className="resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Ctrl+Enter pour envoyer</span>
            <Button onClick={handleSubmit} disabled={!newComment.trim() || submitting} size="sm">
              <Send size={14} className="mr-2" />
              {submitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>

        {/* Liste des commentaires */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm mt-1">Soyez le premier à commenter !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
