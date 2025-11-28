/**
 * ============================================================================
 * INTEGRATIONS PAGE
 * ============================================================================
 *
 * Page centralisée pour les intégrations et automatisations :
 * - Exports programmés
 * - Calendrier partagé
 * - Webhooks externes
 * - Rapports PDF automatiques
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEstablishments } from '@/features/establishments/hooks/useEstablishments';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Webhook,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Eye,
  MoreVertical,
  Send,
  FileSpreadsheet,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

// Services
import {
  type ScheduledExport,
  type CreateScheduledExportData,
  type ExportDataType,
  type ExportFormat,
  type ExportFrequency,
  getScheduledExports,
  createScheduledExport,
  deleteScheduledExport,
  toggleScheduledExport,
} from '@/shared/services/scheduledExportService';

import {
  type CalendarIntegration,
  type CalendarProvider,
  getUserCalendarIntegrations,
  createCalendarIntegration,
  deleteCalendarIntegration,
  PROVIDER_LABELS,
  PROVIDER_ICONS,
} from '@/shared/services/calendarIntegrationService';

import {
  type WebhookConfig,
  type WebhookEventType,
  type HttpMethod,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhookById,
  EVENT_LABELS,
} from '@/shared/services/webhookService';

import {
  type ReportConfig,
  type ReportType,
  type GeneratedReport,
  getReportConfigs,
  createReportConfig,
  deleteReportConfig,
  getGeneratedReports,
  REPORT_TYPE_LABELS,
} from '@/shared/services/pdfReportService';

import { getFunctions, httpsCallable } from 'firebase/functions';

// ============================================================================
// TYPES
// ============================================================================

interface TabContentProps {
  establishmentId: string;
  userId: string;
}

// ============================================================================
// EXPORTS SCHEDULE TAB
// ============================================================================

const ExportsScheduleTab = ({ establishmentId, userId }: TabContentProps) => {
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runningExportId, setRunningExportId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateScheduledExportData>({
    name: '',
    dataType: 'interventions',
    format: 'xlsx',
    frequency: 'weekly',
    scheduledTime: '08:00',
    recipients: [],
    sendToCreator: true,
  });
  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    loadExports();
  }, [establishmentId]);

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await getScheduledExports(establishmentId);
      setExports(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des exports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    console.log('=== handleCreate appelé ===');
    console.log('formData:', formData);
    console.log('establishmentId:', establishmentId);
    console.log('userId:', userId);

    if (!formData.name.trim()) {
      console.log('Validation échouée: nom vide');
      toast.error('Veuillez saisir un nom pour l\'export');
      return;
    }

    try {
      console.log('Début création...');
      setCreating(true);
      const result = await createScheduledExport(establishmentId, userId, formData);
      console.log('Export créé avec succès, id:', result);
      toast.success('Export programmé créé');
      setShowCreateDialog(false);
      resetForm();
      loadExports();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (exportId: string, isActive: boolean) => {
    try {
      await toggleScheduledExport(establishmentId, exportId, !isActive);
      toast.success(isActive ? 'Export désactivé' : 'Export activé');
      loadExports();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (exportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet export ?')) return;

    try {
      await deleteScheduledExport(establishmentId, exportId);
      toast.success('Export supprimé');
      loadExports();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRunNow = async (exportId: string) => {
    try {
      setRunningExportId(exportId);
      toast.info('Exécution de l\'export en cours...');

      const functions = getFunctions(undefined, 'europe-west1');
      const runExportNow = httpsCallable(functions, 'runExportNow');

      const result = await runExportNow({ establishmentId, exportId });
      const data = result.data as { success: boolean; message: string };

      if (data.success) {
        toast.success(data.message || 'Export exécuté avec succès');
        loadExports();
      } else {
        toast.error('Erreur lors de l\'exécution');
      }
    } catch (error: any) {
      console.error('Erreur runExportNow:', error);
      toast.error(error.message || 'Erreur lors de l\'exécution de l\'export');
    } finally {
      setRunningExportId(null);
    }
  };

  const addRecipient = () => {
    if (recipientInput.trim() && recipientInput.includes('@')) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, recipientInput.trim()],
      });
      setRecipientInput('');
    }
  };

  const removeRecipient = (email: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== email),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dataType: 'interventions',
      format: 'xlsx',
      frequency: 'weekly',
      scheduledTime: '08:00',
      recipients: [],
      sendToCreator: true,
    });
    setRecipientInput('');
  };

  const getFrequencyLabel = (freq: ExportFrequency) => {
    const labels: Record<ExportFrequency, string> = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      once: 'Une fois',
    };
    return labels[freq];
  };

  const getDataTypeLabel = (type: ExportDataType) => {
    const labels: Record<ExportDataType, string> = {
      interventions: 'Interventions',
      users: 'Utilisateurs',
      rooms: 'Chambres',
      analytics: 'Analytics',
      sla_report: 'Rapport SLA',
      activity_log: 'Journal d\'activité',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exports programmés</h3>
          <p className="text-sm text-muted-foreground">
            Configurez des exports automatiques envoyés par email
          </p>
        </div>
        <Button onClick={() => { console.log('Bouton Nouvel export cliqué'); setShowCreateDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel export
        </Button>
      </div>

      {/* Liste des exports */}
      {exports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Aucun export programmé</h4>
            <p className="text-muted-foreground mb-4">
              Créez votre premier export automatique pour recevoir des rapports par email.
            </p>
            <Button onClick={() => { console.log('Bouton Créer un export cliqué'); setShowCreateDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un export
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exports.map(exp => (
            <Card key={exp.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${exp.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Clock className={`h-5 w-5 ${exp.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{exp.name}</h4>
                        <Badge variant={exp.isActive ? 'default' : 'secondary'}>
                          {exp.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{getDataTypeLabel(exp.dataType)}</span>
                        <span>•</span>
                        <span>{exp.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{getFrequencyLabel(exp.frequency)} à {exp.scheduledTime}</span>
                      </div>
                      {exp.recipients.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{exp.recipients.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={exp.isActive}
                      onCheckedChange={() => handleToggle(exp.id, exp.isActive)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRunNow(exp.id)}
                          disabled={runningExportId === exp.id}
                        >
                          {runningExportId === exp.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Exécution...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Exécuter maintenant
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel export programmé</DialogTitle>
            <DialogDescription>
              Configurez un export automatique qui sera envoyé par email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'export</Label>
              <Input
                placeholder="Ex: Rapport hebdomadaire interventions"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de données</Label>
                <Select
                  value={formData.dataType}
                  onValueChange={value => setFormData({ ...formData, dataType: value as ExportDataType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interventions">Interventions</SelectItem>
                    <SelectItem value="users">Utilisateurs</SelectItem>
                    <SelectItem value="rooms">Chambres</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="sla_report">Rapport SLA</SelectItem>
                    <SelectItem value="activity_log">Journal d'activité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={value => setFormData({ ...formData, format: value as ExportFormat })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value => setFormData({ ...formData, frequency: value as ExportFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="once">Une seule fois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure d'envoi</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  Ajouter
                </Button>
              </div>
              {formData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipients.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>M'envoyer une copie</Label>
              <Switch
                checked={formData.sendToCreator}
                onCheckedChange={checked => setFormData({ ...formData, sendToCreator: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => { console.log('Bouton Créer cliqué dans le dialog exports'); handleCreate(); }} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// CALENDAR INTEGRATION TAB
// ============================================================================

const CalendarIntegrationTab = ({ establishmentId, userId }: TabContentProps) => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider>('ical');
  const [creating, setCreating] = useState(false);
  const [generatingUrl, setGeneratingUrl] = useState<string | null>(null);
  const [feedUrls, setFeedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadIntegrations();
  }, [establishmentId]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await getUserCalendarIntegrations(establishmentId, userId);
      setIntegrations(data);

      // Récupérer les URLs existantes
      const urls: Record<string, string> = {};
      data.forEach((integration: any) => {
        if (integration.feedToken) {
          urls[integration.id] = `https://europe-west1-gestihotel-v2.cloudfunctions.net/getICalFeed?establishmentId=${establishmentId}&token=${integration.feedToken}`;
        }
      });
      setFeedUrls(urls);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const integrationId = await createCalendarIntegration(establishmentId, userId, selectedProvider);
      toast.success('Intégration calendrier créée');
      setShowCreateDialog(false);

      // Si c'est iCal, générer automatiquement l'URL
      if (selectedProvider === 'ical') {
        await handleGenerateFeedUrl(integrationId);
      }

      loadIntegrations();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateFeedUrl = async (integrationId: string) => {
    try {
      setGeneratingUrl(integrationId);

      const functions = getFunctions(undefined, 'europe-west1');
      const generateToken = httpsCallable(functions, 'generateCalendarFeedToken');

      const result = await generateToken({ establishmentId, integrationId });
      const data = result.data as { success: boolean; feedUrl: string; token: string };

      if (data.success) {
        setFeedUrls(prev => ({ ...prev, [integrationId]: data.feedUrl }));
        toast.success('URL de calendrier générée');
      }
    } catch (error: any) {
      console.error('Erreur génération URL:', error);
      toast.error('Erreur lors de la génération de l\'URL');
    } finally {
      setGeneratingUrl(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée dans le presse-papiers');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette intégration calendrier ?')) return;

    try {
      await deleteCalendarIntegration(establishmentId, id);
      toast.success('Intégration supprimée');
      loadIntegrations();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Intégration Calendrier</h3>
          <p className="text-sm text-muted-foreground">
            Synchronisez vos interventions avec votre calendrier externe
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle intégration
        </Button>
      </div>

      {/* Info box */}
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Créez une intégration <strong>Fichier iCal</strong> pour obtenir une URL d'abonnement.
          Vous pourrez ensuite l'ajouter à Google Calendar, Outlook, Apple Calendar ou tout autre calendrier compatible.
        </AlertDescription>
      </Alert>

      {/* Liste des intégrations */}
      {integrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Aucune intégration</h4>
            <p className="text-muted-foreground mb-4">
              Créez une intégration iCal pour synchroniser les interventions avec votre calendrier.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une intégration iCal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map(integration => (
            <Card key={integration.id}>
              <CardContent className="py-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {PROVIDER_ICONS[integration.provider]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {PROVIDER_LABELS[integration.provider]}
                          </h4>
                          <Badge variant={integration.syncEnabled ? 'default' : 'secondary'}>
                            {integration.syncEnabled ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </div>
                        {integration.lastSyncAt && (
                          <p className="text-sm text-muted-foreground">
                            Dernière sync: {integration.lastSyncAt.toDate().toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(integration.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* URL d'abonnement */}
                  {integration.provider === 'ical' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">URL d'abonnement iCal</Label>

                      {feedUrls[integration.id] ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={feedUrls[integration.id]}
                              className="text-xs font-mono"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyUrl(feedUrls[integration.id])}
                              title="Copier l'URL"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Instructions */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                            <p className="font-medium">Comment utiliser cette URL :</p>
                            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                              <li><strong>Google Calendar</strong> : Paramètres → Ajouter un calendrier → À partir d'une URL</li>
                              <li><strong>Outlook</strong> : Ajouter un calendrier → S'abonner à partir du web</li>
                              <li><strong>Apple Calendar</strong> : Fichier → Nouvel abonnement au calendrier</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleGenerateFeedUrl(integration.id)}
                          disabled={generatingUrl === integration.id}
                        >
                          {generatingUrl === integration.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Link2 className="mr-2 h-4 w-4" />
                              Générer l'URL d'abonnement
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle intégration calendrier</DialogTitle>
            <DialogDescription>
              Choisissez le type d'intégration calendrier
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {(['ical', 'google', 'outlook', 'caldav'] as CalendarProvider[]).map(provider => (
              <Card
                key={provider}
                className={`cursor-pointer transition-all ${
                  selectedProvider === provider
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <CardContent className="py-4 text-center">
                  <div className="text-3xl mb-2">{PROVIDER_ICONS[provider]}</div>
                  <h4 className="font-medium">{PROVIDER_LABELS[provider]}</h4>
                  {provider === 'ical' && (
                    <p className="text-xs text-muted-foreground mt-1">Recommandé</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedProvider === 'ical' && (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                L'intégration iCal génère une URL que vous pouvez ajouter à n'importe quel calendrier (Google, Outlook, Apple, etc.).
                Le calendrier sera automatiquement mis à jour avec vos interventions.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// WEBHOOKS TAB
// ============================================================================

const WebhooksTab = ({ establishmentId, userId }: TabContentProps) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST' as HttpMethod,
    events: [] as WebhookEventType[],
    authType: 'none' as 'none' | 'basic' | 'bearer' | 'api_key',
    retryEnabled: true,
    maxRetries: 3,
  });

  const availableEvents: WebhookEventType[] = [
    'intervention.created',
    'intervention.updated',
    'intervention.status_changed',
    'intervention.assigned',
    'intervention.completed',
    'intervention.deleted',
    'intervention.sla_breached',
    'room.status_changed',
    'user.created',
    'message.received',
  ];

  useEffect(() => {
    loadWebhooks();
  }, [establishmentId]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await getWebhooks(establishmentId);
      setWebhooks(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.events.length === 0) {
      toast.error('Sélectionnez au moins un événement');
      return;
    }

    try {
      setCreating(true);
      await createWebhook(establishmentId, userId, {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        events: formData.events,
        authType: formData.authType,
        retryEnabled: formData.retryEnabled,
        maxRetries: formData.maxRetries,
        retryDelay: 60,
        payloadFormat: 'json',
        includeMetadata: true,
        isActive: true,
      });
      toast.success('Webhook créé');
      setShowCreateDialog(false);
      resetForm();
      loadWebhooks();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      setTesting(webhookId);
      const result = await testWebhookById(establishmentId, webhookId);
      if (result.success) {
        toast.success(`Test réussi (${result.statusCode})`);
      } else {
        toast.error(`Échec du test: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Supprimer ce webhook ?')) return;

    try {
      await deleteWebhook(establishmentId, webhookId);
      toast.success('Webhook supprimé');
      loadWebhooks();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleEvent = (event: WebhookEventType) => {
    const events = formData.events.includes(event)
      ? formData.events.filter(e => e !== event)
      : [...formData.events, event];
    setFormData({ ...formData, events });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      events: [],
      authType: 'none',
      retryEnabled: true,
      maxRetries: 3,
    });
  };

  const getEventLabel = (event: WebhookEventType) => {
    return EVENT_LABELS[event] || event;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Envoyez des notifications à vos systèmes externes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau webhook
        </Button>
      </div>

      {/* Liste des webhooks */}
      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Webhook className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Aucun webhook configuré</h4>
            <p className="text-muted-foreground mb-4">
              Créez un webhook pour envoyer des événements à vos systèmes externes.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${webhook.isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Webhook className={`h-5 w-5 ${webhook.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                          {webhook.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        {webhook.lastDeliveryStatus && (
                          <Badge variant={webhook.lastDeliveryStatus === 'success' ? 'outline' : 'destructive'}>
                            {webhook.lastDeliveryStatus === 'success' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {webhook.lastDeliveryStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {webhook.method}
                        </code>
                        <span className="truncate max-w-xs">{webhook.url}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.slice(0, 3).map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {getEventLabel(event)}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testing === webhook.id}
                    >
                      {testing === webhook.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Test
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les logs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(webhook.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau webhook</DialogTitle>
            <DialogDescription>
              Configurez un endpoint pour recevoir les événements
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Nom du webhook</Label>
                <Input
                  placeholder="Ex: Notification Slack"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>URL de l'endpoint</Label>
                <Input
                  type="url"
                  placeholder="https://exemple.com/webhook"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Méthode HTTP</Label>
                  <Select
                    value={formData.method}
                    onValueChange={value => setFormData({ ...formData, method: value as HttpMethod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Authentification</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={value => setFormData({ ...formData, authType: value as typeof formData.authType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Événements déclencheurs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map(event => (
                    <div
                      key={event}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        formData.events.includes(event)
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => toggleEvent(event)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        formData.events.includes(event)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {formData.events.includes(event) && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-xs">{getEventLabel(event)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Retry automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Réessayer en cas d'échec
                  </p>
                </div>
                <Switch
                  checked={formData.retryEnabled}
                  onCheckedChange={checked => setFormData({ ...formData, retryEnabled: checked })}
                />
              </div>

              {formData.retryEnabled && (
                <div className="space-y-2">
                  <Label>Nombre maximum de tentatives</Label>
                  <Select
                    value={formData.maxRetries.toString()}
                    onValueChange={value => setFormData({ ...formData, maxRetries: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 tentative</SelectItem>
                      <SelectItem value="3">3 tentatives</SelectItem>
                      <SelectItem value="5">5 tentatives</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// PDF REPORTS TAB
// ============================================================================

const PdfReportsTab = ({ establishmentId, userId }: TabContentProps) => {
  const [configs, setConfigs] = useState<ReportConfig[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'interventions_summary' as ReportType,
    frequency: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    recipients: [] as string[],
  });
  const [recipientInput, setRecipientInput] = useState('');

  useEffect(() => {
    loadData();
  }, [establishmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configsData, reportsData] = await Promise.all([
        getReportConfigs(establishmentId),
        getGeneratedReports(establishmentId, undefined, 10),
      ]);
      setConfigs(configsData);
      setReports(reportsData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }

    try {
      setCreating(true);
      await createReportConfig(establishmentId, userId, {
        name: formData.name,
        type: formData.type,
        format: 'pdf',
        frequency: formData.frequency,
        isActive: true,
        emailConfig: {
          enabled: formData.recipients.length > 0,
          recipients: formData.recipients,
        },
      });
      toast.success('Configuration de rapport créée');
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async (configId: string) => {
    try {
      setGenerating(configId);
      // Note: La génération complète nécessite de charger les interventions
      // Ceci sera implémenté dans une version future
      toast.info('Génération de rapport en cours de développement');
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Supprimer cette configuration ?')) return;

    try {
      await deleteReportConfig(establishmentId, configId);
      toast.success('Configuration supprimée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const addRecipient = () => {
    if (recipientInput.trim() && recipientInput.includes('@')) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, recipientInput.trim()],
      });
      setRecipientInput('');
    }
  };

  const removeRecipient = (email: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(r => r !== email),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'interventions_summary',
      frequency: 'once',
      recipients: [],
    });
    setRecipientInput('');
  };

  const getReportTypeLabel = (type: ReportType) => {
    return REPORT_TYPE_LABELS[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rapports PDF</h3>
          <p className="text-sm text-muted-foreground">
            Générez et programmez des rapports PDF automatiques
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rapport
        </Button>
      </div>

      {/* Configurations de rapports */}
      {configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Aucun rapport configuré</h4>
            <p className="text-muted-foreground mb-4">
              Créez votre premier rapport PDF automatique.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un rapport
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map(config => (
            <Card key={config.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${config.isActive ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <FileText className={`h-5 w-5 ${config.isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.name}</h4>
                        <Badge variant="outline">
                          {getReportTypeLabel(config.type)}
                        </Badge>
                        {config.frequency !== 'once' && (
                          <Badge variant="secondary">
                            {config.frequency === 'daily' ? 'Quotidien' :
                             config.frequency === 'weekly' ? 'Hebdo' : 'Mensuel'}
                          </Badge>
                        )}
                      </div>
                      {config.emailConfig?.recipients && config.emailConfig.recipients.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{config.emailConfig.recipients.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => config.id && handleGenerate(config.id)}
                      disabled={generating === config.id}
                    >
                      {generating === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Générer
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => config.id && handleDelete(config.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Historique des rapports générés */}
      {reports.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-4">Rapports récents</h4>
            <div className="space-y-2">
              {reports.map(report => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {report.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : report.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{report.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.generatedAt.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {report.fileUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau rapport PDF</DialogTitle>
            <DialogDescription>
              Configurez un rapport automatique
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du rapport</Label>
              <Input
                placeholder="Ex: Rapport mensuel interventions"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de rapport</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => setFormData({ ...formData, type: value as ReportType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interventions_summary">Résumé interventions</SelectItem>
                    <SelectItem value="interventions_detailed">Interventions détaillées</SelectItem>
                    <SelectItem value="sla_compliance">Conformité SLA</SelectItem>
                    <SelectItem value="technician_performance">Performance techniciens</SelectItem>
                    <SelectItem value="room_statistics">Statistiques chambres</SelectItem>
                    <SelectItem value="activity_log">Journal d'activité</SelectItem>
                    <SelectItem value="monthly_recap">Récap mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value => setFormData({ ...formData, frequency: value as typeof formData.frequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Génération manuelle</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Envoi par email (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  Ajouter
                </Button>
              </div>
              {formData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipients.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IntegrationsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { currentEstablishment } = useEstablishments();
  const [activeTab, setActiveTab] = useState('exports');

  // Vérifier si l'utilisateur est Admin
  const isAdmin = hasRole('editor') || hasRole('admin') || hasRole('super_admin');

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentEstablishment) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Veuillez sélectionner un établissement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Intégrations & Automatisations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentEstablishment.name}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/settings')}>
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exports" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Exports</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendrier</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rapports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exports">
          <ExportsScheduleTab
            establishmentId={currentEstablishment.id}
            userId={user!.id}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarIntegrationTab
            establishmentId={currentEstablishment.id}
            userId={user!.id}
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksTab
            establishmentId={currentEstablishment.id}
            userId={user!.id}
          />
        </TabsContent>

        <TabsContent value="reports">
          <PdfReportsTab
            establishmentId={currentEstablishment.id}
            userId={user!.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;
