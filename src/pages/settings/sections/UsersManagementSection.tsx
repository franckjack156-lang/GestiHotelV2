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
      <CardHeader className="space-y-3 px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-2xl truncate">Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">
              Gérez les membres de votre équipe et leurs permissions
            </CardDescription>
          </div>
          <Button
            onClick={() => navigate('/app/users')}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 w-full sm:w-auto flex-shrink-0"
            size="sm"
          >
            <Users size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Voir tous</span>
            <span className="sm:hidden">Tous les utilisateurs</span>
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-purple-500 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex p-3 sm:p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-3 sm:mb-4">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-purple-500" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun utilisateur</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto px-4">
              Commencez par créer votre premier utilisateur pour collaborer avec votre équipe
            </p>
            <Button
              onClick={() => navigate('/app/users/create')}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 w-full sm:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Créer un utilisateur
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="space-y-2 sm:space-y-3">
              {users.slice(0, 5).map((user: UserData) => (
                <div
                  key={user.id}
                  className="group p-3 sm:p-4 border-2 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/app/users/${user.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
                          <span className="text-sm sm:text-base font-semibold text-white">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </span>
                        </div>
                        {user.status === 'active' && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base flex items-center gap-2 truncate">
                          <span className="truncate">{user.firstName} {user.lastName}</span>
                          {user.role === 'super_admin' && (
                            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2 truncate">
                          <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span
                        className={cn(
                          'px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap',
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
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
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
