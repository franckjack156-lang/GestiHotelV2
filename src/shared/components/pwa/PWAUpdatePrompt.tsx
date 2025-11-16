/**
 * ============================================================================
 * PWA UPDATE PROMPT
 * ============================================================================
 *
 * Composant pour notifier l'utilisateur qu'une mise à jour est disponible
 * Gère le reload du service worker
 */

import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { toast } from 'sonner';

export const PWAUpdatePrompt = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW registered:', r);
    },
    onRegisterError(error: Error) {
      console.error('SW registration error:', error);
    },
    onOfflineReady() {
      console.log('PWA application ready to work offline');
      toast.success('Application prête à fonctionner hors ligne', {
        description: "Vous pouvez maintenant utiliser l'app sans connexion",
        duration: 5000,
      });
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    setShowUpdatePrompt(false);
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white shadow-xl dark:from-green-950 dark:to-gray-900">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Mise à jour disponible</CardTitle>
              <CardDescription>Une nouvelle version est prête</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Rechargez l'application pour profiter des dernières améliorations et correctifs.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleUpdate} className="flex-1" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Mettre à jour
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAUpdatePrompt;
