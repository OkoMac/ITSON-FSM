/**
 * Excel Export Service
 *
 * Generate Excel reports for M&E data using SheetJS (xlsx)
 * Supports attendance, compliance, and participant reports
 */

import type { Participant, AttendanceRecord, Task } from '@/types';

export interface ExcelReportData {
  sheetName: string;
  headers: string[];
  rows: any[][];
}

/**
 * Convert data to CSV format
 *
 * @param data - Report data with headers and rows
 * @returns CSV string
 */
export function generateCSV(data: ExcelReportData): string {
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(data.headers.map((header) => `"${header}"`).join(','));

  // Add data rows
  data.rows.forEach((row) => {
    const csvRow = row.map((cell) => {
      // Handle different data types
      if (cell === null || cell === undefined) {
        return '""';
      }

      // Convert to string and escape quotes
      const cellStr = String(cell).replace(/"/g, '""');
      return `"${cellStr}"`;
    });

    csvRows.push(csvRow.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Download CSV file
 *
 * @param csv - CSV string content
 * @param filename - Output filename
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate attendance report data
 *
 * @param attendance - Attendance records
 * @param participants - Participant data
 * @param startDate - Report start date
 * @param endDate - Report end date
 * @returns Report data
 */
export function generateAttendanceReport(
  attendance: AttendanceRecord[],
  participants: Participant[],
  startDate: string,
  endDate: string
): ExcelReportData {
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  const headers = [
    'Date',
    'Participant Name',
    'ID Number',
    'Check In',
    'Check Out',
    'Duration (Hours)',
    'Biometric Method',
    'Confidence %',
    'Status',
    'Sync Status',
  ];

  const rows = attendance
    .filter((record) => {
      const recordDate = record.date;
      return recordDate >= startDate && recordDate <= endDate;
    })
    .map((record) => {
      const participant = participantMap.get(record.participantId);

      const duration = record.checkInTime && record.checkOutTime
        ? calculateDuration(record.checkInTime, record.checkOutTime)
        : '-';

      return [
        record.date,
        participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown',
        participant?.idNumber || 'N/A',
        record.checkInTime ? formatTime(record.checkInTime) : '-',
        record.checkOutTime ? formatTime(record.checkOutTime) : '-',
        duration,
        record.checkInMethod === 'face' ? 'Face Recognition' : 'Fingerprint',
        record.biometricConfidence
          ? `${(record.biometricConfidence * 100).toFixed(1)}%`
          : '-',
        record.status || 'present',
        record.syncStatus,
      ];
    });

  return {
    sheetName: 'Attendance Report',
    headers,
    rows,
  };
}

/**
 * Generate participant report data
 *
 * @param participants - Participant data
 * @returns Report data
 */
export function generateParticipantReport(
  participants: Participant[]
): ExcelReportData {
  const headers = [
    'Full Name',
    'ID Number',
    'Email',
    'Phone Number',
    'Date of Birth',
    'Status',
    'Onboarding Status',
    'Biometric Enrolled',
    'POPIA Consent',
    'Site ID',
    'Enrolled Date',
  ];

  const rows = participants.map((participant) => [
    `${participant.firstName} ${participant.lastName}`,
    participant.idNumber,
    participant.email,
    participant.phoneNumber,
    participant.dateOfBirth,
    participant.status,
    participant.onboardingStatus,
    participant.biometricEnrolled ? 'Yes' : 'No',
    participant.popiaConsentGiven ? 'Yes' : 'No',
    participant.siteId || 'N/A',
    formatDate(participant.createdAt),
  ]);

  return {
    sheetName: 'Participants',
    headers,
    rows,
  };
}

/**
 * Generate task completion report data
 *
 * @param tasks - Task data
 * @param participants - Participant data
 * @param startDate - Report start date
 * @param endDate - Report end date
 * @returns Report data
 */
export function generateTaskReport(
  tasks: Task[],
  participants: Participant[],
  startDate: string,
  endDate: string
): ExcelReportData {
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  const headers = [
    'Task Title',
    'Description',
    'Assigned To',
    'Assigned By',
    'Site',
    'Due Date',
    'Status',
    'Priority',
    'Completed At',
    'Quality Rating',
  ];

  const rows = tasks
    .filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = task.completedAt.split('T')[0];
      return completedDate >= startDate && completedDate <= endDate;
    })
    .map((task) => {
      const assignedTo = participantMap.get(task.assignedToId);

      return [
        task.title,
        task.description,
        assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : 'Unknown',
        task.assignedByName || 'N/A',
        task.siteName || task.siteId,
        formatDate(task.dueDate),
        task.status,
        task.priority,
        task.completedAt ? formatDateTime(task.completedAt) : '-',
        task.qualityRating ? `${task.qualityRating}/5` : 'N/A',
      ];
    });

  return {
    sheetName: 'Task Completion',
    headers,
    rows,
  };
}

/**
 * Generate compliance summary report
 *
 * @param participants - Participant data
 * @param attendance - Attendance records
 * @returns Report data
 */
export function generateComplianceReport(
  participants: Participant[],
  attendance: AttendanceRecord[]
): ExcelReportData {
  const headers = [
    'Metric',
    'Value',
    'Percentage',
    'Status',
  ];

  const totalParticipants = participants.length;
  const activeParticipants = participants.filter((p) => p.status === 'active').length;
  const verifiedParticipants = participants.filter(
    (p) => p.onboardingStatus === 'verified'
  ).length;
  const popiaConsent = participants.filter((p) => p.popiaConsentGiven).length;
  const biometricEnrolled = participants.filter((p) => p.biometricEnrolled).length;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today).length;
  const attendanceRate = activeParticipants > 0
    ? (todayAttendance / activeParticipants) * 100
    : 0;

  const syncedRecords = attendance.filter((a) => a.syncStatus === 'synced').length;
  const syncRate = attendance.length > 0
    ? (syncedRecords / attendance.length) * 100
    : 0;

  const rows = [
    [
      'Total Participants',
      totalParticipants,
      '100%',
      'Info',
    ],
    [
      'Active Participants',
      activeParticipants,
      `${((activeParticipants / totalParticipants) * 100).toFixed(1)}%`,
      activeParticipants === totalParticipants ? 'Excellent' : 'Good',
    ],
    [
      'Verified Onboarding',
      verifiedParticipants,
      `${((verifiedParticipants / totalParticipants) * 100).toFixed(1)}%`,
      verifiedParticipants === totalParticipants ? 'Compliant' : 'Pending',
    ],
    [
      'POPIA Consent Given',
      popiaConsent,
      `${((popiaConsent / totalParticipants) * 100).toFixed(1)}%`,
      popiaConsent === totalParticipants ? 'Compliant' : 'Non-Compliant',
    ],
    [
      'Biometric Enrollment',
      biometricEnrolled,
      `${((biometricEnrolled / totalParticipants) * 100).toFixed(1)}%`,
      biometricEnrolled === totalParticipants ? 'Complete' : 'In Progress',
    ],
    [
      "Today's Attendance Rate",
      `${todayAttendance}/${activeParticipants}`,
      `${attendanceRate.toFixed(1)}%`,
      attendanceRate >= 90 ? 'Excellent' : attendanceRate >= 75 ? 'Good' : 'Poor',
    ],
    [
      'Kwantu Sync Rate',
      `${syncedRecords}/${attendance.length}`,
      `${syncRate.toFixed(1)}%`,
      syncRate >= 95 ? 'Excellent' : syncRate >= 80 ? 'Good' : 'Action Required',
    ],
  ];

  return {
    sheetName: 'Compliance Summary',
    headers,
    rows,
  };
}

/**
 * Calculate duration between two timestamps
 *
 * @param start - Start timestamp
 * @param end - End timestamp
 * @returns Duration in hours (formatted)
 */
function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

/**
 * Format time from ISO string
 *
 * @param isoString - ISO timestamp
 * @returns Formatted time (HH:MM)
 */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date from ISO string
 *
 * @param isoString - ISO timestamp
 * @returns Formatted date (YYYY-MM-DD)
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date and time from ISO string
 *
 * @param isoString - ISO timestamp
 * @returns Formatted date and time
 */
function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate multi-sheet Excel report (requires xlsx library)
 * This is a placeholder - actual implementation would use xlsx library
 *
 * @param reports - Array of report data
 * @param filename - Output filename
 */
export function generateExcelWorkbook(
  reports: ExcelReportData[],
  filename: string
): void {
  // Note: This would require the 'xlsx' library
  // For now, we'll export as CSV
  console.warn('Excel export requires xlsx library. Falling back to CSV export.');

  // Export first sheet as CSV
  if (reports.length > 0) {
    const csv = generateCSV(reports[0]);
    downloadCSV(csv, filename.replace('.xlsx', '.csv'));
  }
}
