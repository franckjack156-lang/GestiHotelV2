/**
 * ============================================================================
 * GOOGLE CALENDAR SERVICE
 * ============================================================================
 *
 * Service pour l'intégration Google Calendar avec OAuth2
 */

import { google } from 'googleapis';
import type { Intervention } from '@/features/interventions/types/intervention.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration OAuth2
 */
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Tokens Google OAuth
 */
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

/**
 * Event Google Calendar
 */
export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Configuration de l'intégration Google Calendar
 */
export interface GoogleCalendarIntegration {
  id?: string;
  userId: string;
  establishmentId: string;
  tokens: GoogleTokens;
  calendarId: string; // 'primary' par défaut
  syncEnabled: boolean;
  autoSync: boolean; // Synchronisation automatique des nouvelles interventions
  createdAt: Date;
  updatedAt?: Date;
  lastSyncAt?: Date;
}

// ============================================================================
// CLIENT OAUTH2
// ============================================================================

/**
 * Créer un client OAuth2 avec les credentials
 */
const createOAuth2Client = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Configuration Google OAuth2 manquante. Vérifiez les variables d'environnement."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// ============================================================================
// OAUTH FLOW
// ============================================================================

/**
 * Générer l'URL d'autorisation OAuth pour Google Calendar
 *
 * @param redirectUri - URL de redirection après autorisation
 * @param state - État optionnel pour sécurité CSRF (contient userId et establishmentId)
 * @returns URL d'autorisation Google
 */
export const getAuthUrl = (redirectUri: string, state?: string): string => {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Pour obtenir le refresh_token
    scope: SCOPES,
    redirect_uri: redirectUri,
    state: state, // Pour transmettre userId et establishmentId
    prompt: 'consent', // Force l'affichage du consentement pour obtenir refresh_token
  });
};

/**
 * Échanger le code d'autorisation contre des tokens
 *
 * @param code - Code d'autorisation reçu de Google
 * @param redirectUri - URL de redirection (doit correspondre à celle de getAuthUrl)
 * @returns Tokens OAuth (access_token et refresh_token)
 */
export const getTokensFromCode = async (
  code: string,
  redirectUri: string
): Promise<GoogleTokens> => {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: redirectUri,
  });

  if (!tokens.access_token) {
    throw new Error("Impossible d'obtenir l'access_token");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date || undefined,
  };
};

/**
 * Rafraîchir le token d'accès
 *
 * @param refreshToken - Token de rafraîchissement
 * @returns Nouveaux tokens
 */
export const refreshAccessToken = async (refreshToken: string): Promise<GoogleTokens> => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Impossible de rafraîchir le token');
  }

  return {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || refreshToken,
    scope: credentials.scope || SCOPES.join(' '),
    token_type: credentials.token_type || 'Bearer',
    expiry_date: credentials.expiry_date || undefined,
  };
};

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * Créer un client Calendar API avec les tokens
 */
const createCalendarClient = (tokens: GoogleTokens) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Créer un événement dans Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param event - Données de l'événement
 * @param calendarId - ID du calendrier (par défaut 'primary')
 * @returns ID de l'événement créé
 */
export const createCalendarEvent = async (
  tokens: GoogleTokens,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<string> => {
  const calendar = createCalendarClient(tokens);

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendees: ((event.attendees ?? []) as any[]).map((email: any) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 jour avant
          { method: 'popup', minutes: 30 }, // 30 minutes avant
        ],
      },
    },
  });

  if (!response.data.id) {
    throw new Error("Impossible de créer l'événement");
  }

  return response.data.id;
};

/**
 * Mettre à jour un événement dans Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param eventId - ID de l'événement Google Calendar
 * @param event - Données à mettre à jour
 * @param calendarId - ID du calendrier (par défaut 'primary')
 */
export const updateCalendarEvent = async (
  tokens: GoogleTokens,
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<void> => {
  const calendar = createCalendarClient(tokens);

  const requestBody: any = {};

  if (event.title !== undefined) {
    requestBody.summary = event.title;
  }

  if (event.description !== undefined) {
    requestBody.description = event.description;
  }

  if (event.location !== undefined) {
    requestBody.location = event.location;
  }

  if (event.startTime !== undefined) {
    requestBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: 'Europe/Paris',
    };
  }

  if (event.endTime !== undefined) {
    requestBody.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: 'Europe/Paris',
    };
  }

  if (event.attendees !== undefined) {
    requestBody.attendees = event.attendees.map(email => ({ email }));
  }

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody,
  });
};

/**
 * Supprimer un événement de Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param eventId - ID de l'événement Google Calendar
 * @param calendarId - ID du calendrier (par défaut 'primary')
 */
export const deleteCalendarEvent = async (
  tokens: GoogleTokens,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  const calendar = createCalendarClient(tokens);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
};

/**
 * Récupérer un événement de Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param eventId - ID de l'événement Google Calendar
 * @param calendarId - ID du calendrier (par défaut 'primary')
 * @returns Événement Google Calendar
 */
export const getCalendarEvent = async (
  tokens: GoogleTokens,
  eventId: string,
  calendarId: string = 'primary'
): Promise<any> => {
  const calendar = createCalendarClient(tokens);

  const response = await calendar.events.get({
    calendarId,
    eventId,
  });

  return response.data;
};

// ============================================================================
// INTERVENTION SYNC
// ============================================================================

/**
 * Synchroniser une intervention avec Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param intervention - Intervention à synchroniser
 * @param calendarId - ID du calendrier (par défaut 'primary')
 * @returns ID de l'événement créé
 */
export const syncInterventionToCalendar = async (
  tokens: GoogleTokens,
  intervention: Intervention,
  calendarId: string = 'primary'
): Promise<string> => {
  // Construire l'événement à partir de l'intervention
  const event: CalendarEvent = {
    title: `[${intervention.priority.toUpperCase()}] ${intervention.title}`,
    description: buildInterventionDescription(intervention),
    location: buildInterventionLocation(intervention),
    startTime: intervention.scheduledAt
      ? intervention.scheduledAt.toDate()
      : intervention.createdAt.toDate(),
    endTime: calculateEndTime(intervention),
    attendees: intervention.assignedToIds?.length
      ? [] // On pourrait récupérer les emails des techniciens assignés
      : undefined,
  };

  return createCalendarEvent(tokens, event, calendarId);
};

/**
 * Mettre à jour une intervention dans Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param intervention - Intervention mise à jour
 * @param googleEventId - ID de l'événement Google Calendar
 * @param calendarId - ID du calendrier (par défaut 'primary')
 */
export const updateInterventionInCalendar = async (
  tokens: GoogleTokens,
  intervention: Intervention,
  googleEventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  const event: Partial<CalendarEvent> = {
    title: `[${intervention.priority.toUpperCase()}] ${intervention.title}`,
    description: buildInterventionDescription(intervention),
    location: buildInterventionLocation(intervention),
    startTime: intervention.scheduledAt
      ? intervention.scheduledAt.toDate()
      : intervention.createdAt.toDate(),
    endTime: calculateEndTime(intervention),
  };

  return updateCalendarEvent(tokens, googleEventId, event, calendarId);
};

/**
 * Supprimer une intervention de Google Calendar
 *
 * @param tokens - Tokens OAuth de l'utilisateur
 * @param googleEventId - ID de l'événement Google Calendar
 * @param calendarId - ID du calendrier (par défaut 'primary')
 */
export const deleteInterventionFromCalendar = async (
  tokens: GoogleTokens,
  googleEventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  return deleteCalendarEvent(tokens, googleEventId, calendarId);
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Construire la description de l'événement
 */
const buildInterventionDescription = (intervention: Intervention): string => {
  const lines: string[] = [
    `📋 ${intervention.description}`,
    '',
    `🏷️ Type: ${intervention.type}`,
    `📂 Catégorie: ${intervention.category}`,
    `⚡ Priorité: ${intervention.priority}`,
    `📊 Statut: ${intervention.status}`,
  ];

  if (intervention.roomNumber) {
    lines.push(`🚪 Chambre: ${intervention.roomNumber}`);
  }

  if (intervention.assignedToNames?.length) {
    lines.push(`👤 Assigné à: ${intervention.assignedToNames.join(', ')}`);
  }

  if (intervention.estimatedDuration) {
    lines.push(`⏱️ Durée estimée: ${intervention.estimatedDuration} minutes`);
  }

  if (intervention.internalNotes) {
    lines.push('', `📝 Notes: ${intervention.internalNotes}`);
  }

  // Ajouter un lien vers l'intervention (si on a l'URL de l'app)
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  lines.push('', `🔗 Voir l'intervention: ${appUrl}/app/interventions/${intervention.id}`);

  return lines.join('\n');
};

/**
 * Construire la localisation de l'événement
 */
const buildInterventionLocation = (intervention: Intervention): string => {
  const parts: string[] = [];

  if (intervention.building) {
    parts.push(intervention.building);
  }

  if (intervention.floor !== undefined) {
    parts.push(`Étage ${intervention.floor}`);
  }

  if (intervention.roomNumber) {
    parts.push(`Chambre ${intervention.roomNumber}`);
  }

  if (intervention.location) {
    parts.push(intervention.location);
  }

  return parts.join(', ') || 'Non spécifié';
};

/**
 * Calculer l'heure de fin de l'événement
 */
const calculateEndTime = (intervention: Intervention): Date => {
  const startTime = intervention.scheduledAt
    ? intervention.scheduledAt.toDate()
    : intervention.createdAt.toDate();

  // Utiliser la durée estimée ou 1 heure par défaut
  const durationMinutes = intervention.estimatedDuration || 60;

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);

  return endTime;
};

/**
 * Vérifier si un token est expiré
 */
export const isTokenExpired = (tokens: GoogleTokens): boolean => {
  if (!tokens.expiry_date) {
    return false; // Si pas de date d'expiration, on considère valide
  }

  // Ajouter une marge de 5 minutes
  const expiryWithMargin = tokens.expiry_date - 5 * 60 * 1000;
  return Date.now() >= expiryWithMargin;
};

/**
 * Obtenir des tokens valides (rafraîchit si nécessaire)
 */
export const getValidTokens = async (tokens: GoogleTokens): Promise<GoogleTokens> => {
  if (!isTokenExpired(tokens)) {
    return tokens;
  }

  if (!tokens.refresh_token) {
    throw new Error('Token expiré et pas de refresh_token disponible');
  }

  return refreshAccessToken(tokens.refresh_token);
};
