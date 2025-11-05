/**
 * Dashboard Page
 * 
 * Page d'accueil / tableau de bord de l'application
 */

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ClipboardList, Users, Building2, TrendingUp } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  // Statistiques mockées pour l'instant
  const stats = [
    {
      title: 'Interventions',
      value: '24',
      description: '+12% ce mois',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Utilisateurs',
      value: '12',
      description: '3 actifs',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Établissements',
      value: '3',
      description: 'Tous actifs',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Performance',
      value: '98%',
      description: 'Satisfaction',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenue, {user?.displayName || 'Utilisateur'} ! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Interventions récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Interventions Récentes</CardTitle>
            <CardDescription>Les dernières demandes d'intervention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune intervention récente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Activité */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Actions récentes dans l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aucune activité récente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message de bienvenue Phase 1 */}
      <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-indigo-100">
            🎉 Phase 1 - Core Complétée !
          </CardTitle>
          <CardDescription className="text-indigo-700 dark:text-indigo-300">
            Le système d'authentification et le layout sont maintenant fonctionnels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
            <li>✅ Authentification complète (Login, Register, Reset)</li>
            <li>✅ Routing avec routes protégées</li>
            <li>✅ Layout responsive (Header, Sidebar, Footer)</li>
            <li>✅ Stores Zustand configurés</li>
            <li>✅ Services Firebase de base</li>
            <li>✅ Système de permissions</li>
          </ul>
          <p className="mt-4 text-sm text-indigo-700 dark:text-indigo-300">
            Prochaine étape : Phase 2 - Module Interventions ! 🚀
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
