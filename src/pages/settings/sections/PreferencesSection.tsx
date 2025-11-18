/**
 * ============================================================================
 * PREFERENCES SECTION - Settings Page
 * ============================================================================
 *
 * Section for managing display preferences:
 * - Theme (light/dark/auto)
 * - Theme color
 * - Density
 * - Sidebar settings
 * - Default view
 * - Localization (language, date format, time format)
 *
 * Extracted from Settings.tsx
 */

import { useUserPreferences } from '@/features/users/hooks/useUserPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/lib/utils';
import {
  Monitor,
  Moon,
  Sun,
  Globe,
  Calendar,
  Clock,
  Layout,
  RotateCcw,
  Palette,
  Type,
  Sidebar as SidebarIcon,
  Eye,
  Loader2,
  Check,
  ChevronRight,
  List,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeOptionProps {
  value: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

interface ColorOptionProps {
  value: string;
  color: string;
}

interface DensityOptionProps {
  value: string;
  label: string;
  description: string;
  preview: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreferencesSection = () => {
  const { displayPreferences, updateDisplayPreferences, resetToDefaults, isSaving } =
    useUserPreferences();

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updateDisplayPreferences({ theme });

    // Appliquer immédiatement le thème
    if (
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const ThemeOption = ({ value, icon: Icon, label, description }: ThemeOptionProps) => (
    <button
      onClick={() => handleThemeChange(value as 'light' | 'dark' | 'auto')}
      className={cn(
        'group relative p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105',
        displayPreferences.theme === value
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 shadow-md'
          : 'border-border hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      <Icon
        className={cn(
          'mx-auto mb-2 transition-colors duration-200',
          displayPreferences.theme === value
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-muted-foreground'
        )}
        size={24}
      />
      <div className="text-sm font-semibold mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      {displayPreferences.theme === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-blue-600 rounded-full shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );

  const ColorOption = ({ value, color }: ColorOptionProps) => (
    <button
      onClick={() =>
        updateDisplayPreferences({
          themeColor: value as 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'pink',
        })
      }
      className={cn(
        'group relative p-2.5 border-2 rounded-xl transition-all duration-300 hover:scale-105',
        displayPreferences.themeColor === value
          ? 'border-foreground shadow-md'
          : 'border-border hover:border-muted-foreground'
      )}
    >
      <div className={cn('w-full h-8 rounded-lg', color)} />
      {displayPreferences.themeColor === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-foreground rounded-full shadow-lg">
          <Check className="h-3 w-3 text-background" />
        </div>
      )}
    </button>
  );

  const DensityOption = ({ value, label, description, preview }: DensityOptionProps) => (
    <button
      onClick={() =>
        updateDisplayPreferences({ density: value as 'compact' | 'comfortable' | 'spacious' })
      }
      className={cn(
        'group relative p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105',
        displayPreferences.density === value
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 shadow-md'
          : 'border-border hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      <div className="mb-2">{preview}</div>
      <div className="text-sm font-semibold mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      {displayPreferences.density === value && (
        <div className="absolute -top-2 -right-2 p-1 bg-blue-600 rounded-full shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header avec bouton Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Préférences d'affichage
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez votre expérience utilisateur
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          disabled={isSaving}
          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
        >
          <RotateCcw size={16} className="mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Preview Card - Now at top */}
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50/50 to-violet-50/50 dark:from-blue-950/10 dark:to-violet-950/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Aperçu des préférences</CardTitle>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Enregistrement...
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Thème', value: displayPreferences.theme, icon: Monitor },
              { label: 'Couleur', value: displayPreferences.themeColor || 'blue', icon: Palette },
              { label: 'Densité', value: displayPreferences.density, icon: Type },
              { label: 'Langue', value: displayPreferences.language, icon: Globe },
              { label: 'Format date', value: displayPreferences.dateFormat, icon: Calendar },
              { label: 'Format heure', value: displayPreferences.timeFormat, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="p-2.5 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-xs font-semibold capitalize truncate">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Sections */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <Accordion
            type="multiple"
            defaultValue={['apparence', 'interface', 'localisation']}
            className="space-y-4"
          >
            {/* Section 1: Apparence */}
            <AccordionItem
              value="apparence"
              className="border rounded-xl px-4 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/10 dark:to-purple-950/10"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Apparence</h3>
                    <p className="text-xs text-muted-foreground">Thème, couleurs et densité</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Thème */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Mode d'affichage</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <ThemeOption value="light" icon={Sun} label="Clair" description="Lumineux" />
                    <ThemeOption value="dark" icon={Moon} label="Sombre" description="Sombre" />
                    <ThemeOption value="auto" icon={Monitor} label="Auto" description="Système" />
                  </div>
                </div>

                {/* Couleur d'accent */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Couleur d'accent</h4>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      {
                        value: 'blue',
                        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
                        name: 'Bleu',
                      },
                      {
                        value: 'green',
                        color: 'bg-gradient-to-br from-green-500 to-emerald-600',
                        name: 'Vert',
                      },
                      {
                        value: 'purple',
                        color: 'bg-gradient-to-br from-purple-500 to-violet-600',
                        name: 'Violet',
                      },
                      {
                        value: 'orange',
                        color: 'bg-gradient-to-br from-orange-500 to-amber-600',
                        name: 'Orange',
                      },
                      {
                        value: 'red',
                        color: 'bg-gradient-to-br from-red-500 to-rose-600',
                        name: 'Rouge',
                      },
                      {
                        value: 'pink',
                        color: 'bg-gradient-to-br from-pink-500 to-rose-600',
                        name: 'Rose',
                      },
                    ].map(color => (
                      <ColorOption key={color.value} value={color.value} color={color.color} />
                    ))}
                  </div>
                </div>

                {/* Densité */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Densité de l'interface</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <DensityOption
                      value="compact"
                      label="Compacte"
                      description="Maximise l'espace"
                      preview={
                        <div className="flex flex-col gap-0.5">
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                    <DensityOption
                      value="comfortable"
                      label="Confortable"
                      description="Recommandé"
                      preview={
                        <div className="flex flex-col gap-1.5">
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-1.5 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                    <DensityOption
                      value="spacious"
                      label="Espacé"
                      description="Plus d'espace"
                      preview={
                        <div className="flex flex-col gap-2.5">
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                          <div className="h-2 bg-muted-foreground/40 rounded w-full" />
                        </div>
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Interface */}
            <AccordionItem
              value="interface"
              className="border rounded-xl px-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/10 dark:to-amber-950/10"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm">
                    <Layout className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Interface</h3>
                    <p className="text-xs text-muted-foreground">Menu, vue et affichage</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Sidebar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SidebarIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Menu latéral</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-sm mb-1">Menu réduit par défaut</p>
                        <p className="text-xs text-muted-foreground">
                          Mode icônes uniquement au démarrage
                        </p>
                      </div>
                      <Switch
                        checked={displayPreferences.sidebarCollapsed}
                        onCheckedChange={checked =>
                          updateDisplayPreferences({ sidebarCollapsed: checked })
                        }
                        disabled={isSaving}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-violet-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Vue par défaut */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Vue par défaut</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'list', label: 'Liste', icon: List },
                      { value: 'grid', label: 'Grille', icon: Layout },
                      { value: 'calendar', label: 'Calendrier', icon: Calendar },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          updateDisplayPreferences({
                            defaultView: value as 'grid' | 'list' | 'calendar',
                          })
                        }
                        className={cn(
                          'p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105',
                          displayPreferences.defaultView === value
                            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-md'
                            : 'border-border hover:border-orange-300 dark:hover:border-orange-700'
                        )}
                      >
                        <Icon
                          className={cn(
                            'mx-auto mb-1',
                            displayPreferences.defaultView === value
                              ? 'text-orange-600'
                              : 'text-muted-foreground'
                          )}
                          size={20}
                        />
                        <div className="text-xs font-semibold">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items par page */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Éléments par page</h4>
                  </div>
                  <select
                    id="itemsPerPage"
                    value={displayPreferences.itemsPerPage}
                    onChange={e =>
                      updateDisplayPreferences({ itemsPerPage: parseInt(e.target.value) })
                    }
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-orange-300 dark:hover:border-orange-700 transition-colors focus:ring-2 focus:ring-orange-500/20 text-sm"
                  >
                    <option value="10">10 éléments</option>
                    <option value="20">20 éléments</option>
                    <option value="50">50 éléments</option>
                    <option value="100">100 éléments</option>
                  </select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Localisation */}
            <AccordionItem
              value="localisation"
              className="border rounded-xl px-4 bg-gradient-to-br from-cyan-50/30 to-blue-50/30 dark:from-cyan-950/10 dark:to-blue-950/10"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Localisation</h3>
                    <p className="text-xs text-muted-foreground">Langue, date et heure</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Langue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Langue de l'interface</h4>
                  </div>
                  <select
                    id="language"
                    value={displayPreferences.language}
                    onChange={e => updateDisplayPreferences({ language: e.target.value })}
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors focus:ring-2 focus:ring-cyan-500/20 text-sm"
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                  </select>
                </div>

                {/* Format de date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Format de date</h4>
                  </div>
                  <select
                    id="dateFormat"
                    value={displayPreferences.dateFormat}
                    onChange={e => updateDisplayPreferences({ dateFormat: e.target.value })}
                    className="w-full p-2.5 border-2 rounded-xl bg-background hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors focus:ring-2 focus:ring-cyan-500/20 text-sm"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (31 Déc 2024)</option>
                  </select>
                </div>

                {/* Format d'heure */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Format d'heure</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateDisplayPreferences({ timeFormat: '12h' })}
                      className={cn(
                        'p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105 relative',
                        displayPreferences.timeFormat === '12h'
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 shadow-md'
                          : 'border-border hover:border-cyan-300 dark:hover:border-cyan-700'
                      )}
                    >
                      <div className="font-semibold text-sm">12 heures</div>
                      <div className="text-xs text-muted-foreground mt-1">2:30 PM</div>
                      {displayPreferences.timeFormat === '12h' && (
                        <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-cyan-600" />
                      )}
                    </button>
                    <button
                      onClick={() => updateDisplayPreferences({ timeFormat: '24h' })}
                      className={cn(
                        'p-3 border-2 rounded-xl transition-all duration-300 hover:scale-105 relative',
                        displayPreferences.timeFormat === '24h'
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 shadow-md'
                          : 'border-border hover:border-cyan-300 dark:hover:border-cyan-700'
                      )}
                    >
                      <div className="font-semibold text-sm">24 heures</div>
                      <div className="text-xs text-muted-foreground mt-1">14:30</div>
                      {displayPreferences.timeFormat === '24h' && (
                        <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-cyan-600" />
                      )}
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Debug info - Optional, collapsible */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              Informations de débogage
            </summary>
            <div className="mt-3 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-auto max-h-64">
              <pre>{JSON.stringify(displayPreferences, null, 2)}</pre>
              <hr className="my-3 border-gray-700" />
              <div className="space-y-1">
                <div>HTML Classes: {document.documentElement.className}</div>
                <div>HTML Lang: {document.documentElement.lang}</div>
                <div>
                  --primary:{' '}
                  {getComputedStyle(document.documentElement).getPropertyValue('--primary')}
                </div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};
