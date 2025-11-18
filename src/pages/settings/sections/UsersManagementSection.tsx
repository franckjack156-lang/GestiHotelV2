/**
 * ============================================================================
 * USERS MANAGEMENT SECTION - Settings Page
 * ============================================================================
 *
 * Section for managing users:
 * - User list overview
 * - User statistics (total, active, inactive)
 * - Navigation to user details
 *
 * Extracted from Settings.tsx
 */

import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  Users,
  ChevronRight,
  Loader2,
  Plus,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { User as UserData } from '@/features/users/types/user.types';

// ============================================================================
// COMPONENT
// ============================================================================

export const UsersManagementSection = () => {
  const navigate = useNavigate();
  const { users, isLoading } = useUsers();

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription className="text-base">
              Gérez les membres de votre équipe et leurs permissions
            </CardDescription>
          </div>
          <Button
            onClick={() => navigate('/app/users')}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            <Users size={16} className="mr-2" />
            Voir tous
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-4">
              <Users className="h-12 w-12 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun utilisateur</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez par créer votre premier utilisateur pour collaborer avec votre équipe
            </p>
            <Button
              onClick={() => navigate('/app/users/create')}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
            >
              <Plus size={18} className="mr-2" />
              Créer un utilisateur
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total
                  </span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {users.length}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">utilisateurs</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Actifs
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {users.filter((u: UserData) => u.status === 'active').length}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">en ligne</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inactifs
                  </span>
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {users.filter((u: UserData) => u.status === 'inactive').length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">hors ligne</p>
              </div>
            </div>

            {/* Liste d'utilisateurs */}
            <div className="space-y-3">
              {users.slice(0, 5).map((user: UserData) => (
                <div
                  key={user.id}
                  className="group p-4 border-2 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/app/users/${user.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                          <span className="text-base font-semibold text-white">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </span>
                        </div>
                        {user.status === 'active' && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {user.firstName} {user.lastName}
                          {user.role === 'super_admin' && (
                            <Shield className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-full',
                          user.role === 'admin' &&
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
                          user.role === 'super_admin' &&
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                          !['admin', 'super_admin'].includes(user.role) &&
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        )}
                      >
                        {user.role}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {users.length > 5 && (
              <Button
                variant="outline"
                onClick={() => navigate('/app/users')}
                className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700"
              >
                Voir tous les {users.length} utilisateurs
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
