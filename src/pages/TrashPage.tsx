/**
 * TrashPage - Page de la corbeille
 *
 * Permet de visualiser, restaurer ou supprimer définitivement les éléments
 */

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Home,
  Bell,
  LayoutDashboard,
  Wrench,
  MoreVertical,
  Trash,
  History,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useTrash, type TrashItem, type TrashItemType } from '@/shared/hooks/useTrash';
import { cn } from '@/shared/utils/cn';

/**
 * Configuration des icônes par type
 */
const TYPE_ICONS: Record<TrashItemType, typeof FileText> = {
  intervention: Wrench,
  room: Home,
  user: Users,
  message: MessageSquare,
  conversation: MessageSquare,
  comment: FileText,
  notification: Bell,
  dashboard: LayoutDashboard,
};

const TYPE_LABELS: Record<TrashItemType, string> = {
  intervention: 'Intervention',
  room: 'Chambre',
  user: 'Utilisateur',
  message: 'Message',
  conversation: 'Conversation',
  comment: 'Commentaire',
  notification: 'Notification',
  dashboard: 'Dashboard',
};

const TYPE_COLORS: Record<TrashItemType, string> = {
  intervention: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  room: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  message: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  conversation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  comment: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  notification: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  dashboard: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export const TrashPage = () => {
  const {
    items,
    stats,
    isLoading,
    selectedItems,
    isAllSelected,
    restore,
    restoreSelected,
    permanentDelete,
    permanentDeleteSelected,
    empty,
    toggleSelection,
    toggleSelectAll,
    loadItems,
  } = useTrash();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TrashItemType | 'all'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'deleteSelected' | 'empty' | 'restore';
    item?: TrashItem;
  }>({ open: false, type: 'delete' });

  // Filtrer les éléments
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.deletedByName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, typeFilter, searchQuery]);

  // Confirmer une action
  const handleConfirmAction = async () => {
    switch (confirmDialog.type) {
      case 'delete':
        if (confirmDialog.item) {
          await permanentDelete(confirmDialog.item);
        }
        break;
      case 'deleteSelected':
        await permanentDeleteSelected();
        break;
      case 'empty':
        await empty(false);
        break;
      case 'restore':
        if (confirmDialog.item) {
          await restore(confirmDialog.item);
        }
        break;
    }
    setConfirmDialog({ open: false, type: 'delete' });
  };

  // Rendu d'un élément de la corbeille
  const renderTrashItem = (item: TrashItem) => {
    const Icon = TYPE_ICONS[item.type];
    const isSelected = selectedItems.has(item.id);
    const isExpiringSoon = item.daysUntilPermanentDelete <= 7;

    return (
      <TableRow key={item.id} className={cn(isSelected && 'bg-indigo-50 dark:bg-indigo-900/10')}>
        <TableCell className="w-12">
          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(item.id)} />
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                TYPE_COLORS[item.type]
              )}
            >
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              {item.description && (
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge variant="outline" className={TYPE_COLORS[item.type]}>
            {TYPE_LABELS[item.type]}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <p className="font-medium">{item.deletedByName}</p>
            <p className="text-gray-500">
              {formatDistanceToNow(item.deletedAt.toDate(), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </TableCell>

        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                  )}
                >
                  <Clock size={14} />
                  <span>
                    {item.daysUntilPermanentDelete === 0
                      ? 'Expire bientôt'
                      : `${item.daysUntilPermanentDelete}j`}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Suppression automatique dans {item.daysUntilPermanentDelete} jour
                {item.daysUntilPermanentDelete > 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => restore(item)}
                    disabled={!item.canRestore}
                  >
                    <RotateCcw size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restaurer</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => restore(item)}>
                  <RotateCcw size={14} className="mr-2" />
                  Restaurer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setConfirmDialog({ open: true, type: 'delete', item })}
                >
                  <Trash size={14} className="mr-2" />
                  Supprimer définitivement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Corbeille
          </h1>
          <p className="text-gray-500 mt-1">
            Les éléments sont conservés pendant 30 jours avant suppression automatique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadItems} disabled={isLoading}>
            <History size={16} className="mr-2" />
            Actualiser
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDialog({ open: true, type: 'empty' })}
            disabled={isLoading || items.length === 0}
          >
            <Trash2 size={16} className="mr-2" />
            Vider la corbeille
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </CardContent>
          </Card>

          {Object.entries(stats.byType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => {
              const Icon = TYPE_ICONS[type as TrashItemType];
              return (
                <Card key={type}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gray-400" />
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {TYPE_LABELS[type as TrashItemType]}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Filtres et actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans la corbeille..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par type */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <Select
                value={typeFilter}
                onValueChange={v => setTypeFilter(v as TrashItemType | 'all')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions sur sélection */}
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Badge variant="secondary">
                {selectedItems.size} sélectionné{selectedItems.size > 1 ? 's' : ''}
              </Badge>
              <Button variant="outline" size="sm" onClick={restoreSelected}>
                <RotateCcw size={14} className="mr-2" />
                Restaurer la sélection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDialog({ open: true, type: 'deleteSelected' })}
              >
                <Trash size={14} className="mr-2" />
                Supprimer définitivement
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Corbeille vide
              </h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || typeFilter !== 'all'
                  ? 'Aucun élément ne correspond à vos filtres'
                  : 'Aucun élément supprimé'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Élément</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Supprimé par</TableHead>
                  <TableHead>Expire dans</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filteredItems.map(renderTrashItem)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Boîte de dialogue de confirmation */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={open => !open && setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'empty' ? (
                <>
                  Cette action supprimera <strong>tous les éléments</strong> de la corbeille de
                  façon permanente. Cette action est irréversible.
                </>
              ) : confirmDialog.type === 'deleteSelected' ? (
                <>
                  Cette action supprimera <strong>{selectedItems.size} élément(s)</strong> de façon
                  permanente. Cette action est irréversible.
                </>
              ) : (
                <>
                  Cette action supprimera <strong>"{confirmDialog.item?.title}"</strong> de façon
                  permanente. Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
