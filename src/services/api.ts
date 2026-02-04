/**
 * API Service Layer
 * Handles all communication with the backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  status: string;
  data?: T;
  results?: number;
  message?: string;
}

class ApiService {
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

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
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
    return this.request('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ==================== SITES ENDPOINTS ====================

  async getSites(params?: { status?: string; search?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/sites${queryParams ? `?${queryParams}` : ''}`);
  }

  async getSite(id: string) {
    return this.request(`/sites/${id}`);
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
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/tasks${queryParams ? `?${queryParams}` : ''}`);
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
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
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkOut(data: {
    checkOutLocation: { latitude: number; longitude: number; accuracy: number };
    checkOutMethod: 'face' | 'fingerprint';
    checkOutPhoto?: string;
  }) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAttendance(params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/attendance/my-attendance${queryParams ? `?${queryParams}` : ''}`);
  }

  async getTodayStatus() {
    return this.request('/attendance/today-status');
  }

  async getAttendance(params?: {
    participantId?: string;
    siteId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/attendance${queryParams ? `?${queryParams}` : ''}`);
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
