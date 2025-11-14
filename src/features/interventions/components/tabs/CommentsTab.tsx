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
import {
  MessageSquare,
  Send,
  Paperclip,
  User,
  Lock,
  Globe,
  Edit2,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

interface CommentsTabProps {
  interventionId: string;
}

export const CommentsTab = ({ interventionId }: CommentsTabProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Récupérer les commentaires depuis Firestore
  const comments: any[] = [];

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Appel API pour créer le commentaire
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Commentaire ajouté');
      setNewComment('');
      setIsInternal(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
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
            onChange={(e) => setNewComment(e.target.value)}
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
                  onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                />
                <Label htmlFor="internal" className="text-sm cursor-pointer flex items-center gap-2">
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

            <Button onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline des commentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des commentaires</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun commentaire pour le moment</p>
              <p className="text-sm text-gray-500 mt-2">Soyez le premier à commenter cette intervention</p>
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
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                <Lock className="h-3 w-3 mr-1" />
                                Interne
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(comment.createdAt, 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </span>
                            {comment.isEdited && (
                              <span className="text-xs text-gray-400 italic">(modifié)</span>
                            )}
                          </div>
                        </div>

                        {/* Actions (si c'est l'auteur) */}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Contenu */}
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* TODO: Pièces jointes si présentes */}
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
