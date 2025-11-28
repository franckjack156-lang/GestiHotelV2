/**
 * Page de documentation utilisateur pour GestiHôtel
 *
 * Guide complet pour utiliser l'application de gestion hôtelière
 */

import { useState } from 'react';
import {
  Book,
  ChevronDown,
  ChevronRight,
  Search,
  Home,
  ClipboardList,
  Users,
  BedDouble,
  Calendar,
  Bell,
  MessageSquare,
  Settings,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { SupportDialog } from '@/shared/components/support';

// Types
interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  subsections?: { id: string; title: string }[];
}

// Composant pour une section pliable
const CollapsibleSection = ({
  section,
  isOpen,
  onToggle,
}: {
  section: DocSection;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <span className="text-indigo-600 dark:text-indigo-400">{section.icon}</span>
        <span className="flex-1 font-semibold text-gray-900 dark:text-white">
          {section.title}
        </span>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 bg-white dark:bg-gray-900 prose dark:prose-invert max-w-none">
          {section.content}
        </div>
      )}
    </div>
  );
};

// Contenu des sections
const sections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Prise en main',
    icon: <Home className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bienvenue sur GestiHôtel</h3>
        <p>
          GestiHôtel est une application de gestion de maintenance hôtelière qui vous permet de
          gérer efficacement les interventions techniques, les chambres, le personnel et la
          communication au sein de votre établissement.
        </p>

        <h4 className="font-semibold mt-6">Première connexion</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Connectez-vous avec vos identifiants (email et mot de passe fournis par
            l&apos;administrateur)
          </li>
          <li>Lors de votre première connexion, vous serez redirigé vers le tableau de bord</li>
          <li>
            Personnalisez votre profil en cliquant sur votre avatar en haut à droite puis
            &quot;Mon profil&quot;
          </li>
        </ol>

        <h4 className="font-semibold mt-6">Navigation principale</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Barre latérale</strong> : Accédez aux différentes sections de l&apos;application
          </li>
          <li>
            <strong>En-tête</strong> : Notifications, recherche globale, changement de thème
          </li>
          <li>
            <strong>Tableau de bord</strong> : Vue d&apos;ensemble de votre activité
          </li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
          <p className="text-blue-800 dark:text-blue-200 flex items-start gap-2">
            <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Astuce :</strong> Utilisez le raccourci{' '}
              <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl+K</kbd>{' '}
              pour ouvrir la recherche rapide depuis n&apos;importe quelle page.
            </span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'interventions',
    title: 'Gestion des interventions',
    icon: <ClipboardList className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Les interventions</h3>
        <p>
          Les interventions sont au cœur de GestiHôtel. Elles représentent toutes les demandes de
          maintenance, réparations ou améliorations à effectuer dans votre établissement.
        </p>

        <h4 className="font-semibold mt-6">Créer une intervention</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Cliquez sur <strong>&quot;Nouvelle intervention&quot;</strong> dans la page Interventions
          </li>
          <li>
            Remplissez les informations obligatoires :
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Titre descriptif</li>
              <li>Type d&apos;intervention (plomberie, électricité, etc.)</li>
              <li>Priorité (basse, normale, haute, urgente, critique)</li>
              <li>Localisation (chambre, étage, bâtiment)</li>
            </ul>
          </li>
          <li>Ajoutez une description détaillée du problème</li>
          <li>Optionnellement, joignez des photos</li>
        </ol>

        <h4 className="font-semibold mt-6">Cycle de vie d&apos;une intervention</h4>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Brouillon</Badge>
          <span>→</span>
          <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
          <span>→</span>
          <Badge className="bg-blue-100 text-blue-800">Assignée</Badge>
          <span>→</span>
          <Badge className="bg-indigo-100 text-indigo-800">En cours</Badge>
          <span>→</span>
          <Badge className="bg-green-100 text-green-800">Terminée</Badge>
          <span>→</span>
          <Badge className="bg-emerald-100 text-emerald-800">Validée</Badge>
        </div>

        <h4 className="font-semibold mt-6">Vue Kanban vs Liste</h4>
        <p>Deux modes d&apos;affichage sont disponibles :</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Kanban</strong> : Visualisez les interventions par colonnes de statut.
            Glissez-déposez pour changer rapidement le statut.
          </li>
          <li>
            <strong>Liste</strong> : Tableau compact avec tri et filtres avancés.
          </li>
        </ul>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
          <p className="text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Important :</strong> Les interventions &quot;validées&quot; et
              &quot;annulées&quot; sont des états finaux et ne peuvent plus être modifiées.
            </span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'users',
    title: 'Gestion des utilisateurs',
    icon: <Users className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Utilisateurs et rôles</h3>
        <p>
          GestiHôtel propose un système de gestion des utilisateurs avec différents niveaux de
          permissions.
        </p>

        <h4 className="font-semibold mt-6">Rôles disponibles</h4>
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200">Super Admin</p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Accès complet à tous les établissements et fonctionnalités. Peut créer des
              établissements et gérer tous les utilisateurs.
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="font-semibold text-indigo-800 dark:text-indigo-200">Admin</p>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Gestion complète d&apos;un établissement : utilisateurs, paramètres, interventions,
              chambres.
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200">Manager</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Supervision des interventions, validation, génération de rapports.
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="font-semibold text-green-800 dark:text-green-200">Technicien</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Exécution des interventions assignées, mise à jour du statut, ajout de commentaires.
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-semibold text-gray-800 dark:text-gray-200">Viewer</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Consultation uniquement. Idéal pour la direction ou les audits.
            </p>
          </div>
        </div>

        <h4 className="font-semibold mt-6">Créer un utilisateur (Admin)</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Accédez à <strong>Utilisateurs → Nouvel utilisateur</strong>
          </li>
          <li>Renseignez l&apos;email et le mot de passe temporaire</li>
          <li>Assignez un rôle et les établissements autorisés</li>
          <li>L&apos;utilisateur recevra ses identifiants par email</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'rooms',
    title: 'Gestion des chambres',
    icon: <BedDouble className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Chambres et équipements</h3>
        <p>
          Gérez l&apos;inventaire des chambres de votre établissement avec leurs caractéristiques et
          équipements.
        </p>

        <h4 className="font-semibold mt-6">Informations d&apos;une chambre</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Numéro</strong> : Identifiant unique de la chambre
          </li>
          <li>
            <strong>Type</strong> : Simple, double, suite, etc.
          </li>
          <li>
            <strong>Étage et bâtiment</strong> : Localisation précise
          </li>
          <li>
            <strong>Équipements</strong> : TV, climatisation, minibar, etc.
          </li>
          <li>
            <strong>Statut</strong> : Disponible, occupée, en maintenance
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Blocage de chambre</h4>
        <p>
          Vous pouvez bloquer une chambre temporairement pour maintenance. Les chambres bloquées
          apparaissent en rouge dans le planning et ne peuvent pas être réservées.
        </p>
      </div>
    ),
  },
  {
    id: 'planning',
    title: 'Planning et calendrier',
    icon: <Calendar className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Planning des interventions</h3>
        <p>
          Le planning offre une vue calendrier de toutes les interventions planifiées et en cours.
        </p>

        <h4 className="font-semibold mt-6">Vues disponibles</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Vue jour</strong> : Détail des interventions par créneau horaire
          </li>
          <li>
            <strong>Vue semaine</strong> : Vue d&apos;ensemble sur 7 jours
          </li>
          <li>
            <strong>Vue mois</strong> : Planification à moyen terme
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Planifier une intervention</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Cliquez sur une date/heure dans le calendrier</li>
          <li>Sélectionnez l&apos;intervention à planifier</li>
          <li>Assignez un technicien si nécessaire</li>
          <li>Définissez la durée estimée</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Système de notifications</h3>
        <p>
          Restez informé en temps réel des événements importants grâce au système de notifications.
        </p>

        <h4 className="font-semibold mt-6">Types de notifications</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Nouvelle intervention</strong> : Une intervention vous est assignée
          </li>
          <li>
            <strong>Changement de statut</strong> : Une intervention que vous suivez change de
            statut
          </li>
          <li>
            <strong>Commentaire</strong> : Quelqu&apos;un commente une de vos interventions
          </li>
          <li>
            <strong>Rappel</strong> : Une intervention planifiée approche
          </li>
          <li>
            <strong>Urgence</strong> : Une intervention critique est créée
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Notifications push (PWA)</h4>
        <p>
          Si vous avez installé l&apos;application en tant que PWA, vous recevrez les notifications
          même lorsque l&apos;application est fermée.
        </p>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
          <p className="text-green-800 dark:text-green-200 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Conseil :</strong> Configurez vos préférences de notification dans Paramètres
              → Notifications pour ne recevoir que les alertes pertinentes.
            </span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'messaging',
    title: 'Messagerie interne',
    icon: <MessageSquare className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Communication d&apos;équipe</h3>
        <p>
          La messagerie interne permet une communication directe et efficace entre les membres de
          l&apos;équipe.
        </p>

        <h4 className="font-semibold mt-6">Fonctionnalités</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Conversations privées</strong> : Échangez en one-to-one avec un collègue
          </li>
          <li>
            <strong>Groupes</strong> : Créez des conversations de groupe par équipe ou projet
          </li>
          <li>
            <strong>Recherche</strong> : Retrouvez facilement d&apos;anciens messages
          </li>
          <li>
            <strong>Indicateurs de présence</strong> : Voyez qui est en ligne
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Démarrer une conversation</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Cliquez sur l&apos;icône &quot;+&quot; dans la messagerie</li>
          <li>Sélectionnez un ou plusieurs destinataires</li>
          <li>Écrivez votre message et envoyez</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'settings',
    title: 'Paramètres',
    icon: <Settings className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configuration de l&apos;application</h3>

        <h4 className="font-semibold mt-6">Paramètres de l&apos;établissement (Admin)</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Informations générales</strong> : Nom, adresse, logo
          </li>
          <li>
            <strong>Listes de référence</strong> : Personnalisez les types d&apos;interventions,
            localisations, etc.
          </li>
          <li>
            <strong>Fonctionnalités</strong> : Activez/désactivez les modules
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Listes de référence</h4>
        <p>
          Les listes de référence permettent de personnaliser les options disponibles dans
          l&apos;application :
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Types d&apos;intervention</li>
          <li>Catégories</li>
          <li>Priorités</li>
          <li>Localisations</li>
          <li>Bâtiments</li>
          <li>Étages</li>
          <li>Types de chambre</li>
          <li>Équipements</li>
        </ul>

        <h4 className="font-semibold mt-6">Préférences personnelles</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Thème</strong> : Clair, sombre ou automatique
          </li>
          <li>
            <strong>Langue</strong> : Français, Anglais, Espagnol
          </li>
          <li>
            <strong>Notifications</strong> : Types et fréquence des alertes
          </li>
          <li>
            <strong>Vue par défaut</strong> : Kanban ou liste pour les interventions
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pwa',
    title: 'Application mobile (PWA)',
    icon: <Smartphone className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Installation sur mobile</h3>
        <p>
          GestiHôtel est une Progressive Web App (PWA) qui peut être installée sur votre smartphone
          comme une application native.
        </p>

        <h4 className="font-semibold mt-6">Installation sur iOS (Safari)</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Ouvrez GestiHôtel dans Safari</li>
          <li>
            Appuyez sur l&apos;icône de partage <ExternalLink className="h-4 w-4 inline" />
          </li>
          <li>
            Faites défiler et appuyez sur &quot;Sur l&apos;écran d&apos;accueil&quot;
          </li>
          <li>Confirmez l&apos;installation</li>
        </ol>

        <h4 className="font-semibold mt-6">Installation sur Android (Chrome)</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Ouvrez GestiHôtel dans Chrome</li>
          <li>
            Une bannière &quot;Installer l&apos;application&quot; apparaît automatiquement
          </li>
          <li>
            Sinon, appuyez sur le menu (⋮) puis &quot;Installer l&apos;application&quot;
          </li>
        </ol>

        <h4 className="font-semibold mt-6">Avantages de la PWA</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Accès rapide</strong> : Icône sur l&apos;écran d&apos;accueil
          </li>
          <li>
            <strong>Mode hors ligne</strong> : Consultez vos données même sans connexion
          </li>
          <li>
            <strong>Notifications push</strong> : Recevez les alertes en temps réel
          </li>
          <li>
            <strong>Mises à jour automatiques</strong> : Toujours la dernière version
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'security',
    title: 'Sécurité et bonnes pratiques',
    icon: <Shield className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sécurité de votre compte</h3>

        <h4 className="font-semibold mt-6">Mot de passe</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>Utilisez un mot de passe fort (min. 8 caractères, majuscules, chiffres)</li>
          <li>Ne partagez jamais votre mot de passe</li>
          <li>Changez votre mot de passe régulièrement</li>
          <li>
            En cas d&apos;oubli, utilisez la fonction &quot;Mot de passe oublié&quot;
          </li>
        </ul>

        <h4 className="font-semibold mt-6">Session</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>Déconnectez-vous après utilisation sur un appareil partagé</li>
          <li>Votre session expire automatiquement après une période d&apos;inactivité</li>
          <li>Vous pouvez voir vos sessions actives dans votre profil</li>
        </ul>

        <h4 className="font-semibold mt-6">Données</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>Vos données sont chiffrées en transit (HTTPS)</li>
          <li>Les données sont hébergées sur des serveurs sécurisés</li>
          <li>Des sauvegardes automatiques sont effectuées quotidiennement</li>
        </ul>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
          <p className="text-red-800 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Attention :</strong> Ne communiquez jamais vos identifiants par email ou
              téléphone. L&apos;équipe GestiHôtel ne vous les demandera jamais.
            </span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'faq',
    title: 'Questions fréquentes',
    icon: <HelpCircle className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">FAQ</h3>

        <div className="space-y-4">
          <div className="border-b pb-4 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment réinitialiser mon mot de passe ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sur la page de connexion, cliquez sur &quot;Mot de passe oublié&quot; et suivez les
              instructions envoyées par email.
            </p>
          </div>

          <div className="border-b pb-4 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Puis-je accéder à plusieurs établissements ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Oui, si votre compte est rattaché à plusieurs établissements, vous pouvez basculer
              entre eux via le sélecteur dans la barre latérale.
            </p>
          </div>

          <div className="border-b pb-4 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment ajouter des photos à une intervention ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Lors de la création ou modification d&apos;une intervention, utilisez le bouton
              &quot;Ajouter des photos&quot; pour prendre une photo ou sélectionner depuis votre
              galerie.
            </p>
          </div>

          <div className="border-b pb-4 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Les données sont-elles synchronisées en temps réel ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Oui, toutes les modifications sont synchronisées en temps réel grâce à Firebase.
              Plusieurs utilisateurs peuvent travailler simultanément.
            </p>
          </div>

          <div className="border-b pb-4 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment exporter mes données ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Les administrateurs peuvent exporter les données au format Excel depuis la page des
              interventions (bouton Export).
            </p>
          </div>

          <div className="pb-4">
            <p className="font-semibold text-gray-900 dark:text-white">
              Comment contacter le support ?
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Envoyez un email à support@gestihotel.com ou utilisez le bouton &quot;Support&quot;
              dans le pied de page.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['getting-started']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setOpenSections(sections.map(s => s.id));
  };

  const collapseAll = () => {
    setOpenSections([]);
  };

  // Filtrer les sections par recherche
  const filteredSections = sections.filter(section => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Book className="h-8 w-8 text-indigo-600" />
            Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Guide complet pour utiliser GestiHôtel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Tout déplier
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Tout replier
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher dans la documentation..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sommaire rapide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sommaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sections.map(section => (
              <Button
                key={section.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!openSections.includes(section.id)) {
                    setOpenSections(prev => [...prev, section.id]);
                  }
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="gap-2"
              >
                {section.icon}
                {section.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {filteredSections.map(section => (
          <div key={section.id} id={section.id}>
            <CollapsibleSection
              section={section}
              isOpen={openSections.includes(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          </div>
        ))}

        {filteredSections.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun résultat pour &quot;{searchQuery}&quot;
            </p>
            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
              Effacer la recherche
            </Button>
          </Card>
        )}
      </div>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Besoin d&apos;aide supplémentaire ?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Notre équipe support est disponible pour vous aider.
              </p>
            </div>
            <SupportDialog>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Contacter le support
              </Button>
            </SupportDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationPage;
