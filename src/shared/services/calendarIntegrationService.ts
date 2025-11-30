/**
 * Service d'intégration calendrier
 *
 * Permet la synchronisation avec Google Calendar, Outlook, etc.
 * - Export d'interventions vers calendrier externe
 * - Import d'événements
 * - Génération de fichiers iCal
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';
import { format, addMinutes } from 'date-fns';
import type { Intervention } from '@/features/interventions/types/intervention.types';

/**
 * Types de calendriers supportés
 */
export type CalendarProvider = 'google' | 'outlook' | 'ical' | 'caldav';

/**
 * Statut de synchronisation
 */
export type SyncStatus = 'pending' | 'synced' | 'error' | 'conflict';

/**
 * Configuration d'intégration calendrier
 */
export interface CalendarIntegration {
  id: string;
  establishmentId: string;
  userId: string;
  provider: CalendarProvider;
  calendarId?: string;
  calendarName?: string;

  // Tokens OAuth
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Timestamp;

  // Configuration de sync
  syncEnabled: boolean;
  syncDirection: 'export' | 'import' | 'bidirectional';
  syncInterventions: boolean;
  syncPlanning: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes

  // Filtres
  filterByStatus?: string[];
  filterByPriority?: string[];
  filterByAssignee?: string[];

  // État
  lastSyncAt?: Timestamp;
  lastSyncStatus?: SyncStatus;
  lastSyncError?: string;
  syncedEventsCount: number;

  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Événement calendrier
 */
export interface CalendarEvent {
  id: string;
  externalId?: string;
  integrationId: string;
  interventionId?: string;

  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;

  // Métadonnées
  color?: string;
  reminders?: number[]; // minutes avant
  attendees?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';

  // Sync
  syncStatus: SyncStatus;
  lastSyncAt?: Timestamp;
  externalUpdatedAt?: Date;
}

/**
 * Format iCalendar (RFC 5545)
 */
interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string;
  dtend: string;
  dtstamp: string;
  categories?: string[];
  status?: string;
  organizer?: string;
  attendees?: string[];
}

// Collection references
const getIntegrationsCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'calendarIntegrations');

/**
 * Créer une intégration calendrier
 */
export const createCalendarIntegration = async (
  establishmentId: string,
  userId: string,
  provider: CalendarProvider,
  config: Partial<CalendarIntegration> = {}
): Promise<string> => {
  try {
    const collectionRef = getIntegrationsCollection(establishmentId);

    const integrationData = {
      establishmentId,
      userId,
      provider,
      syncEnabled: true,
      syncDirection: config.syncDirection || 'export',
      syncInterventions: config.syncInterventions ?? true,
      syncPlanning: config.syncPlanning ?? true,
      autoSync: config.autoSync ?? false,
      syncInterval: config.syncInterval || 60,
      syncedEventsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...config,
    };

    const docRef = await addDoc(collectionRef, integrationData);
    logger.info('Intégration calendrier créée:', { id: docRef.id, provider });

    return docRef.id;
  } catch (error) {
    logger.error('Erreur création intégration:', error);
    throw error;
  }
};

/**
 * Mettre à jour une intégration
 */
export const updateCalendarIntegration = async (
  establishmentId: string,
  integrationId: string,
  data: Partial<CalendarIntegration>
): Promise<void> => {
  try {
    const docRef = doc(getIntegrationsCollection(establishmentId), integrationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Erreur mise à jour intégration:', error);
    throw error;
  }
};

/**
 * Supprimer une intégration
 */
export const deleteCalendarIntegration = async (
  establishmentId: string,
  integrationId: string
): Promise<void> => {
  try {
    const docRef = doc(getIntegrationsCollection(establishmentId), integrationId);
    await deleteDoc(docRef);
    logger.info('Intégration calendrier supprimée:', { id: integrationId });
  } catch (error) {
    logger.error('Erreur suppression intégration:', error);
    throw error;
  }
};

/**
 * Récupérer les intégrations d'un utilisateur
 */
export const getUserCalendarIntegrations = async (
  establishmentId: string,
  userId: string
): Promise<CalendarIntegration[]> => {
  try {
    const collectionRef = getIntegrationsCollection(establishmentId);
    const q = query(collectionRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CalendarIntegration[];
  } catch (error) {
    logger.error('Erreur récupération intégrations:', error);
    throw error;
  }
};

/**
 * Convertir une intervention en événement calendrier
 */
export const interventionToCalendarEvent = (
  intervention: Intervention,
  integrationId: string
): Omit<CalendarEvent, 'id'> => {
  const startTime = intervention.scheduledAt?.toDate() || new Date();
  const duration = intervention.estimatedDuration || 60;
  const endTime = addMinutes(startTime, duration);

  return {
    integrationId,
    interventionId: intervention.id,
    title: `[${intervention.priority.toUpperCase()}] ${intervention.title}`,
    description: [
      intervention.description,
      '',
      `Réf: ${intervention.reference || intervention.id}`,
      `Statut: ${intervention.status}`,
      `Priorité: ${intervention.priority}`,
      intervention.assignedToNames?.length
        ? `Assigné à: ${intervention.assignedToNames.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
    location: [
      intervention.location,
      intervention.roomNumber && `Chambre ${intervention.roomNumber}`,
    ]
      .filter(Boolean)
      .join(' - '),
    startTime,
    endTime,
    allDay: false,
    color: getPriorityColor(intervention.priority),
    reminders: [30, 15], // 30 et 15 minutes avant
    status: intervention.status === 'cancelled' ? 'cancelled' : 'confirmed',
    syncStatus: 'pending',
  };
};

/**
 * Obtenir la couleur par priorité
 */
const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    critical: '#dc2626', // red
    high: '#f97316', // orange
    normal: '#3b82f6', // blue
    low: '#22c55e', // green
  };
  return colors[priority] || '#6b7280';
};

/**
 * Générer un fichier iCalendar (.ics)
 */
export const generateICalFile = (events: CalendarEvent[]): string => {
  const icalEvents = events.map(event =>
    formatICalEvent({
      uid: event.id,
      summary: event.title,
      description: event.description,
      location: event.location,
      dtstart: formatICalDate(event.startTime),
      dtend: formatICalDate(event.endTime),
      dtstamp: formatICalDate(new Date()),
      status: event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
    })
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GestiHotel//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:GestiHotel Interventions',
    ...icalEvents,
    'END:VCALENDAR',
  ].join('\r\n');
};

/**
 * Formater une date en format iCal
 */
const formatICalDate = (date: Date): string => {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
};

/**
 * Formater un événement iCal
 */
const formatICalEvent = (event: ICalEvent): string => {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}@gestihotel.app`,
    `DTSTAMP:${event.dtstamp}`,
    `DTSTART:${event.dtstart}`,
    `DTEND:${event.dtend}`,
    `SUMMARY:${escapeICalString(event.summary)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalString(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalString(event.location)}`);
  }

  if (event.status) {
    lines.push(`STATUS:${event.status}`);
  }

  if (event.categories?.length) {
    lines.push(`CATEGORIES:${event.categories.join(',')}`);
  }

  lines.push('END:VEVENT');

  return lines.join('\r\n');
};

/**
 * Échapper les caractères spéciaux iCal
 */
const escapeICalString = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
};

/**
 * Télécharger un fichier iCal
 */
export const downloadICalFile = (events: CalendarEvent[], filename?: string): void => {
  const icalContent = generateICalFile(events);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `interventions_${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporter des interventions vers un fichier iCal
 */
export const exportInterventionsToICal = (
  interventions: Intervention[],
  filename?: string
): void => {
  const events = interventions
    .filter(i => i.scheduledAt) // Seulement les planifiées
    .map(i => ({
      ...interventionToCalendarEvent(i, 'export'),
      id: i.id,
    })) as CalendarEvent[];

  downloadICalFile(events, filename);
};

/**
 * Générer un lien Google Calendar
 */
export const generateGoogleCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${format(event.startTime, "yyyyMMdd'T'HHmmss")}/${format(event.endTime, "yyyyMMdd'T'HHmmss")}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Générer un lien Outlook Calendar
 */
export const generateOutlookCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    body: event.description || '',
    location: event.location || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Parser un fichier iCal
 */
export const parseICalFile = (content: string): Partial<CalendarEvent>[] => {
  const events: Partial<CalendarEvent>[] = [];
  const lines = content.split(/\r?\n/);

  let currentEvent: Partial<ICalEvent> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.dtstart && currentEvent.dtend) {
        events.push({
          externalId: currentEvent.uid,
          title: currentEvent.summary || 'Sans titre',
          description: currentEvent.description,
          location: currentEvent.location,
          startTime: parseICalDate(currentEvent.dtstart),
          endTime: parseICalDate(currentEvent.dtend),
          allDay: !currentEvent.dtstart.includes('T'),
          syncStatus: 'synced',
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');

      switch (key.split(';')[0]) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          currentEvent.summary = unescapeICalString(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = unescapeICalString(value);
          break;
        case 'LOCATION':
          currentEvent.location = unescapeICalString(value);
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
          currentEvent.dtend = value;
          break;
      }
    }
  }

  return events;
};

/**
 * Parser une date iCal
 */
const parseICalDate = (dateStr: string): Date => {
  // Format: YYYYMMDDTHHMMSSZ ou YYYYMMDD
  if (dateStr.includes('T')) {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const hour = parseInt(dateStr.slice(9, 11));
    const minute = parseInt(dateStr.slice(11, 13));
    const second = parseInt(dateStr.slice(13, 15));

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  } else {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));

    return new Date(year, month, day);
  }
};

/**
 * Déchapper les caractères iCal
 */
const unescapeICalString = (str: string): string => {
  return str.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
};

/**
 * Labels pour l'UI
 */
export const PROVIDER_LABELS: Record<CalendarProvider, string> = {
  google: 'Google Calendar',
  outlook: 'Microsoft Outlook',
  ical: 'Fichier iCal',
  caldav: 'CalDAV',
};

export const PROVIDER_ICONS: Record<CalendarProvider, string> = {
  google: '📅',
  outlook: '📆',
  ical: '📋',
  caldav: '🔄',
};
