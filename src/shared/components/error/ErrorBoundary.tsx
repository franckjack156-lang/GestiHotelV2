/**
 * ============================================================================
 * ERROR BOUNDARY
 * ============================================================================
 *
 * Composant pour capturer les erreurs React et afficher un fallback UI
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { logger } from '@/core/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur
    logger.error('Error Boundary caught an error:', error, errorInfo);

    // Mettre à jour l'état avec les infos d'erreur
    this.setState({
      errorInfo,
    });

    // Callback personnalisé (ex: envoyer à Sentry)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sinon, afficher le fallback par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Une erreur est survenue</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Quelque chose s'est mal passé lors du chargement de cette page
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Message d'erreur */}
              {this.state.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">Erreur</p>
                  <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Stack trace (en dev uniquement) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <summary className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                    Détails techniques (développement)
                  </summary>
                  <pre className="mt-3 text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-60">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Conseils */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Que faire ?
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Essayez de recharger la page</li>
                  <li>Vérifiez votre connexion internet</li>
                  <li>Retournez à la page d'accueil</li>
                  <li>Si le problème persiste, contactez le support</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recharger la page
              </Button>
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Page d'accueil
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
