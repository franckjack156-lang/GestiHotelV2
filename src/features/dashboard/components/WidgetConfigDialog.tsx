/**
 * WidgetConfigDialog Component
 *
 * Dialogue pour configurer et ajouter des widgets personnalisables
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import type { WidgetConfig, WidgetType, WidgetSize } from '../types/dashboard.types';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

interface WidgetConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (widget: Partial<WidgetConfig>) => Promise<void>;
  widget?: WidgetConfig; // Pour éditer un widget existant
}

export const WidgetConfigDialog = ({
  open,
  onClose,
  onSave,
  widget,
}: WidgetConfigDialogProps) => {
  const isEditing = !!widget;

  const [config, setConfig] = useState<Partial<WidgetConfig>>(widget || {
    title: '',
    type: 'clock',
    dataSource: 'static',
    size: 'medium',
    visible: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!config.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(config);
      toast.success(isEditing ? 'Widget mis à jour' : 'Widget ajouté');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      logger.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigOptions = () => {
    switch (config.type) {
      case 'clock':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={config.clockOptions?.format || '24h'}
                onValueChange={(value: '12h' | '24h' | 'analog') =>
                  setConfig({
                    ...config,
                    clockOptions: { ...config.clockOptions, format: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="12h">12 heures</SelectItem>
                  <SelectItem value="analog">Analogique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Afficher les secondes</Label>
              <Switch
                checked={config.clockOptions?.showSeconds !== false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    clockOptions: { ...config.clockOptions, showSeconds: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Afficher la date</Label>
              <Switch
                checked={config.clockOptions?.showDate !== false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    clockOptions: { ...config.clockOptions, showDate: checked },
                  })
                }
              />
            </div>
          </div>
        );

      case 'quick_links':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de colonnes</Label>
              <Select
                value={String(config.linksOptions?.columns || 2)}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    linksOptions: { ...config.linksOptions, columns: parseInt(value) },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 colonne</SelectItem>
                  <SelectItem value="2">2 colonnes</SelectItem>
                  <SelectItem value="3">3 colonnes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Liens</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newLink = {
                      id: `link-${Date.now()}`,
                      label: 'Nouveau lien',
                      url: 'https://example.com',
                      color: 'blue',
                      openInNewTab: true,
                    };
                    setConfig({
                      ...config,
                      linksOptions: {
                        ...config.linksOptions,
                        links: [...(config.linksOptions?.links || []), newLink],
                      },
                    });
                  }}
                >
                  <Plus size={16} className="mr-1" />
                  Ajouter un lien
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(config.linksOptions?.links || []).map((link, index) => (
                  <div key={link.id} className="flex gap-2 p-2 border rounded">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const newLinks = [...(config.linksOptions?.links || [])];
                        newLinks[index] = { ...link, label: e.target.value };
                        setConfig({
                          ...config,
                          linksOptions: { ...config.linksOptions, links: newLinks },
                        });
                      }}
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...(config.linksOptions?.links || [])];
                        newLinks[index] = { ...link, url: e.target.value };
                        setConfig({
                          ...config,
                          linksOptions: { ...config.linksOptions, links: newLinks },
                        });
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newLinks = (config.linksOptions?.links || []).filter((_, i) => i !== index);
                        setConfig({
                          ...config,
                          linksOptions: { ...config.linksOptions, links: newLinks },
                        });
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'note':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea
                placeholder="Votre note ici..."
                value={config.noteOptions?.content || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    noteOptions: { ...config.noteOptions, content: e.target.value },
                  })
                }
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur de fond</Label>
              <Select
                value={config.noteOptions?.backgroundColor || 'yellow'}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    noteOptions: { ...config.noteOptions, backgroundColor: value, textColor: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Jaune</SelectItem>
                  <SelectItem value="blue">Bleu</SelectItem>
                  <SelectItem value="green">Vert</SelectItem>
                  <SelectItem value="red">Rouge</SelectItem>
                  <SelectItem value="purple">Violet</SelectItem>
                  <SelectItem value="gray">Gris</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille du texte</Label>
              <Select
                value={config.noteOptions?.fontSize || 'medium'}
                onValueChange={(value: 'small' | 'medium' | 'large') =>
                  setConfig({
                    ...config,
                    noteOptions: { ...config.noteOptions, fontSize: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petit</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="large">Grand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL du site</Label>
              <Input
                placeholder="https://example.com"
                value={config.iframeOptions?.url || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    iframeOptions: { ...config.iframeOptions, url: e.target.value },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Autoriser le plein écran</Label>
              <Switch
                checked={config.iframeOptions?.allowFullscreen || false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    iframeOptions: { ...config.iframeOptions, allowFullscreen: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Autoriser les scripts (⚠️ Risque sécurité)</Label>
              <Switch
                checked={config.iframeOptions?.allowScripts || false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    iframeOptions: { ...config.iframeOptions, allowScripts: checked },
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Configuration disponible prochainement pour ce type de widget
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le widget' : 'Ajouter un widget'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                placeholder="Mon widget"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de widget</Label>
              <Select
                value={config.type}
                onValueChange={(value: WidgetType) =>
                  setConfig({ ...config, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clock">Horloge</SelectItem>
                  <SelectItem value="quick_links">Liens rapides</SelectItem>
                  <SelectItem value="button_grid">Grille de boutons</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="custom_list">Liste personnalisée</SelectItem>
                  <SelectItem value="iframe">Site web (iframe)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille</Label>
              <Select
                value={config.size}
                onValueChange={(value: WidgetSize) =>
                  setConfig({ ...config, size: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petit (1/4)</SelectItem>
                  <SelectItem value="medium">Moyen (1/2)</SelectItem>
                  <SelectItem value="large">Grand (3/4)</SelectItem>
                  <SelectItem value="full">Pleine largeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="config" className="pt-4">
            {renderConfigOptions()}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : isEditing ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
