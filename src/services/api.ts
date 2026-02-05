/**
 * API Service Layer
 * Handles all communication with the backend API
 * Automatically falls back to mock API when backend is unavailable
 */

import { mockApi } from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';

// Track if backend is available
let backendAvailable: boolean | null = null;
let backendCheckInProgress = false;

interface ApiResponse<T = any> {
  status: string;
  data?: T;
  results?: number;
  message?: string;
}

class ApiService {
  private async checkBackendHealth(): Promise<boolean> {
    // If mock mode is forced, skip health check
    if (USE_MOCK_MODE) {
      return false;
    }

    // If already checking, wait
    if (backendCheckInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return backendAvailable ?? false;
    }

    // If we already know the status, return it
    if (backendAvailable !== null) {
      return backendAvailable;
    }

    backendCheckInProgress = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${API_URL}/health`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(timeoutId);
      backendAvailable = response.ok;
    } catch (error) {
      console.warn('Backend unavailable, switching to mock mode');
      backendAvailable = false;
    } finally {
      backendCheckInProgress = false;
    }

    return backendAvailable;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Backend is working
      backendAvailable = true;
      return data;
    } catch (error: any) {
      console.error('API Request failed:', error);

      // Check if this is a network error (backend unavailable)
      const isNetworkError = error instanceof TypeError ||
                            error.message?.includes('fetch') ||
                            error.message?.includes('network');

      if (isNetworkError && !endpoint.includes('/health')) {
        console.warn('Network error detected, falling back to mock API');
        backendAvailable = false;
        // Don't throw, let the calling method handle mock fallback
      }

      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string) {
    // Check backend health on first login attempt
    if (backendAvailable === null) {
      await this.checkBackendHealth();
    }

    // Use mock API if backend is unavailable
    if (backendAvailable === false) {
      console.info('🎭 Using mock API for login (backend unavailable)');
      return mockApi.login(email, password);
    }

    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false);
    } catch (error) {
      // Fall back to mock API on network error
      if (backendAvailable === false) {
        console.info('🎭 Falling back to mock API after network error');
        return mockApi.login(email, password);
      }
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);
  }

  async getMe() {
    if (backendAvailable === false) {
      return mockApi.getMe();
    }

    try {
      return await this.request('/auth/me');
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getMe();
      }
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ==================== SITES ENDPOINTS ====================

  async getSites(params?: { status?: string; search?: string }) {
    if (backendAvailable === false) {
      return mockApi.getSites(params);
    }

    try {
      const queryParams = new URLSearchParams(params as any).toString();
      return await this.request(`/sites${queryParams ? `?${queryParams}` : ''}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getSites(params);
      }
      throw error;
    }
  }

  async getSite(id: string) {
    if (backendAvailable === false) {
      return mockApi.getSite(id);
    }

    try {
      return await this.request(`/sites/${id}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getSite(id);
      }
      throw error;
    }
  }

  async createSite(siteData: any) {
    return this.request('/sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  }

  async updateSite(id: string, siteData: any) {
    return this.request(`/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(siteData),
    });
  }

  async deleteSite(id: string) {
    return this.request(`/sites/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== TASKS ENDPOINTS ====================

  async getTasks(params?: {
    status?: string;
    priority?: string;
    siteId?: string;
    assignedToId?: string;
    search?: string;
  }) {
    if (backendAvailable === false) {
      return mockApi.getTasks(params);
    }

    try {
      const queryParams = new URLSearchParams(params as any).toString();
      return await this.request(`/tasks${queryParams ? `?${queryParams}` : ''}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getTasks(params);
      }
      throw error;
    }
  }

  async getTask(id: string) {
    if (backendAvailable === false) {
      return mockApi.getTask(id);
    }

    try {
      return await this.request(`/tasks/${id}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getTask(id);
      }
      throw error;
    }
  }

  async getMyTasks() {
    return this.request('/tasks/my-tasks');
  }

  async createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  async approveTask(id: string, data?: { qualityRating?: number; feedback?: string }) {
    return this.request(`/tasks/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        qualityRating: data?.qualityRating,
        supervisorFeedback: data?.feedback
      }),
    });
  }

  async rejectTask(id: string, data: { feedback: string }) {
    return this.request(`/tasks/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ supervisorFeedback: data.feedback }),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== ATTENDANCE ENDPOINTS ====================

  async checkIn(data: {
    siteId: string;
    checkInLocation: { latitude: number; longitude: number; accuracy: number };
    checkInMethod: 'face' | 'fingerprint';
    checkInPhoto?: string;
    biometricConfidence?: number;
  }) {
    if (backendAvailable === false) {
      return mockApi.checkIn(data);
    }

    try {
      return await this.request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.checkIn(data);
      }
      throw error;
    }
  }

  async checkOut(data: {
    checkOutLocation: { latitude: number; longitude: number; accuracy: number };
    checkOutMethod: 'face' | 'fingerprint';
    checkOutPhoto?: string;
  }) {
    if (backendAvailable === false) {
      return mockApi.checkOut('1');
    }

    try {
      return await this.request('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.checkOut('1');
      }
      throw error;
    }
  }

  async getMyAttendance(params?: { startDate?: string; endDate?: string }) {
    if (backendAvailable === false) {
      return mockApi.getAttendance(params);
    }

    try {
      const queryParams = new URLSearchParams(params as any).toString();
      return await this.request(`/attendance/my-attendance${queryParams ? `?${queryParams}` : ''}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getAttendance(params);
      }
      throw error;
    }
  }

  async getTodayStatus() {
    if (backendAvailable === false) {
      return { status: 'success', data: { hasCheckedIn: false } };
    }

    try {
      return await this.request('/attendance/today-status');
    } catch (error) {
      if (backendAvailable === false) {
        return { status: 'success', data: { hasCheckedIn: false } };
      }
      throw error;
    }
  }

  async getAttendance(params?: {
    participantId?: string;
    siteId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    if (backendAvailable === false) {
      return mockApi.getAttendance(params);
    }

    try {
      const queryParams = new URLSearchParams(params as any).toString();
      return await this.request(`/attendance${queryParams ? `?${queryParams}` : ''}`);
    } catch (error) {
      if (backendAvailable === false) {
        return mockApi.getAttendance(params);
      }
      throw error;
    }
  }

  async getAttendanceStats(params?: {
    participantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/attendance/stats${queryParams ? `?${queryParams}` : ''}`);
  }

  // ==================== PARTICIPANTS ENDPOINTS ====================

  async getParticipants(params?: {
    status?: string;
    siteId?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/participants${queryParams ? `?${queryParams}` : ''}`);
  }

  async getParticipant(id: string) {
    return this.request(`/participants/${id}`);
  }

  async getMyProfile() {
    return this.request('/participants/my-profile');
  }

  async createParticipant(participantData: any) {
    return this.request('/participants', {
      method: 'POST',
      body: JSON.stringify(participantData),
    });
  }

  async updateParticipant(id: string, participantData: any) {
    return this.request(`/participants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(participantData),
    });
  }

  async enrollBiometric(id: string, biometricData: any) {
    return this.request(`/participants/${id}/enroll-biometric`, {
      method: 'POST',
      body: JSON.stringify({ biometricData }),
    });
  }

  async uploadDocument(id: string, documentType: string, documentUrl: string) {
    return this.request(`/participants/${id}/upload-document`, {
      method: 'POST',
      body: JSON.stringify({ documentType, documentUrl }),
    });
  }

  async getParticipantStats() {
    return this.request('/participants/stats');
  }

  // ==================== FILE UPLOAD ENDPOINTS ====================

  async uploadFile(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/upload/multiple`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Multiple file upload failed:', error);
      throw error;
    }
  }

  // ==================== WHATSAPP ENDPOINTS ====================

  async getWhatsAppSessions(params?: { status?: string; search?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/whatsapp/sessions${queryParams ? `?${queryParams}` : ''}`);
  }

  async getWhatsAppSession(id: string) {
    return this.request(`/whatsapp/sessions/${id}`);
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    return this.request('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message }),
    });
  }
}

export const api = new ApiService();
export default api;
