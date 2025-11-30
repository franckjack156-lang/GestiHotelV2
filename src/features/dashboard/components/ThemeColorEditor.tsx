/**
 * ThemeColorEditor Component
 *
 * Éditeur de palette de couleurs pour créer/modifier des thèmes personnalisés
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { ColorPalette } from '../types/theme.types';
import { Palette, Download, Upload, RotateCcw } from 'lucide-react';
import { logger } from '@/core/utils/logger';

interface ThemeColorEditorProps {
  colors: ColorPalette;
  onColorsChange: (colors: ColorPalette) => void;
  onReset?: () => void;
  defaultColors?: ColorPalette;
}

export const ThemeColorEditor = ({
  colors,
  onColorsChange,
  onReset,
  defaultColors,
}: ThemeColorEditorProps) => {
  const [activeSection, setActiveSection] = useState<'main' | 'status' | 'charts'>('main');

  const updateColor = (key: keyof ColorPalette | string, value: string) => {
    if (key.startsWith('chart.')) {
      const chartKey = key.split('.')[1] as keyof ColorPalette['chart'];
      onColorsChange({
        ...colors,
        chart: {
          ...colors.chart,
          [chartKey]: value,
        },
      });
    } else {
      onColorsChange({
        ...colors,
        [key]: value,
      });
    }
  };

  const exportColors = () => {
    const blob = new Blob([JSON.stringify(colors, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `color-palette-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importColors = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedColors = JSON.parse(text) as ColorPalette;
        onColorsChange(importedColors);
      } catch (error) {
        logger.error('Erreur import palette:', error);
      }
    };
    input.click();
  };

  const ColorInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = e => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Éditeur de couleurs</h3>
        </div>
        <div className="flex gap-2">
          {defaultColors && onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={importColors}>
            <Upload className="w-4 h-4 mr-1" />
            Importer
          </Button>
          <Button variant="outline" size="sm" onClick={exportColors}>
            <Download className="w-4 h-4 mr-1" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Onglets de section */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('main')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'main'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Couleurs principales
        </button>
        <button
          onClick={() => setActiveSection('status')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'status'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          États & notifications
        </button>
        <button
          onClick={() => setActiveSection('charts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'charts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Graphiques
        </button>
      </div>

      {/* Contenu selon la section active */}
      <div className="grid grid-cols-2 gap-4">
        {activeSection === 'main' && (
          <>
            <ColorInput
              label="Couleur primaire"
              value={colors.primary}
              onChange={value => updateColor('primary', value)}
            />
            <ColorInput
              label="Couleur secondaire"
              value={colors.secondary}
              onChange={value => updateColor('secondary', value)}
            />
            <ColorInput
              label="Couleur d'accent"
              value={colors.accent}
              onChange={value => updateColor('accent', value)}
            />
            <ColorInput
              label="Arrière-plan"
              value={colors.background}
              onChange={value => updateColor('background', value)}
            />
            <ColorInput
              label="Surface"
              value={colors.surface}
              onChange={value => updateColor('surface', value)}
            />
            <ColorInput
              label="Texte principal"
              value={colors.textPrimary}
              onChange={value => updateColor('textPrimary', value)}
            />
            <ColorInput
              label="Texte secondaire"
              value={colors.textSecondary}
              onChange={value => updateColor('textSecondary', value)}
            />
            <ColorInput
              label="Bordure"
              value={colors.border}
              onChange={value => updateColor('border', value)}
            />
            <ColorInput
              label="Séparateur"
              value={colors.divider}
              onChange={value => updateColor('divider', value)}
            />
          </>
        )}

        {activeSection === 'status' && (
          <>
            <ColorInput
              label="Succès"
              value={colors.success}
              onChange={value => updateColor('success', value)}
            />
            <ColorInput
              label="Avertissement"
              value={colors.warning}
              onChange={value => updateColor('warning', value)}
            />
            <ColorInput
              label="Erreur"
              value={colors.error}
              onChange={value => updateColor('error', value)}
            />
            <ColorInput
              label="Information"
              value={colors.info}
              onChange={value => updateColor('info', value)}
            />
          </>
        )}

        {activeSection === 'charts' && (
          <>
            <ColorInput
              label="Graphique - Couleur 1"
              value={colors.chart.color1}
              onChange={value => updateColor('chart.color1', value)}
            />
            <ColorInput
              label="Graphique - Couleur 2"
              value={colors.chart.color2}
              onChange={value => updateColor('chart.color2', value)}
            />
            <ColorInput
              label="Graphique - Couleur 3"
              value={colors.chart.color3}
              onChange={value => updateColor('chart.color3', value)}
            />
            <ColorInput
              label="Graphique - Couleur 4"
              value={colors.chart.color4}
              onChange={value => updateColor('chart.color4', value)}
            />
            <ColorInput
              label="Graphique - Couleur 5"
              value={colors.chart.color5}
              onChange={value => updateColor('chart.color5', value)}
            />
            <ColorInput
              label="Graphique - Couleur 6"
              value={colors.chart.color6}
              onChange={value => updateColor('chart.color6', value)}
            />
          </>
        )}
      </div>

      {/* Aperçu de la palette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aperçu de la palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {activeSection === 'main' && (
              <>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.primary }} />
                  <p className="text-xs text-gray-600 text-center">Primaire</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.secondary }} />
                  <p className="text-xs text-gray-600 text-center">Secondaire</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.accent }} />
                  <p className="text-xs text-gray-600 text-center">Accent</p>
                </div>
                <div className="space-y-1">
                  <div
                    className="h-12 rounded border"
                    style={{ backgroundColor: colors.background }}
                  />
                  <p className="text-xs text-gray-600 text-center">Fond</p>
                </div>
                <div className="space-y-1">
                  <div
                    className="h-12 rounded border"
                    style={{ backgroundColor: colors.surface }}
                  />
                  <p className="text-xs text-gray-600 text-center">Surface</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.textPrimary }} />
                  <p className="text-xs text-gray-600 text-center">Texte</p>
                </div>
              </>
            )}

            {activeSection === 'status' && (
              <>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.success }} />
                  <p className="text-xs text-gray-600 text-center">Succès</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.warning }} />
                  <p className="text-xs text-gray-600 text-center">Alerte</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.error }} />
                  <p className="text-xs text-gray-600 text-center">Erreur</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.info }} />
                  <p className="text-xs text-gray-600 text-center">Info</p>
                </div>
              </>
            )}

            {activeSection === 'charts' && (
              <>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color1 }} />
                  <p className="text-xs text-gray-600 text-center">C1</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color2 }} />
                  <p className="text-xs text-gray-600 text-center">C2</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color3 }} />
                  <p className="text-xs text-gray-600 text-center">C3</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color4 }} />
                  <p className="text-xs text-gray-600 text-center">C4</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color5 }} />
                  <p className="text-xs text-gray-600 text-center">C5</p>
                </div>
                <div className="space-y-1">
                  <div className="h-12 rounded" style={{ backgroundColor: colors.chart.color6 }} />
                  <p className="text-xs text-gray-600 text-center">C6</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
