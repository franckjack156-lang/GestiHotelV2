/**
 * ============================================================================
 * ABOUT SECTION - Settings Page
 * ============================================================================
 *
 * Section displaying application information:
 * - Version
 * - Release date
 * - License
 * - Developer
 * - Language support
 *
 * Extracted from Settings.tsx
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Info, Calendar, Shield, Building, Globe, Building2 } from 'lucide-react';

// ============================================================================
// COMPONENT
// ============================================================================

export const AboutSection = () => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 shadow-sm">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">À propos</CardTitle>
          </div>
        </div>
        <CardDescription className="text-base">Informations sur l'application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo et version */}
        <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              GestiHôtel v2
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                Version 2.0.0
              </span>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                Stable
              </span>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">Date de sortie</h4>
            </div>
            <p className="text-sm text-muted-foreground">Janvier 2024</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold">Licence</h4>
            </div>
            <p className="text-sm text-muted-foreground">Propriétaire</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold">Développeur</h4>
            </div>
            <p className="text-sm text-muted-foreground">GestiHôtel Team</p>
          </div>

          <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-cyan-600" />
              <h4 className="font-semibold">Langue</h4>
            </div>
            <p className="text-sm text-muted-foreground">Multi-langue (FR, EN, ES, DE)</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">© 2024 GestiHôtel. Tous droits réservés.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Plateforme de gestion hôtelière complète
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
