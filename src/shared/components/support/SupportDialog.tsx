/**
 * SupportDialog - Dialogue pour contacter le support
 *
 * Permet aux utilisateurs d'envoyer des demandes de support
 * avec choix de destination (interne = admin, externe = dev)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Bug,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Building2,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { toast } from 'sonner';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import type { SupportRequestDestination } from '@/features/support/types/support.types';

// Types de demande
const REQUEST_TYPES = [
  { value: 'bug', label: 'Signaler un bug', icon: Bug, color: 'text-red-500' },
  { value: 'question', label: 'Question générale', icon: HelpCircle, color: 'text-blue-500' },
  { value: 'feature', label: 'Suggestion de fonctionnalité', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'urgent', label: 'Problème urgent', icon: AlertTriangle, color: 'text-orange-500' },
  { value: 'other', label: 'Autre', icon: MessageSquare, color: 'text-gray-500' },
] as const;

type RequestType = (typeof REQUEST_TYPES)[number]['value'];

interface SupportDialogProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SupportDialog = ({ children, defaultOpen, onOpenChange }: SupportDialogProps) => {
  const { user } = useAuth();
  const { establishment } = useCurrentEstablishment();

  const [open, setOpen] = useState(defaultOpen ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [destination, setDestination] = useState<SupportRequestDestination>('internal');
  const [requestType, setRequestType] = useState<RequestType>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    // Reset form on close
    if (!newOpen) {
      setTimeout(() => {
        setIsSuccess(false);
        setDestination('internal');
        setRequestType('question');
        setSubject('');
        setMessage('');
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);

    try {
      // Enregistrer la demande dans Firestore
      await addDoc(collection(db, 'supportRequests'), {
        type: requestType,
        destination,
        subject: subject.trim(),
        message: message.trim(),
        userId: user?.id || 'anonymous',
        userEmail: user?.email || 'unknown',
        userName: user?.displayName || 'Utilisateur',
        establishmentId: establishment?.id || null,
        establishmentName: establishment?.name || null,
        status: 'new',
        createdAt: Timestamp.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      setIsSuccess(true);
      toast.success('Demande envoyée avec succès', {
        description:
          destination === 'internal'
            ? "L'administrateur de votre établissement vous répondra rapidement."
            : "L'équipe technique traitera votre demande dans les plus brefs délais.",
      });

      // Fermer après 2 secondes
      setTimeout(() => {
        handleOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur envoi support:', error);
      toast.error("Erreur lors de l'envoi", {
        description: 'Veuillez réessayer ou nous contacter par email.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px]">
        {isSuccess ? (
          // Success state
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl mb-2">Message envoyé !</DialogTitle>
            <DialogDescription>
              {destination === 'internal'
                ? "Votre administrateur d'établissement a été notifié et traitera votre demande."
                : "L'équipe technique a été notifiée et traitera votre demande dans les plus brefs délais."}
            </DialogDescription>
          </div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Contacter le support
              </DialogTitle>
              <DialogDescription>
                Décrivez votre problème ou question et nous vous répondrons rapidement.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Destination */}
              <div className="space-y-3">
                <Label>Destinataire</Label>
                <RadioGroup
                  value={destination}
                  onValueChange={v => setDestination(v as SupportRequestDestination)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="internal" id="internal" className="peer sr-only" />
                    <Label
                      htmlFor="internal"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/20 cursor-pointer transition-all"
                    >
                      <Building2 className="h-6 w-6 mb-2 text-blue-500" />
                      <span className="text-sm font-medium">Support interne</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Admin de l'établissement
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="external" id="external" className="peer sr-only" />
                    <Label
                      htmlFor="external"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 dark:peer-data-[state=checked]:bg-indigo-900/20 cursor-pointer transition-all"
                    >
                      <Code2 className="h-6 w-6 mb-2 text-indigo-500" />
                      <span className="text-sm font-medium">Support technique</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Équipe de développement
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Type de demande */}
              <div className="space-y-2">
                <Label htmlFor="type">Type de demande</Label>
                <Select value={requestType} onValueChange={v => setRequestType(v as RequestType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sujet */}
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  placeholder="Résumez votre demande en quelques mots..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez en détail votre problème ou question..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 text-right">{message.length}/2000</p>
              </div>

              {/* Infos utilisateur (lecture seule) */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Email :</span> {user?.email || 'Non connecté'}
                </p>
                {establishment && (
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Établissement :</span> {establishment.name}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || !subject.trim() || !message.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
