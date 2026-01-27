/**
 * Advanced Reporting & Reference Letters
 *
 * Monthly summaries, reference letters, detailed tracking
 */

import { db } from '@/utils/db';
import type { Participant, AttendanceRecord } from '@/types';

export interface MonthlyAttendanceSummary {
  participantId: string;
  participantName: string;
  month: string; // YYYY-MM
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  attendanceRate: number; // percentage
  lateArrivals: number;
  earlyDepartures: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
}

export interface ReferenceLetter {
  id: string;
  participantId: string;
  participantName: string;
  idNumber: string;
  position: string;
  startDate: string;
  endDate: string;
  siteName: string;
  performanceSummary: string;
  skills: string[];
  attendance: {
    rate: number;
    reliability: 'excellent' | 'good' | 'fair' | 'poor';
  };
  conduct: string;
  achievements: string[];
  signedBy: string;
  signedByTitle: string;
  generatedAt: string;
  letterHtml: string;
}

/**
 * Generate monthly attendance summary
 */
export async function generateMonthlyAttendanceSummary(
  participantId: string,
  month: string
): Promise<MonthlyAttendanceSummary> {
  const participant = await db.participants.get(participantId);
  if (!participant) throw new Error('Participant not found');

  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-31`;

  const records = await db.attendanceRecords
    .where('[participantId+date]')
    .between([participantId, startDate], [participantId, endDate])
    .toArray();

  const totalDays = getDaysInMonth(parseInt(year), parseInt(monthNum));
  const daysPresent = records.filter((r) => r.checkInTime).length;
  const daysAbsent = totalDays - daysPresent;
  const lateArrivals = records.filter((r) => r.late).length;
  const earlyDepartures = records.filter((r) => r.earlyDeparture).length;

  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  return {
    participantId,
    participantName: participant.fullName,
    month,
    totalDays,
    daysPresent,
    daysAbsent,
    attendanceRate: (daysPresent / totalDays) * 100,
    lateArrivals,
    earlyDepartures,
    totalHoursWorked: totalHours,
    averageHoursPerDay: daysPresent > 0 ? totalHours / daysPresent : 0,
  };
}

/**
 * Generate reference letter
 */
export async function generateReferenceLetter(
  participantId: string,
  signedBy: string,
  signedByTitle: string
): Promise<ReferenceLetter> {
  const participant = await db.participants.get(participantId);
  if (!participant) throw new Error('Participant not found');

  // Calculate attendance rate
  const allRecords = await db.attendanceRecords.where('participantId').equals(participantId).toArray();
  const attendanceRate = allRecords.length > 0 ? (allRecords.filter((r) => r.checkInTime).length / allRecords.length) * 100 : 0;

  const reliability: 'excellent' | 'good' | 'fair' | 'poor' =
    attendanceRate >= 95
      ? 'excellent'
      : attendanceRate >= 85
      ? 'good'
      : attendanceRate >= 75
      ? 'fair'
      : 'poor';

  const letter: ReferenceLetter = {
    id: crypto.randomUUID(),
    participantId,
    participantName: participant.fullName,
    idNumber: participant.idNumber,
    position: 'Programme Participant',
    startDate: participant.createdAt.split('T')[0],
    endDate: participant.exitDate || new Date().toISOString().split('T')[0],
    siteName: participant.siteName || 'ITSON FSM Programme',
    performanceSummary: `${participant.fullName} demonstrated ${reliability} performance throughout their participation in the ITSON FSM programme.`,
    skills: ['Team collaboration', 'Work ethic', 'Reliability', 'Task completion'],
    attendance: { rate: attendanceRate, reliability },
    conduct: 'Professional and respectful',
    achievements: ['Completed programme successfully', 'Maintained good attendance'],
    signedBy,
    signedByTitle,
    generatedAt: new Date().toISOString(),
    letterHtml: generateLetterHTML(participant, attendanceRate, signedBy, signedByTitle),
  };

  localStorage.setItem(`reference_letter_${letter.id}`, JSON.stringify(letter));

  return letter;
}

/**
 * Generate letter HTML
 */
function generateLetterHTML(
  participant: Participant,
  attendanceRate: number,
  signedBy: string,
  signedByTitle: string
): string {
  const today = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px; }
    .signature { margin-top: 50px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>ITSON FSM PROGRAMME</h1>
    <p>Field Service Management</p>
  </div>

  <div class="content">
    <p>${today}</p>

    <p><strong>TO WHOM IT MAY CONCERN</strong></p>

    <h2>REFERENCE LETTER</h2>

    <p>This letter serves to confirm that <strong>${participant.fullName}</strong> (ID: ${participant.idNumber})
    participated in the ITSON FSM Programme.</p>

    <p><strong>Duration:</strong> ${participant.createdAt.split('T')[0]} to ${
    participant.exitDate || today
  }</p>

    <p><strong>Attendance Rate:</strong> ${attendanceRate.toFixed(1)}%</p>

    <p>${participant.fullName} demonstrated professionalism, reliability, and a strong work ethic throughout
    their participation. They successfully completed assigned tasks and maintained good working relationships
    with supervisors and colleagues.</p>

    <p>We recommend ${participant.fullName} for future employment opportunities and wish them success in
    their career endeavors.</p>

    <div class="signature">
      <p>_________________________</p>
      <p><strong>${signedBy}</strong></p>
      <p>${signedByTitle}</p>
      <p>ITSON FSM Programme</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
