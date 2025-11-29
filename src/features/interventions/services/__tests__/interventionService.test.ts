/**
 * Tests pour interventionService
 *
 * Service critique gérant les interventions (CRUD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createIntervention,
  getIntervention,
  updateIntervention,
  changeStatus,
  assignIntervention,
  deleteIntervention,
  getInterventions,
  subscribeToInterventions,
} from '../interventionService';
import type {
  CreateInterventionData,
  UpdateInterventionData,
  StatusChangeData,
  AssignmentData,
} from '../../types/intervention.types';
import { InterventionPriority, InterventionStatus, InterventionType, InterventionCategory } from '@/shared/types/status.types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  increment: vi.fn((n: number) => n),
}));

// Mock Firebase config
vi.mock('@/core/config/firebase', () => ({
  db: {},
}));

// Mock logger
vi.mock('@/core/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock enrichInterventions
vi.mock('../../utils/enrichInterventions', () => ({
  enrichInterventions: vi.fn((interventions) => Promise.resolve(interventions)),
}));

// Mock other services
vi.mock('../historyService', () => ({
  logStatusChange: vi.fn(),
  logAssignment: vi.fn(),
}));

vi.mock('@/shared/services/notificationService', () => ({
  notifyInterventionAssigned: vi.fn(),
  notifyInterventionUrgent: vi.fn(),
  notifyStatusChanged: vi.fn(),
  notifyInterventionCompleted: vi.fn(),
}));

vi.mock('../slaService', () => ({
  calculateDueDate: vi.fn(() => new Date('2025-01-16T10:00:00Z')),
  SLA_TARGETS: {
    low: 1440,
    normal: 480,
    high: 240,
    urgent: 120,
    critical: 60,
  },
}));

vi.mock('@/features/rooms/services/blockageService', () => ({
  createBlockageFromIntervention: vi.fn(),
  resolveBlockageForIntervention: vi.fn(),
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('interventionService', () => {
  const mockEstablishmentId = 'est-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // createIntervention
  // ===========================================================================

  describe('createIntervention', () => {
    it('devrait créer une intervention avec succès', async () => {
      // Arrange
      const data: CreateInterventionData = {
        title: 'Fuite d\'eau',
        description: 'Fuite dans la salle de bain',
        priority: InterventionPriority.HIGH,
        type: InterventionType.PLUMBING,
        category: InterventionCategory.MAINTENANCE,
        roomNumber: '101',
        floor: 1,
        location: 'Salle de bain',
      };

      const mockDocRef = { id: 'intervention-123' };
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'John Doe',
          email: 'john@example.com',
        }),
      };

      const { addDoc, getDoc, getDocs } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);
      vi.mocked(getDocs).mockResolvedValue({ size: 5, docs: [], empty: true } as any);

      // Act
      const result = await createIntervention(mockEstablishmentId, mockUserId, data);

      // Assert
      expect(result).toBe('intervention-123');
      expect(addDoc).toHaveBeenCalled();
    });

    it('devrait générer une référence unique', async () => {
      // Arrange
      const data: CreateInterventionData = {
        title: 'Test intervention',
        description: 'Test description',
        priority: InterventionPriority.NORMAL,
        type: InterventionType.OTHER,
        category: InterventionCategory.MAINTENANCE,
        location: 'Test location',
      };

      const mockDocRef = { id: 'intervention-456' };
      const { addDoc, getDocs } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDocs).mockResolvedValue({ size: 10, docs: [], empty: false } as any);

      // Act
      const result = await createIntervention(mockEstablishmentId, mockUserId, data);

      // Assert
      expect(result).toBe('intervention-456');
      expect(getDocs).toHaveBeenCalled();
    });

    it('devrait créer une intervention urgente', async () => {
      // Arrange
      const data: CreateInterventionData = {
        title: 'Urgence',
        description: 'Urgence critique',
        priority: InterventionPriority.CRITICAL,
        type: InterventionType.PLUMBING,
        category: InterventionCategory.MAINTENANCE,
        location: 'Emergency location',
        isUrgent: true,
      };

      const mockDocRef = { id: 'intervention-urgent' };
      const { addDoc, getDocs } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDocs).mockResolvedValue({ size: 0, docs: [], empty: true } as any);

      // Act
      const result = await createIntervention(mockEstablishmentId, mockUserId, data);

      // Assert
      expect(result).toBe('intervention-urgent');
      expect(addDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de création', async () => {
      // Arrange
      const data: CreateInterventionData = {
        title: 'Test',
        description: 'Test description',
        priority: InterventionPriority.NORMAL,
        type: InterventionType.OTHER,
        category: InterventionCategory.MAINTENANCE,
        location: 'Test location',
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(
        createIntervention(mockEstablishmentId, mockUserId, data)
      ).rejects.toThrow('Impossible de créer l\'intervention');
    });

    it('devrait assigner les techniciens lors de la création', async () => {
      // Arrange
      const data: CreateInterventionData = {
        title: 'Intervention assignée',
        description: 'Intervention with assignment',
        priority: InterventionPriority.NORMAL,
        type: InterventionType.OTHER,
        category: InterventionCategory.MAINTENANCE,
        location: 'Assignment location',
        assignedToIds: ['tech-1', 'tech-2'],
      };

      const mockDocRef = { id: 'intervention-assigned' };
      const mockTechDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'Technicien',
          email: 'tech@example.com',
        }),
      };

      const { addDoc, getDoc, getDocs } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValue(mockTechDoc as any);
      vi.mocked(getDocs).mockResolvedValue({ size: 0, docs: [], empty: true } as any);

      // Act
      const result = await createIntervention(mockEstablishmentId, mockUserId, data);

      // Assert
      expect(result).toBe('intervention-assigned');
      expect(getDoc).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // getIntervention
  // ===========================================================================

  describe('getIntervention', () => {
    it('devrait récupérer une intervention par ID', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const mockData = {
        title: 'Intervention test',
        status: InterventionStatus.PENDING,
        priority: InterventionPriority.NORMAL,
      };

      const mockDocSnap = {
        exists: () => true,
        id: interventionId,
        data: () => mockData,
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      // Act
      const result = await getIntervention(mockEstablishmentId, interventionId);

      // Assert
      expect(result).toEqual({
        id: interventionId,
        ...mockData,
      });
    });

    it('devrait retourner null si intervention non trouvée', async () => {
      // Arrange
      const mockDocSnap = {
        exists: () => false,
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      // Act
      const result = await getIntervention(mockEstablishmentId, 'non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(
        getIntervention(mockEstablishmentId, 'intervention-123')
      ).rejects.toThrow('Impossible de récupérer l\'intervention');
    });
  });

  // ===========================================================================
  // updateIntervention
  // ===========================================================================

  describe('updateIntervention', () => {
    it('devrait mettre à jour une intervention', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const data: UpdateInterventionData = {
        title: 'Titre mis à jour',
        description: 'Description mise à jour',
        priority: InterventionPriority.HIGH,
      };

      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          createdAt: { toDate: () => new Date() },
        }),
      } as any);

      // Act
      await updateIntervention(mockEstablishmentId, interventionId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait mettre à jour l assignation', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const data: UpdateInterventionData = {
        assignedToIds: ['tech-new'],
      };

      const mockTechDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'Nouveau Technicien',
        }),
      };

      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue(mockTechDoc as any);

      // Act
      await updateIntervention(mockEstablishmentId, interventionId, data);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        updateIntervention(mockEstablishmentId, 'intervention-123', { title: 'Test' })
      ).rejects.toThrow('Impossible de mettre à jour l\'intervention');
    });
  });

  // ===========================================================================
  // changeStatus
  // ===========================================================================

  describe('changeStatus', () => {
    it('devrait changer le statut vers "in_progress"', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const statusData: StatusChangeData = {
        newStatus: InterventionStatus.IN_PROGRESS,
      };

      const mockInterventionDoc = {
        exists: () => true,
        data: () => ({
          status: InterventionStatus.PENDING,
          title: 'Test Intervention',
          createdAt: { toDate: () => new Date('2025-01-15T10:00:00Z') },
        }),
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'John Doe',
          role: 'technician',
        }),
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc)
        .mockResolvedValueOnce(mockInterventionDoc as any)
        .mockResolvedValueOnce(mockUserDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await changeStatus(mockEstablishmentId, interventionId, mockUserId, statusData);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait changer le statut vers "completed"', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const statusData: StatusChangeData = {
        newStatus: InterventionStatus.COMPLETED,
        resolutionNotes: 'Problème résolu',
      };

      const mockInterventionDoc = {
        exists: () => true,
        data: () => ({
          status: InterventionStatus.IN_PROGRESS,
          title: 'Test Intervention',
          createdAt: { toDate: () => new Date('2025-01-15T10:00:00Z') },
          dueDate: { toDate: () => new Date('2025-01-17T10:00:00Z') },
          isBlocking: false,
        }),
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'John Doe',
          role: 'technician',
        }),
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc)
        .mockResolvedValueOnce(mockInterventionDoc as any)
        .mockResolvedValueOnce(mockUserDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await changeStatus(mockEstablishmentId, interventionId, mockUserId, statusData);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait échouer si intervention non trouvée', async () => {
      // Arrange
      const mockInterventionDoc = {
        exists: () => false,
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockInterventionDoc as any);

      // Act & Assert
      await expect(
        changeStatus(mockEstablishmentId, 'non-existent', mockUserId, {
          newStatus: InterventionStatus.COMPLETED,
        })
      ).rejects.toThrow('Intervention non trouvée');
    });

    it('devrait gérer les erreurs de changement de statut', async () => {
      // Arrange
      const mockInterventionDoc = {
        exists: () => true,
        data: () => ({
          status: InterventionStatus.PENDING,
          title: 'Test',
        }),
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockInterventionDoc as any);
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        changeStatus(mockEstablishmentId, 'intervention-123', mockUserId, {
          newStatus: InterventionStatus.COMPLETED,
        })
      ).rejects.toThrow('Impossible de changer le statut');
    });
  });

  // ===========================================================================
  // assignIntervention
  // ===========================================================================

  describe('assignIntervention', () => {
    it('devrait assigner une intervention à un technicien', async () => {
      // Arrange
      const interventionId = 'intervention-123';
      const assignmentData: AssignmentData = {
        technicianId: 'tech-456',
      };

      const mockInterventionDoc = {
        exists: () => true,
        data: () => ({
          title: 'Test Intervention',
          createdAt: { toDate: () => new Date() },
        }),
      };

      const mockTechDoc = {
        exists: () => true,
        data: () => ({
          displayName: 'Technicien Test',
          email: 'tech@example.com',
        }),
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(getDoc)
        .mockResolvedValueOnce(mockInterventionDoc as any)
        .mockResolvedValueOnce(mockTechDoc as any)
        .mockResolvedValueOnce(mockTechDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await assignIntervention(mockEstablishmentId, interventionId, assignmentData, mockUserId);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d assignation', async () => {
      // Arrange
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(
        assignIntervention(
          mockEstablishmentId,
          'intervention-123',
          { technicianId: 'tech-456' },
          mockUserId
        )
      ).rejects.toThrow('Impossible d\'assigner l\'intervention');
    });
  });

  // ===========================================================================
  // deleteIntervention
  // ===========================================================================

  describe('deleteIntervention', () => {
    it('devrait supprimer une intervention (soft delete)', async () => {
      // Arrange
      const interventionId = 'intervention-123';

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      await deleteIntervention(mockEstablishmentId, interventionId, mockUserId);

      // Assert
      expect(updateDoc).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de suppression', async () => {
      // Arrange
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(
        deleteIntervention(mockEstablishmentId, 'intervention-123', mockUserId)
      ).rejects.toThrow('Impossible de supprimer l\'intervention');
    });
  });

  // ===========================================================================
  // getInterventions
  // ===========================================================================

  describe('getInterventions', () => {
    it('devrait récupérer toutes les interventions', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'int-1',
          data: () => ({ title: 'Intervention 1', status: InterventionStatus.PENDING }),
        },
        {
          id: 'int-2',
          data: () => ({ title: 'Intervention 2', status: InterventionStatus.COMPLETED }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      // Act
      const result = await getInterventions(mockEstablishmentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'int-1');
      expect(result[1]).toHaveProperty('id', 'int-2');
    });

    it('devrait filtrer par statut', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'int-1',
          data: () => ({ title: 'Intervention 1', status: InterventionStatus.PENDING }),
        },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      // Act
      const result = await getInterventions(mockEstablishmentId, {
        status: [InterventionStatus.PENDING],
      });

      // Assert
      expect(result).toHaveLength(1);
    });

    it('devrait gérer les erreurs de récupération', async () => {
      // Arrange
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Query failed'));

      // Act & Assert
      await expect(getInterventions(mockEstablishmentId)).rejects.toThrow(
        'Impossible de récupérer les interventions'
      );
    });
  });

  // ===========================================================================
  // subscribeToInterventions
  // ===========================================================================

  describe('subscribeToInterventions', () => {
    it('devrait s abonner aux changements en temps réel', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { onSnapshot } = require('firebase/firestore');
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = subscribeToInterventions(
        mockEstablishmentId,
        undefined,
        undefined,
        undefined,
        onSuccess,
        onError
      );

      // Assert
      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('devrait gérer les erreurs de subscription', () => {
      // Arrange
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { onSnapshot } = require('firebase/firestore');
      vi.mocked(onSnapshot).mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      // Act
      const unsubscribe = subscribeToInterventions(
        mockEstablishmentId,
        undefined,
        undefined,
        undefined,
        onSuccess,
        onError
      );

      // Assert
      expect(onError).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
