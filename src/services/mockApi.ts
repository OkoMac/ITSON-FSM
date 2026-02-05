/**
 * Mock API Service
 * Provides demo data when backend is unavailable
 * Used for Netlify deployments and offline demos
 */

import type { User, UserRole } from '@/types';

// Mock users database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@itsonfsm.com': {
    password: 'password123',
    user: {
      id: '1',
      email: 'admin@itsonfsm.com',
      name: 'System Admin',
      role: 'admin' as UserRole,
      avatar: undefined,
      phoneNumber: '+1234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'manager@itsonfsm.com': {
    password: 'password123',
    user: {
      id: '2',
      email: 'manager@itsonfsm.com',
      name: 'Project Manager',
      role: 'manager' as UserRole,
      avatar: undefined,
      phoneNumber: '+1234567891',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'supervisor@itsonfsm.com': {
    password: 'password123',
    user: {
      id: '3',
      email: 'supervisor@itsonfsm.com',
      name: 'Site Supervisor',
      role: 'supervisor' as UserRole,
      avatar: undefined,
      phoneNumber: '+1234567892',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'worker1@itsonfsm.com': {
    password: 'password123',
    user: {
      id: '4',
      email: 'worker1@itsonfsm.com',
      name: 'Field Worker 1',
      role: 'worker' as UserRole,
      avatar: undefined,
      phoneNumber: '+1234567893',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  'worker2@itsonfsm.com': {
    password: 'password123',
    user: {
      id: '5',
      email: 'worker2@itsonfsm.com',
      name: 'Field Worker 2',
      role: 'worker' as UserRole,
      avatar: undefined,
      phoneNumber: '+1234567894',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock JWT token
const generateMockToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

export class MockApiService {
  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string) {
    await delay();

    const userRecord = MOCK_USERS[email.toLowerCase()];

    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid email or password');
    }

    const token = generateMockToken(userRecord.user.id);

    return {
      status: 'success',
      data: {
        token,
        user: {
          id: userRecord.user.id,
          email: userRecord.user.email,
          name: userRecord.user.name,
          role: userRecord.user.role,
          phone: userRecord.user.phoneNumber,
          created_at: userRecord.user.createdAt,
          updated_at: userRecord.user.updatedAt,
        },
      },
    };
  }

  async register(userData: any) {
    await delay();
    throw new Error('Registration is disabled in demo mode. Please use demo credentials.');
  }

  async getMe() {
    await delay();
    const token = localStorage.getItem('token');

    if (!token || !token.startsWith('mock_token_')) {
      throw new Error('Not authenticated');
    }

    // Extract user ID from mock token
    const userId = token.split('_')[2];
    const userRecord = Object.values(MOCK_USERS).find(u => u.user.id === userId);

    if (!userRecord) {
      throw new Error('User not found');
    }

    return {
      status: 'success',
      data: {
        user: {
          id: userRecord.user.id,
          email: userRecord.user.email,
          name: userRecord.user.name,
          role: userRecord.user.role,
          phone: userRecord.user.phoneNumber,
          created_at: userRecord.user.createdAt,
          updated_at: userRecord.user.updatedAt,
        },
      },
    };
  }

  // ==================== SITES ENDPOINTS ====================

  async getSites(params?: any) {
    await delay();
    return {
      status: 'success',
      data: {
        sites: [
          {
            id: '1',
            name: 'Downtown Office Building',
            address: '123 Main St, Downtown',
            status: 'active',
            type: 'office',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Warehouse Facility',
            address: '456 Industrial Ave',
            status: 'active',
            type: 'warehouse',
            created_at: new Date().toISOString(),
          },
        ],
      },
      results: 2,
    };
  }

  async getSite(id: string) {
    await delay();
    return {
      status: 'success',
      data: {
        site: {
          id,
          name: 'Downtown Office Building',
          address: '123 Main St, Downtown',
          status: 'active',
          type: 'office',
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  // ==================== TASKS ENDPOINTS ====================

  async getTasks(params?: any) {
    await delay();
    return {
      status: 'success',
      data: {
        tasks: [
          {
            id: '1',
            title: 'Install HVAC System',
            description: 'Install new HVAC system on 3rd floor',
            status: 'pending',
            priority: 'high',
            site_id: '1',
            assigned_to: '4',
            due_date: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Security System Check',
            description: 'Monthly security system inspection',
            status: 'in_progress',
            priority: 'medium',
            site_id: '2',
            assigned_to: '5',
            due_date: new Date(Date.now() + 172800000).toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
      },
      results: 2,
    };
  }

  async getTask(id: string) {
    await delay();
    return {
      status: 'success',
      data: {
        task: {
          id,
          title: 'Install HVAC System',
          description: 'Install new HVAC system on 3rd floor',
          status: 'pending',
          priority: 'high',
          site_id: '1',
          assigned_to: '4',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  // ==================== ATTENDANCE ENDPOINTS ====================

  async checkIn(data: any) {
    await delay();
    return {
      status: 'success',
      data: {
        attendance: {
          id: Date.now().toString(),
          user_id: data.userId,
          site_id: data.siteId,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
        },
      },
      message: 'Checked in successfully',
    };
  }

  async checkOut(id: string) {
    await delay();
    return {
      status: 'success',
      data: {
        attendance: {
          id,
          check_out_time: new Date().toISOString(),
          status: 'checked_out',
        },
      },
      message: 'Checked out successfully',
    };
  }

  async getAttendance(params?: any) {
    await delay();
    return {
      status: 'success',
      data: {
        attendance: [
          {
            id: '1',
            user_id: '4',
            site_id: '1',
            check_in_time: new Date(Date.now() - 3600000).toISOString(),
            check_out_time: null,
            status: 'checked_in',
          },
        ],
      },
      results: 1,
    };
  }

  // ==================== FALLBACK FOR OTHER ENDPOINTS ====================

  async handleGenericRequest(endpoint: string, options?: any) {
    await delay();
    console.warn(`Mock API: No mock implementation for ${endpoint}`);
    return {
      status: 'success',
      data: {},
      message: 'Demo mode: This feature requires backend deployment',
    };
  }
}

export const mockApi = new MockApiService();
