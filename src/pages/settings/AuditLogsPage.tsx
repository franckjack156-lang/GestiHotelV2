/**
 * ============================================================================
 * AUDIT LOGS PAGE
 * ============================================================================
 *
 * Page pour visualiser l'historique complet des actions dans l'application.
 * Accessible uniquement aux administrateurs.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useCurrentEstablishment } from '@/features/establishments/hooks/useCurrentEstablishment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getAuditLogs,
  exportAuditLogs,
  type AuditLog,
  type AuditLogFilters,
  type AuditAction,
  type AuditEntityType,
} from '@/shared/services/auditService';
import {
  Download,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Clock,
  User,
  FileText,
  Shield,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Plus,
  RotateCcw,
  FileUp,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface DetailedLog extends AuditLog {
  expanded?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  restore: 'Restauration',
  login: 'Connexion',
  logout: 'Déconnexion',
  export: 'Export',
  import: 'Import',
  permission_change: 'Changement de permission',
  status_change: 'Changement de statut',
  assignment: 'Assignation',
  bulk_update: 'Modification en masse',
  bulk_delete: 'Suppression en masse',
};

const ACTION_ICONS: Record<AuditAction, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  restore: RotateCcw,
  login: LogIn,
  logout: LogOut,
  export: FileDown,
  import: FileUp,
  permission_change: Shield,
  status_change: Edit,
  assignment: User,
  bulk_update: Edit,
  bulk_delete: Trash2,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  restore: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  login: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  export: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  import: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  permission_change: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  status_change: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  assignment: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  bulk_update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bulk_delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  intervention: 'Intervention',
  room: 'Chambre',
  user: 'Utilisateur',
  establishment: 'Établissement',
  settings: 'Paramètres',
  template: 'Modèle',
  supplier: 'Fournisseur',
  inventory: 'Inventaire',
  reference_list: 'Liste de référence',
  notification: 'Notification',
  report: 'Rapport',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AuditLogsPage = () => {
  const { user } = useAuth();
  const { currentEstablishment } = useCurrentEstablishment();

  // State
  const [logs, setLogs] = useState<DetailedLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DetailedLog | null>(null);

  // Filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<AuditEntityType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (currentEstablishment) {
      loadLogs();
    }
  }, [currentEstablishment]);

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  /**
   * Charger les logs
   */
  const loadLogs = async () => {
    if (!currentEstablishment) return;

    setIsLoading(true);
    try {
      const filterParams: AuditLogFilters = {
        ...filters,
      };

      if (selectedAction !== 'all') {
        filterParams.action = selectedAction;
      }
      if (selectedEntityType !== 'all') {
        filterParams.entityType = selectedEntityType;
      }
      if (startDate) {
        filterParams.startDate = new Date(startDate);
      }
      if (endDate) {
        filterParams.endDate = new Date(endDate);
      }

      const data = await getAuditLogs(currentEstablishment.id, filterParams);
      setLogs(data);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      toast.error("Impossible de charger les logs d'audit");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exporter les logs
   */
  const handleExport = async (format: 'csv' | 'json') => {
    if (!currentEstablishment) return;

    try {
      const filterParams: AuditLogFilters = {};

      if (selectedAction !== 'all') {
        filterParams.action = selectedAction;
      }
      if (selectedEntityType !== 'all') {
        filterParams.entityType = selectedEntityType;
      }
      if (startDate) {
        filterParams.startDate = new Date(startDate);
      }
      if (endDate) {
        filterParams.endDate = new Date(endDate);
      }

      const blob = await exportAuditLogs(currentEstablishment.id, {
        filters: filterParams,
        format,
        includeMetadata: true,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Logs exportés en ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Impossible d'exporter les logs");
    }
  };

  /**
   * Filtrer les logs par terme de recherche
   */
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      log.userEmail.toLowerCase().includes(search) ||
      log.userName?.toLowerCase().includes(search) ||
      log.entityId.toLowerCase().includes(search) ||
      log.entityName?.toLowerCase().includes(search) ||
      ACTION_LABELS[log.action].toLowerCase().includes(search) ||
      ENTITY_LABELS[log.entityType].toLowerCase().includes(search)
    );
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!user?.role || !['admin', 'super_admin', 'editor'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès restreint
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cette page est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal d'audit</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Historique de toutes les actions effectuées dans l'application
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrer les logs par action, type d'entité, ou période</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Utilisateur, entité..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={selectedAction}
                onValueChange={value => setSelectedAction(value as AuditAction | 'all')}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type d'entité */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Type d'entité</Label>
              <Select
                value={selectedEntityType}
                onValueChange={value => setSelectedEntityType(value as AuditEntityType | 'all')}
              >
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Limite */}
            <div className="space-y-2">
              <Label htmlFor="limit">Nombre de résultats</Label>
              <Select
                value={String(filters.limit || 50)}
                onValueChange={value => setFilters(prev => ({ ...prev, limit: Number(value) }))}
              >
                <SelectTrigger id="limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de début */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadLogs} disabled={isLoading}>
              <Filter className="mr-2 h-4 w-4" />
              Appliquer les filtres
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('all');
                setSelectedEntityType('all');
                setStartDate('');
                setEndDate('');
                setFilters({ limit: 50 });
                loadLogs();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
        <Button variant="outline" onClick={() => handleExport('json')}>
          <Download className="mr-2 h-4 w-4" />
          Exporter JSON
        </Button>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            {isLoading ? 'Chargement...' : `${filteredLogs.length} log(s) trouvé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun log trouvé avec ces filtres</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => {
                    const ActionIcon = ACTION_ICONS[log.action];
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {format(log.timestamp, 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{log.userName || log.userEmail}</div>
                              {log.userName && (
                                <div className="text-xs text-gray-500">{log.userEmail}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[log.action]}>
                            <ActionIcon className="mr-1 h-3 w-3" />
                            {ACTION_LABELS[log.action]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ENTITY_LABELS[log.entityType]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={log.entityName || log.entityId}>
                            {log.entityName || log.entityId}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails d'un log */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du log</DialogTitle>
            <DialogDescription>Informations complètes sur cette action</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Date et heure</div>
                  <div className="text-sm">
                    {format(selectedLog.timestamp, 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Utilisateur</div>
                  <div className="text-sm">
                    {selectedLog.userName || selectedLog.userEmail}
                    <br />
                    <span className="text-xs text-gray-400">{selectedLog.userEmail}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Action</div>
                  <div className="text-sm">
                    <Badge className={ACTION_COLORS[selectedLog.action]}>
                      {ACTION_LABELS[selectedLog.action]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Type d'entité</div>
                  <div className="text-sm">
                    <Badge variant="outline">{ENTITY_LABELS[selectedLog.entityType]}</Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm font-medium text-gray-500">Entité</div>
                  <div className="text-sm font-mono">
                    {selectedLog.entityName || selectedLog.entityId}
                  </div>
                </div>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Changements</div>
                  <div className="space-y-2">
                    {selectedLog.changes.map((change, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                      >
                        <div className="font-medium text-sm mb-1">{change.field}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500">Avant:</div>
                            <div className="font-mono mt-1">
                              {JSON.stringify(change.oldValue, null, 2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Après:</div>
                            <div className="font-mono mt-1">
                              {JSON.stringify(change.newValue, null, 2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Métadonnées</div>
                  <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <div className="text-sm font-medium text-gray-500">User Agent</div>
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Adresse IP</div>
                  <div className="text-sm font-mono">{selectedLog.ipAddress}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
