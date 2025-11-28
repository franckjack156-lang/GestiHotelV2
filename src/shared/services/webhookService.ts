/**
 * Service de gestion des Webhooks
 *
 * Permet d'envoyer des notifications vers des systèmes externes
 * - Configuration de webhooks par événement
 * - Retry automatique
 * - Logs et historique
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { logger } from '@/core/utils/logger';

/**
 * Types d'événements déclencheurs
 */
export type WebhookEventType =
  | 'intervention.created'
  | 'intervention.updated'
  | 'intervention.status_changed'
  | 'intervention.assigned'
  | 'intervention.completed'
  | 'intervention.deleted'
  | 'intervention.sla_breached'
  | 'room.status_changed'
  | 'room.blocked'
  | 'room.unblocked'
  | 'user.created'
  | 'user.updated'
  | 'message.received'
  | 'notification.created'
  | 'export.completed'
  | 'custom';

/**
 * Méthodes HTTP supportées
 */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH';

/**
 * Format du payload
 */
export type PayloadFormat = 'json' | 'form' | 'xml';

/**
 * Statut de livraison
 */
export type DeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

/**
 * Configuration d'un webhook
 */
export interface WebhookConfig {
  id: string;
  establishmentId: string;
  name: string;
  description?: string;

  // Configuration de l'endpoint
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  payloadFormat: PayloadFormat;

  // Authentification
  authType?: 'none' | 'basic' | 'bearer' | 'api_key' | 'hmac';
  authConfig?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    hmacSecret?: string;
    hmacHeader?: string;
  };

  // Événements déclencheurs
  events: WebhookEventType[];
  filterConditions?: {
    field: string;
    operator: 'eq' | 'ne' | 'in' | 'contains';
    value: unknown;
  }[];

  // Configuration de retry
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number; // secondes

  // Transformation du payload
  payloadTemplate?: string; // Template personnalisé (JSON)
  includeMetadata: boolean;

  // État
  isActive: boolean;
  lastTriggeredAt?: Timestamp;
  lastDeliveryStatus?: DeliveryStatus;
  successCount: number;
  failureCount: number;

  // Métadonnées
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Log de livraison webhook
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  establishmentId: string;
  eventType: WebhookEventType;

  // Requête
  requestUrl: string;
  requestMethod: HttpMethod;
  requestHeaders: Record<string, string>;
  requestBody: string;

  // Réponse
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;

  // État
  status: DeliveryStatus;
  attempts: number;
  nextRetryAt?: Timestamp;
  error?: string;
  duration?: number; // ms

  // Données source
  sourceId?: string;
  sourceType?: string;

  // Timestamps
  triggeredAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Payload d'événement
 */
export interface WebhookPayload extends Record<string, unknown> {
  event: WebhookEventType;
  timestamp: string;
  establishmentId: string;
  data: Record<string, unknown>;
  metadata?: {
    webhookId: string;
    deliveryId: string;
    attempt: number;
  };
}

// Collection references
const getWebhooksCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'webhooks');

const getDeliveriesCollection = (establishmentId: string) =>
  collection(db, 'establishments', establishmentId, 'webhookDeliveries');

/**
 * Créer un webhook
 */
export const createWebhook = async (
  establishmentId: string,
  userId: string,
  data: Omit<WebhookConfig, 'id' | 'establishmentId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'successCount' | 'failureCount'>
): Promise<string> => {
  try {
    const collectionRef = getWebhooksCollection(establishmentId);

    const webhookData = {
      ...data,
      establishmentId,
      successCount: 0,
      failureCount: 0,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, webhookData);
    logger.info('Webhook créé:', { id: docRef.id, name: data.name, url: data.url });

    return docRef.id;
  } catch (error) {
    logger.error('Erreur création webhook:', error);
    throw error;
  }
};

/**
 * Mettre à jour un webhook
 */
export const updateWebhook = async (
  establishmentId: string,
  webhookId: string,
  data: Partial<WebhookConfig>
): Promise<void> => {
  try {
    const docRef = doc(getWebhooksCollection(establishmentId), webhookId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('Webhook mis à jour:', { id: webhookId });
  } catch (error) {
    logger.error('Erreur mise à jour webhook:', error);
    throw error;
  }
};

/**
 * Supprimer un webhook
 */
export const deleteWebhook = async (
  establishmentId: string,
  webhookId: string
): Promise<void> => {
  try {
    const docRef = doc(getWebhooksCollection(establishmentId), webhookId);
    await deleteDoc(docRef);
    logger.info('Webhook supprimé:', { id: webhookId });
  } catch (error) {
    logger.error('Erreur suppression webhook:', error);
    throw error;
  }
};

/**
 * Récupérer tous les webhooks
 */
export const getWebhooks = async (
  establishmentId: string
): Promise<WebhookConfig[]> => {
  try {
    const collectionRef = getWebhooksCollection(establishmentId);
    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WebhookConfig[];
  } catch (error) {
    logger.error('Erreur récupération webhooks:', error);
    throw error;
  }
};

/**
 * Récupérer les webhooks actifs pour un événement
 */
export const getActiveWebhooksForEvent = async (
  establishmentId: string,
  eventType: WebhookEventType
): Promise<WebhookConfig[]> => {
  try {
    const collectionRef = getWebhooksCollection(establishmentId);
    const q = query(
      collectionRef,
      where('isActive', '==', true),
      where('events', 'array-contains', eventType)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WebhookConfig[];
  } catch (error) {
    logger.error('Erreur récupération webhooks actifs:', error);
    throw error;
  }
};

/**
 * Construire le payload
 */
const buildPayload = (
  webhook: WebhookConfig,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  deliveryId: string,
  attempt: number
): string => {
  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    establishmentId: webhook.establishmentId,
    data,
  };

  if (webhook.includeMetadata) {
    payload.metadata = {
      webhookId: webhook.id,
      deliveryId,
      attempt,
    };
  }

  // Si un template personnalisé est défini, l'utiliser
  if (webhook.payloadTemplate) {
    try {
      const template = JSON.parse(webhook.payloadTemplate);
      return JSON.stringify(replaceTemplateVars(template, payload));
    } catch {
      logger.warn('Template invalide, utilisation du payload par défaut');
    }
  }

  return JSON.stringify(payload);
};

/**
 * Remplacer les variables dans un template
 */
const replaceTemplateVars = (
  template: unknown,
  data: Record<string, unknown>
): unknown => {
  if (typeof template === 'string') {
    // Remplacer {{variable}} par la valeur
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = path.split('.').reduce((obj: Record<string, unknown>, key: string) => obj?.[key] as Record<string, unknown>, data);
      return value !== undefined ? String(value) : '';
    });
  }

  if (Array.isArray(template)) {
    return template.map(item => replaceTemplateVars(item, data));
  }

  if (typeof template === 'object' && template !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = replaceTemplateVars(value, data);
    }
    return result;
  }

  return template;
};

/**
 * Construire les headers avec authentification
 */
const buildHeaders = (webhook: WebhookConfig): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': webhook.payloadFormat === 'json'
      ? 'application/json'
      : webhook.payloadFormat === 'xml'
        ? 'application/xml'
        : 'application/x-www-form-urlencoded',
    'User-Agent': 'GestiHotel-Webhook/1.0',
    ...webhook.headers,
  };

  // Ajouter l'authentification
  if (webhook.authType && webhook.authConfig) {
    switch (webhook.authType) {
      case 'basic':
        if (webhook.authConfig.username && webhook.authConfig.password) {
          const credentials = btoa(`${webhook.authConfig.username}:${webhook.authConfig.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'bearer':
        if (webhook.authConfig.token) {
          headers['Authorization'] = `Bearer ${webhook.authConfig.token}`;
        }
        break;

      case 'api_key':
        if (webhook.authConfig.apiKey) {
          const headerName = webhook.authConfig.apiKeyHeader || 'X-API-Key';
          headers[headerName] = webhook.authConfig.apiKey;
        }
        break;

      case 'hmac':
        // HMAC sera calculé au moment de l'envoi
        break;
    }
  }

  return headers;
};

/**
 * Calculer la signature HMAC
 */
const calculateHmacSignature = async (
  secret: string,
  payload: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Envoyer un webhook
 */
export const sendWebhook = async (
  webhook: WebhookConfig,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  sourceId?: string,
  sourceType?: string
): Promise<WebhookDelivery> => {
  const establishmentId = webhook.establishmentId;

  // Créer l'enregistrement de livraison
  const deliveryRef = await addDoc(getDeliveriesCollection(establishmentId), {
    webhookId: webhook.id,
    establishmentId,
    eventType,
    status: 'pending',
    attempts: 0,
    sourceId,
    sourceType,
    triggeredAt: serverTimestamp(),
  });

  const deliveryId = deliveryRef.id;

  // Construire la requête
  const payload = buildPayload(webhook, eventType, data, deliveryId, 1);
  const headers = buildHeaders(webhook);

  // Ajouter HMAC si configuré
  if (webhook.authType === 'hmac' && webhook.authConfig?.hmacSecret) {
    const signature = await calculateHmacSignature(webhook.authConfig.hmacSecret, payload);
    const headerName = webhook.authConfig.hmacHeader || 'X-Webhook-Signature';
    headers[headerName] = `sha256=${signature}`;
  }

  // Mettre à jour avec les détails de la requête
  await updateDoc(deliveryRef, {
    requestUrl: webhook.url,
    requestMethod: webhook.method,
    requestHeaders: headers,
    requestBody: payload,
  });

  // Envoyer la requête
  const startTime = Date.now();
  let status: DeliveryStatus = 'pending';
  let responseStatus: number | undefined;
  let responseBody: string | undefined;
  let error: string | undefined;

  try {
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: payload,
    });

    responseStatus = response.status;
    responseBody = await response.text();

    if (response.ok) {
      status = 'success';
    } else {
      status = 'failed';
      error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : 'Erreur inconnue';
  }

  const duration = Date.now() - startTime;

  // Mettre à jour la livraison
  const deliveryUpdate: Partial<WebhookDelivery> = {
    status,
    responseStatus,
    responseBody: responseBody?.substring(0, 10000), // Limiter la taille
    attempts: 1,
    duration,
    error,
    completedAt: Timestamp.now(),
  };

  // Configurer le retry si nécessaire
  if (status === 'failed' && webhook.retryEnabled && 1 < webhook.maxRetries) {
    deliveryUpdate.status = 'retrying';
    deliveryUpdate.nextRetryAt = Timestamp.fromDate(
      new Date(Date.now() + webhook.retryDelay * 1000)
    );
  }

  await updateDoc(deliveryRef, deliveryUpdate);

  // Mettre à jour les stats du webhook
  await updateDoc(doc(getWebhooksCollection(establishmentId), webhook.id), {
    lastTriggeredAt: serverTimestamp(),
    lastDeliveryStatus: status,
    successCount: status === 'success' ? webhook.successCount + 1 : webhook.successCount,
    failureCount: status === 'failed' ? webhook.failureCount + 1 : webhook.failureCount,
    updatedAt: serverTimestamp(),
  });

  logger.info('Webhook envoyé:', {
    webhookId: webhook.id,
    deliveryId,
    status,
    duration,
    responseStatus,
  });

  return {
    id: deliveryId,
    webhookId: webhook.id,
    establishmentId,
    eventType,
    requestUrl: webhook.url,
    requestMethod: webhook.method,
    requestHeaders: headers,
    requestBody: payload,
    responseStatus,
    responseBody,
    status,
    attempts: 1,
    error,
    duration,
    triggeredAt: Timestamp.now(),
    completedAt: Timestamp.now(),
  };
};

/**
 * Déclencher les webhooks pour un événement
 */
export const triggerWebhooks = async (
  establishmentId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  sourceId?: string,
  sourceType?: string
): Promise<WebhookDelivery[]> => {
  try {
    const webhooks = await getActiveWebhooksForEvent(establishmentId, eventType);

    if (webhooks.length === 0) {
      return [];
    }

    const deliveries = await Promise.all(
      webhooks.map(webhook =>
        sendWebhook(webhook, eventType, data, sourceId, sourceType)
      )
    );

    logger.info('Webhooks déclenchés:', {
      eventType,
      count: webhooks.length,
      successful: deliveries.filter(d => d.status === 'success').length,
    });

    return deliveries;
  } catch (error) {
    logger.error('Erreur déclenchement webhooks:', error);
    throw error;
  }
};

/**
 * Récupérer l'historique des livraisons
 */
export const getWebhookDeliveries = async (
  establishmentId: string,
  options: {
    webhookId?: string;
    status?: DeliveryStatus;
    limit?: number;
  } = {}
): Promise<WebhookDelivery[]> => {
  try {
    const collectionRef = getDeliveriesCollection(establishmentId);
    let q = query(collectionRef, orderBy('triggeredAt', 'desc'));

    if (options.webhookId) {
      q = query(q, where('webhookId', '==', options.webhookId));
    }

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WebhookDelivery[];
  } catch (error) {
    logger.error('Erreur récupération livraisons:', error);
    throw error;
  }
};

/**
 * Retenter une livraison échouée
 */
export const retryDelivery = async (
  establishmentId: string,
  deliveryId: string
): Promise<WebhookDelivery> => {
  const deliveryRef = doc(getDeliveriesCollection(establishmentId), deliveryId);
  const deliverySnap = await getDoc(deliveryRef);

  if (!deliverySnap.exists()) {
    throw new Error('Livraison non trouvée');
  }

  const delivery = deliverySnap.data() as WebhookDelivery;
  const webhookRef = doc(getWebhooksCollection(establishmentId), delivery.webhookId);
  const webhookSnap = await getDoc(webhookRef);

  if (!webhookSnap.exists()) {
    throw new Error('Webhook non trouvé');
  }

  const webhook = { id: webhookSnap.id, ...webhookSnap.data() } as WebhookConfig;

  // Récupérer les données originales du payload
  const originalPayload = JSON.parse(delivery.requestBody);

  return sendWebhook(
    webhook,
    delivery.eventType,
    originalPayload.data,
    delivery.sourceId,
    delivery.sourceType
  );
};

/**
 * Tester un webhook
 */
export const testWebhook = async (
  webhook: WebhookConfig
): Promise<{ success: boolean; status?: number; response?: string; error?: string; duration: number }> => {
  const testData = {
    test: true,
    message: 'Test webhook depuis GestiHotel',
    timestamp: new Date().toISOString(),
  };

  const payload = JSON.stringify({
    event: 'test',
    timestamp: new Date().toISOString(),
    data: testData,
  });

  const headers = buildHeaders(webhook);

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: payload,
    });

    const responseText = await response.text();
    const duration = Date.now() - startTime;

    return {
      success: response.ok,
      status: response.status,
      response: responseText.substring(0, 1000),
      duration,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
      duration: Date.now() - startTime,
    };
  }
};

/**
 * Labels pour l'UI
 */
export const EVENT_LABELS: Record<WebhookEventType, string> = {
  'intervention.created': 'Intervention créée',
  'intervention.updated': 'Intervention mise à jour',
  'intervention.status_changed': 'Statut intervention changé',
  'intervention.assigned': 'Intervention assignée',
  'intervention.completed': 'Intervention terminée',
  'intervention.deleted': 'Intervention supprimée',
  'intervention.sla_breached': 'SLA dépassé',
  'room.status_changed': 'Statut chambre changé',
  'room.blocked': 'Chambre bloquée',
  'room.unblocked': 'Chambre débloquée',
  'user.created': 'Utilisateur créé',
  'user.updated': 'Utilisateur mis à jour',
  'message.received': 'Message reçu',
  'notification.created': 'Notification créée',
  'export.completed': 'Export terminé',
  'custom': 'Événement personnalisé',
};

export const EVENT_TYPE_CATEGORIES: Record<string, WebhookEventType[]> = {
  'Interventions': [
    'intervention.created',
    'intervention.updated',
    'intervention.status_changed',
    'intervention.assigned',
    'intervention.completed',
    'intervention.deleted',
    'intervention.sla_breached',
  ],
  'Chambres': [
    'room.status_changed',
    'room.blocked',
    'room.unblocked',
  ],
  'Utilisateurs': [
    'user.created',
    'user.updated',
  ],
  'Autres': [
    'message.received',
    'notification.created',
    'export.completed',
    'custom',
  ],
};

/**
 * Tester un webhook par ID
 */
export const testWebhookById = async (
  establishmentId: string,
  webhookId: string
): Promise<{ success: boolean; statusCode?: number; error?: string; duration: number }> => {
  const webhookRef = doc(getWebhooksCollection(establishmentId), webhookId);
  const webhookSnap = await getDoc(webhookRef);

  if (!webhookSnap.exists()) {
    throw new Error('Webhook non trouvé');
  }

  const webhook = { id: webhookSnap.id, ...webhookSnap.data() } as WebhookConfig;
  const result = await testWebhook(webhook);

  return {
    success: result.success,
    statusCode: result.status,
    error: result.error,
    duration: result.duration,
  };
};
