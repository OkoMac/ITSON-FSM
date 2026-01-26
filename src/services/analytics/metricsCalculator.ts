/**
 * Analytics Metrics Calculator
 *
 * Aggregates and calculates metrics for analytics and reporting
 */

import type { Participant, AttendanceRecord, Task, Site } from '@/types';

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MetricTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  activeParticipants: number;
  averageAttendance: number;
  tasksCompleted: number;
  tasksPending: number;
  completionRate: number;
}

/**
 * Calculate attendance trend over time
 */
export function calculateAttendanceTrend(
  attendance: AttendanceRecord[],
  days: number = 30
): TimeSeriesDataPoint[] {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyAttendance = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyAttendance.set(dateKey, 0);
  }

  // Count attendance per day
  attendance.forEach((record) => {
    if (record.checkInTime) {
      const dateKey = record.checkInTime.split('T')[0];
      if (dailyAttendance.has(dateKey)) {
        dailyAttendance.set(dateKey, (dailyAttendance.get(dateKey) || 0) + 1);
      }
    }
  });

  // Convert to array
  return Array.from(dailyAttendance.entries())
    .map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
      }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate task completion trend
 */
export function calculateTaskCompletionTrend(
  tasks: Task[],
  days: number = 30
): TimeSeriesDataPoint[] {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyCompletions = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyCompletions.set(dateKey, 0);
  }

  // Count completions per day
  tasks.forEach((task) => {
    if (task.status === 'completed' && task.completedAt) {
      const dateKey = task.completedAt.split('T')[0];
      if (dailyCompletions.has(dateKey)) {
        dailyCompletions.set(dateKey, (dailyCompletions.get(dateKey) || 0) + 1);
      }
    }
  });

  // Convert to array
  return Array.from(dailyCompletions.entries())
    .map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
      }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate participant onboarding trend
 */
export function calculateOnboardingTrend(
  participants: Participant[],
  days: number = 30
): TimeSeriesDataPoint[] {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const dailyOnboarding = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyOnboarding.set(dateKey, 0);
  }

  // Count onboarding per day
  participants.forEach((participant) => {
    if (participant.createdAt) {
      const dateKey = participant.createdAt.split('T')[0];
      if (dailyOnboarding.has(dateKey)) {
        dailyOnboarding.set(dateKey, (dailyOnboarding.get(dateKey) || 0) + 1);
      }
    }
  });

  // Convert to array with cumulative count
  let cumulative = 0;
  return Array.from(dailyOnboarding.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => {
      cumulative += value;
      return {
        date,
        value: cumulative,
        label: new Date(date).toLocaleDateString('en-ZA', {
          month: 'short',
          day: 'numeric',
        }),
      };
    });
}

/**
 * Calculate metric trend comparison
 */
export function calculateMetricTrend(
  current: number,
  previous: number
): MetricTrend {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) >= 1) {
    trend = change > 0 ? 'up' : 'down';
  }

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
}

/**
 * Calculate metrics per site
 */
export function calculateSiteMetrics(
  sites: Site[],
  participants: Participant[],
  attendance: AttendanceRecord[],
  tasks: Task[]
): SiteMetrics[] {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  return sites.map((site) => {
    // Active participants at this site
    const siteParticipants = participants.filter(
      (p) => p.siteId === site.id && p.status === 'active'
    );

    // Attendance for last 7 days
    const recentAttendance = attendance.filter(
      (a) =>
        a.siteId === site.id &&
        a.checkInTime &&
        a.checkInTime >= last7Days.toISOString()
    );

    const averageAttendance =
      siteParticipants.length > 0
        ? (recentAttendance.length / 7 / siteParticipants.length) * 100
        : 0;

    // Tasks
    const siteTasks = tasks.filter((t) => t.siteId === site.id);
    const tasksCompleted = siteTasks.filter((t) => t.status === 'completed').length;
    const tasksPending = siteTasks.filter(
      (t) => t.status === 'pending' || t.status === 'in-progress'
    ).length;

    const completionRate =
      siteTasks.length > 0 ? (tasksCompleted / siteTasks.length) * 100 : 0;

    return {
      siteId: site.id,
      siteName: site.name,
      activeParticipants: siteParticipants.length,
      averageAttendance: Math.round(averageAttendance),
      tasksCompleted,
      tasksPending,
      completionRate: Math.round(completionRate),
    };
  });
}

/**
 * Calculate attendance by day of week
 */
export function calculateAttendanceByDayOfWeek(
  attendance: AttendanceRecord[]
): Array<{ day: string; value: number }> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);

  attendance.forEach((record) => {
    if (record.checkInTime) {
      const date = new Date(record.checkInTime);
      const dayIndex = date.getDay();
      dayCounts[dayIndex]++;
    }
  });

  return dayNames.map((day, index) => ({
    day,
    value: dayCounts[index],
  }));
}

/**
 * Calculate task distribution by status
 */
export function calculateTaskDistribution(tasks: Task[]): Array<{ status: string; count: number }> {
  const statusCounts = new Map<string, number>();

  tasks.forEach((task) => {
    const count = statusCounts.get(task.status) || 0;
    statusCounts.set(task.status, count + 1);
  });

  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));
}

/**
 * Calculate average task completion time
 */
export function calculateAverageCompletionTime(tasks: Task[]): number {
  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.createdAt
  );

  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt!).getTime();
    return sum + (completed - created);
  }, 0);

  // Return average in hours
  return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60));
}

/**
 * Calculate participant status distribution
 */
export function calculateParticipantStatusDistribution(
  participants: Participant[]
): Array<{ status: string; count: number }> {
  const statusCounts = new Map<string, number>();

  participants.forEach((participant) => {
    const count = statusCounts.get(participant.status) || 0;
    statusCounts.set(participant.status, count + 1);
  });

  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));
}
