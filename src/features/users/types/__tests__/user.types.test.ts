/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ============================================================================
 * USER TYPES - Tests
 * ============================================================================
 *
 * Tests pour valider les types et enums utilisateurs
 */

import { describe, it, expect } from 'vitest';
import { UserStatus } from '../user.types';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  UserSortOptions,
} from '../user.types';

describe('User Types', () => {
  describe('UserStatus Enum', () => {
    it('should have all status values', () => {
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
      expect(UserStatus.PENDING).toBe('pending');
      expect(UserStatus.SUSPENDED).toBe('suspended');
      expect(UserStatus.BANNED).toBe('banned');
    });

    it('should have exactly 5 status values', () => {
      const statusValues = Object.values(UserStatus);
      expect(statusValues).toHaveLength(5);
    });
  });

  describe('User Interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'manager' as any,
        establishmentIds: ['est-1'],
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should allow optional fields', () => {
      const user: Partial<User> = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
        phoneNumber: '+33612345678',
        photoURL: 'https://example.com/photo.jpg',
        isTechnician: true,
      };

      expect(user.phoneNumber).toBeDefined();
      expect(user.photoURL).toBeDefined();
      expect(user.isTechnician).toBe(true);
    });
  });

  describe('CreateUserData Interface', () => {
    it('should accept valid create user data', () => {
      const data: CreateUserData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'manager' as any,
        establishmentIds: ['est-1'],
      };

      expect(data.email).toBe('new@example.com');
      expect(data.password).toBe('SecurePass123!');
    });

    it('should allow optional fields in create data', () => {
      const data: CreateUserData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'manager' as any,
        establishmentIds: ['est-1'],
        phoneNumber: '+33612345678',
        jobTitle: 'Manager',
        department: 'IT',
        isTechnician: true,
        skills: ['maintenance', 'electrical'],
        sendInvitation: true,
      };

      expect(data.phoneNumber).toBeDefined();
      expect(data.jobTitle).toBe('Manager');
      expect(data.skills).toHaveLength(2);
    });
  });

  describe('UpdateUserData Interface', () => {
    it('should accept partial update data', () => {
      const data: UpdateUserData = {
        firstName: 'Updated',
        phoneNumber: '+33698765432',
      };

      expect(data.firstName).toBe('Updated');
      expect(data.phoneNumber).toBe('+33698765432');
    });

    it('should allow all optional fields', () => {
      const data: UpdateUserData = {
        firstName: 'Updated',
        lastName: 'User',
        phoneNumber: '+33612345678',
        jobTitle: 'Senior Manager',
        department: 'Operations',
        status: UserStatus.ACTIVE,
        isActive: true,
      };

      expect(Object.keys(data).length).toBeGreaterThan(0);
    });
  });

  describe('UserFilters Interface', () => {
    it('should accept valid filter options', () => {
      const filters: UserFilters = {
        search: 'John',
        role: 'manager' as any,
        status: UserStatus.ACTIVE,
        establishmentId: 'est-1',
        activeOnly: true,
      };

      expect(filters.search).toBe('John');
      expect(filters.activeOnly).toBe(true);
    });

    it('should allow array of roles and statuses', () => {
      const filters: UserFilters = {
        role: ['manager', 'admin'] as any,
        status: [UserStatus.ACTIVE, UserStatus.PENDING],
      };

      expect(Array.isArray(filters.role)).toBe(true);
      expect(Array.isArray(filters.status)).toBe(true);
    });

    it('should allow empty filters', () => {
      const filters: UserFilters = {};
      expect(filters).toBeDefined();
    });
  });

  describe('UserSortOptions Interface', () => {
    it('should accept valid sort options', () => {
      const sort: UserSortOptions = {
        field: 'displayName',
        direction: 'asc',
      };

      expect(sort.field).toBe('displayName');
      expect(sort.direction).toBe('asc');
    });

    it('should accept all valid sort fields', () => {
      const fields: Array<UserSortOptions['field']> = [
        'displayName',
        'email',
        'createdAt',
        'lastLoginAt',
        'role',
      ];

      fields.forEach(field => {
        const sort: UserSortOptions = {
          field,
          direction: 'desc',
        };
        expect(sort.field).toBe(field);
      });
    });

    it('should accept both sort directions', () => {
      const sortAsc: UserSortOptions = {
        field: 'email',
        direction: 'asc',
      };

      const sortDesc: UserSortOptions = {
        field: 'email',
        direction: 'desc',
      };

      expect(sortAsc.direction).toBe('asc');
      expect(sortDesc.direction).toBe('desc');
    });
  });

  describe('Type Safety', () => {
    it('should enforce required fields in User', () => {
      // Ce test vérifie que TypeScript compile correctement
      const user: User = {
        id: 'test',
        email: 'test@example.com',
        displayName: 'Test',
        firstName: 'Test',
        lastName: 'User',
        role: 'manager' as any,
        establishmentIds: [],
        status: UserStatus.ACTIVE,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user).toBeDefined();
    });

    it('should enforce required fields in CreateUserData', () => {
      const data: CreateUserData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        role: 'manager' as any,
        establishmentIds: [],
      };

      expect(data).toBeDefined();
    });

    it('should allow all fields to be optional in UpdateUserData', () => {
      const data: UpdateUserData = {};
      expect(data).toBeDefined();
    });
  });
});
