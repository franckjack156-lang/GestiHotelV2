/**
 * Onglet Commentaires - Timeline des commentaires et discussions
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { MessageSquare, Send, Paperclip, Lock, Edit2, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useComments } from '../../hooks/useComments';
import { toast } from 'sonner';

interface CommentsTabProps {
  interventionId: string;
}

export const CommentsTab = ({ interventionId }: CommentsTabProps) => {
  const { establishmentId } = useCurrentEstablishment();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Utiliser le hook pour les commentaires
  const {
    comments,
    loading,
    submitting,
    addComment,
    editComment,
    removeComment,
    canEdit,
    canDelete,
  } = useComments(interventionId, establishmentId || '');

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    const success = await addComment({
      content: newComment,
      contentType: 'text',
    });

    if (success) {
      setNewComment('');
      setIsInternal(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    const success = await editComment(commentId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await removeComment(commentId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de nouveau commentaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ajouter un commentaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Saisissez votre commentaire..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Commentaire interne */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={checked => setIsInternal(checked as boolean)}
                />
                <Label
                  htmlFor="internal"
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Commentaire interne (non visible par le client)
                </Label>
              </div>

              {/* TODO: Bouton pièces jointes */}
              <Button variant="outline" size="sm" disabled>
                <Paperclip className="h-4 w-4 mr-2" />
                Joindre un fichier
              </Button>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline des commentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Historique des commentaires</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && comments.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Chargement des commentaires...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun commentaire pour le moment</p>
              <p className="text-sm text-gray-500 mt-2">
                Soyez le premier à commenter cette intervention
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div key={comment.id} className="relative">
                  {/* Ligne verticale de la timeline (sauf pour le dernier) */}
                  {index < comments.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}

                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="relative z-10">
                      <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                          {getInitials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Contenu du commentaire */}
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      {/* Mode édition */}
                      {editingId === comment.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                              }}
                            >
                              Annuler
                            </Button>
                            <Button size="sm" onClick={() => handleEdit(comment.id)}>
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {comment.authorName}
                                </span>
                                {comment.authorRole && (
                                  <Badge variant="secondary" className="text-xs">
                                    {comment.authorRole}
                                  </Badge>
                                )}
                                {comment.contentType === 'system' && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-blue-600 border-blue-600"
                                  >
                                    Système
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {comment.createdAt?.toDate &&
                                    format(comment.createdAt.toDate(), 'dd MMM yyyy à HH:mm', {
                                      locale: fr,
                                    })}
                                </span>
                                {comment.isEdited && (
                                  <span className="text-xs text-gray-400 italic">(modifié)</span>
                                )}
                              </div>
                            </div>

                            {/* Actions (si l'utilisateur peut modifier/supprimer) */}
                            {comment.contentType !== 'system' && (
                              <div className="flex items-center gap-1">
                                {canEdit(comment) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                    onClick={() => {
                                      setEditingId(comment.id);
                                      setEditContent(comment.content);
                                    }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {canDelete(comment) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                                    onClick={() => handleDelete(comment.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Contenu */}
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
