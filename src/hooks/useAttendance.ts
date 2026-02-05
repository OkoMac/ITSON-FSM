import { useState, useEffect } from 'react';
import api from '@/services/api';

interface AttendanceRecord {
  id: string;
  participantId: string;
  participantName?: string;
  siteId: string;
  siteName?: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation: { latitude: number; longitude: number; accuracy: number };
  checkOutLocation?: { latitude: number; longitude: number; accuracy: number };
  checkInMethod: 'face' | 'fingerprint' | 'manual';
  checkOutMethod?: 'face' | 'fingerprint' | 'manual';
  biometricConfidence?: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseAttendanceResult {
  records: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkIn: (data: {
    siteId: string;
    checkInLocation: { latitude: number; longitude: number; accuracy: number };
    checkInMethod: 'face' | 'fingerprint';
    biometricConfidence?: number;
  }) => Promise<AttendanceRecord>;
  checkOut: (data: {
    checkOutLocation: { latitude: number; longitude: number; accuracy: number };
    checkOutMethod: 'face' | 'fingerprint';
  }) => Promise<AttendanceRecord>;
  getTodayStatus: () => Promise<{ isCheckedIn: boolean; record?: AttendanceRecord }>;
}

export const useAttendance = (filters?: {
  participantId?: string;
  siteId?: string;
  startDate?: string;
  endDate?: string;
}): UseAttendanceResult => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getAttendance(filters) as any;

      // Map backend response to frontend type
      const mappedRecords: AttendanceRecord[] = (response.data?.records || []).map((record: any) => ({
        id: record.id,
        participantId: record.participant_id,
        participantName: record.participant?.full_name,
        siteId: record.site_id,
        siteName: record.site?.name,
        date: record.date,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        checkInLocation: record.check_in_location,
        checkOutLocation: record.check_out_location,
        checkInMethod: record.check_in_method,
        checkOutMethod: record.check_out_method,
        biometricConfidence: record.biometric_confidence,
        status: record.status,
        notes: record.notes,
        synced: record.synced,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));

      setRecords(mappedRecords);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
      console.error('Error fetching attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async (data: {
    siteId: string;
    checkInLocation: { latitude: number; longitude: number; accuracy: number };
    checkInMethod: 'face' | 'fingerprint';
    biometricConfidence?: number;
  }): Promise<AttendanceRecord> => {
    try {
      const response = await api.checkIn(data) as any;
      await fetchRecords(); // Refresh the list
      return response.data?.attendance;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to check in');
    }
  };

  const checkOut = async (data: {
    checkOutLocation: { latitude: number; longitude: number; accuracy: number };
    checkOutMethod: 'face' | 'fingerprint';
  }): Promise<AttendanceRecord> => {
    try {
      const response = await api.checkOut(data) as any;
      await fetchRecords(); // Refresh the list
      return response.data?.attendance;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to check out');
    }
  };

  const getTodayStatus = async (): Promise<{
    isCheckedIn: boolean;
    record?: AttendanceRecord;
  }> => {
    try {
      const response = await api.getTodayStatus() as any;
      return {
        isCheckedIn: response.data?.is_checked_in || false,
        record: response.data?.record,
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to get today status');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [JSON.stringify(filters)]);

  return {
    records,
    isLoading,
    error,
    refetch: fetchRecords,
    checkIn,
    checkOut,
    getTodayStatus,
  };
};
