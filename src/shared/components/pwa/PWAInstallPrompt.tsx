/**
 * ============================================================================
 * PWA INSTALL PROMPT
 * ============================================================================
 *
 * Composant pour afficher un prompt d'installation PWA
 * Compatible iOS, Android, Desktop
 */

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Détecter si déjà installé
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Écouter l'événement beforeinstallprompt (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Vérifier si l'utilisateur a déjà refusé
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Pour iOS, montrer le prompt si pas encore installé
    if (ios && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt natif
    await deferredPrompt.prompt();

    // Attendre le choix de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    // Nettoyer
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Ne rien afficher si déjà installé ou pas de prompt à montrer
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  // Prompt iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-xl dark:from-indigo-950 dark:to-gray-900">
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
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
                <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Installer GestiHôtel</CardTitle>
                <CardDescription>Accédez rapidement à l'application</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Pour installer l'application sur votre iPhone/iPad :
            </p>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                  1
                </span>
                <span>
                  Tapez sur le bouton <Share className="inline h-4 w-4" /> de partage
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                  2
                </span>
                <span>Sélectionnez "Sur l'écran d'accueil"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                  3
                </span>
                <span>Confirmez l'installation</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prompt Android/Desktop
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-xl dark:from-indigo-950 dark:to-gray-900">
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
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
              <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Installer GestiHôtel</CardTitle>
              <CardDescription>Utilisez l'app même hors ligne</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Installez l'application pour un accès rapide et une utilisation hors ligne.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Installer
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

export default PWAInstallPrompt;
