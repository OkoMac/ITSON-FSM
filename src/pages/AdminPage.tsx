/**
 * Admin Dashboard Page
 *
 * Comprehensive analytics and management interface for admin users
 * Includes real-time statistics, charts, participant management, and controls
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Badge } from '@/components/ui';
import { SyncModal } from '@/components/admin';
import { db } from '@/utils/db';
import type { Participant, AttendanceRecord } from '@/types';

interface DashboardStats {
  totalParticipants: number;
  activeParticipants: number;
  totalSites: number;
  todayAttendance: number;
  attendanceRate: number;
  pendingOnboarding: number;
  pendingTasks: number;
  completedTasksToday: number;
  syncPending: number;
  pendingStoriesReview: number;
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalParticipants: 0,
    activeParticipants: 0,
    totalSites: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    pendingOnboarding: 0,
    pendingTasks: 0,
    completedTasksToday: 0,
    syncPending: 0,
    pendingStoriesReview: 0,
  });

  const [recentParticipants, setRecentParticipants] = useState<Participant[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      // Load all data in parallel
      const [participants, attendance, sitesData, tasks, stories] = await Promise.all([
        db.participants.toArray(),
        db.attendanceRecords.toArray(),
        db.sites.toArray(),
        db.tasks.toArray(),
        db.impactStories.toArray(),
      ]);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];

      const activeParticipants = participants.filter(
        (p) => p.status === 'active'
      ).length;

      const todayAttendance = attendance.filter((a) =>
        a.checkInTime?.startsWith(today)
      ).length;

      const attendanceRate =
        activeParticipants > 0
          ? (todayAttendance / activeParticipants) * 100
          : 0;

      const pendingOnboarding = participants.filter(
        (p) => p.onboardingStatus === 'pending' || p.onboardingStatus === 'in-progress'
      ).length;

      const pendingTasks = tasks.filter(
        (t) => t.status === 'pending' || t.status === 'in-progress'
      ).length;

      const completedTasksToday = tasks.filter(
        (t) => t.status === 'completed' && t.completedAt?.startsWith(today)
      ).length;

      const syncPending = attendance.filter((a) => a.syncStatus === 'pending')
        .length;

      const pendingStoriesReview = stories.filter((s) => s.status === 'review').length;

      setStats({
        totalParticipants: participants.length,
        activeParticipants,
        totalSites: sitesData.length,
        todayAttendance,
        attendanceRate,
        pendingOnboarding,
        pendingTasks,
        completedTasksToday,
        syncPending,
        pendingStoriesReview,
      });

      // Set recent data
      setRecentParticipants(
        participants
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5)
      );

      setRecentAttendance(
        attendance
          .filter((a) => a.checkInTime)
          .sort((a, b) =>
            (b.checkInTime || '').localeCompare(a.checkInTime || '')
          )
          .slice(0, 10)
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-32 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <div className="flex items-center justify-center py-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-blue border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary">
            {new Date().toLocaleDateString('en-ZA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="secondary">
          <svg
            className="w-5 h-5 mr-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        {/* Total Participants */}
        <GlassCard variant="hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-8">
                Total Participants
              </p>
              <p className="text-3xl font-bold text-text-primary font-sf-mono">
                {stats.totalParticipants}
              </p>
              <p className="text-sm text-status-success mt-4">
                {stats.activeParticipants} active
              </p>
            </div>
            <div className="p-12 bg-white/5 rounded-glass">
              <svg
                className="w-6 h-6 text-accent-blue"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Today's Attendance */}
        <GlassCard variant="hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-8">
                Today's Attendance
              </p>
              <p className="text-3xl font-bold text-text-primary font-sf-mono">
                {stats.attendanceRate.toFixed(1)}%
              </p>
              <p className="text-sm text-text-tertiary mt-4">
                {stats.todayAttendance} checked in
              </p>
            </div>
            <div className="p-12 bg-white/5 rounded-glass">
              <svg
                className="w-6 h-6 text-status-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Pending Onboarding */}
        <GlassCard variant="hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-8">
                Pending Onboarding
              </p>
              <p className="text-3xl font-bold text-text-primary font-sf-mono">
                {stats.pendingOnboarding}
              </p>
              <p className="text-sm text-status-warning mt-4">
                Requires attention
              </p>
            </div>
            <div className="p-12 bg-white/5 rounded-glass">
              <svg
                className="w-6 h-6 text-status-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Active Sites */}
        <GlassCard variant="hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-8">Active Sites</p>
              <p className="text-3xl font-bold text-text-primary font-sf-mono">
                {stats.totalSites}
              </p>
              <p className="text-sm text-text-tertiary mt-4">
                {stats.totalSites} operational
              </p>
            </div>
            <div className="p-12 bg-white/5 rounded-glass">
              <svg
                className="w-6 h-6 text-accent-blue"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-4">Pending Tasks</p>
              <p className="text-2xl font-bold text-text-primary font-sf-mono">
                {stats.pendingTasks}
              </p>
            </div>
            <Badge variant="warning">Active</Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-4">
                Completed Today
              </p>
              <p className="text-2xl font-bold text-text-primary font-sf-mono">
                {stats.completedTasksToday}
              </p>
            </div>
            <Badge variant="success">Done</Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-4">Sync Pending</p>
              <p className="text-2xl font-bold text-text-primary font-sf-mono">
                {stats.syncPending}
              </p>
            </div>
            <Badge variant="info">Queue</Badge>
          </div>
        </GlassCard>
      </div>

      {/* Recent Participants */}
      <GlassCard>
        <div className="flex items-center justify-between mb-24">
          <h2 className="text-xl font-semibold text-text-primary">
            Recent Participants
          </h2>
          <Button variant="ghost">View All</Button>
        </div>

        {recentParticipants.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-32">
            No participants yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Name
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    ID Number
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Onboarding
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Enrolled
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-16 px-16">
                      <p className="text-sm font-medium text-text-primary">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-xs text-text-tertiary mt-2">
                        {participant.email}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-secondary font-sf-mono">
                        {participant.idNumber}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <Badge
                        variant={
                          participant.status === 'active'
                            ? 'success'
                            : participant.status === 'inactive'
                              ? 'default'
                              : 'warning'
                        }
                      >
                        {participant.status}
                      </Badge>
                    </td>
                    <td className="py-16 px-16">
                      <Badge
                        variant={
                          participant.onboardingStatus === 'verified'
                            ? 'success'
                            : participant.onboardingStatus === 'pending'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {participant.onboardingStatus}
                      </Badge>
                    </td>
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-secondary">
                        {formatDate(participant.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Recent Attendance */}
      <GlassCard>
        <div className="flex items-center justify-between mb-24">
          <h2 className="text-xl font-semibold text-text-primary">
            Recent Attendance
          </h2>
          <Button variant="ghost">View All</Button>
        </div>

        {recentAttendance.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-32">
            No attendance records yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Date
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Check In
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Check Out
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Method
                  </th>
                  <th className="text-left text-sm font-medium text-text-secondary py-12 px-16">
                    Sync Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-secondary">
                        {formatDate(record.date)}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-primary font-sf-mono">
                        {record.checkInTime && formatTime(record.checkInTime)}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-primary font-sf-mono">
                        {record.checkOutTime
                          ? formatTime(record.checkOutTime)
                          : '-'}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <p className="text-sm text-text-secondary">
                        {record.checkInMethod === 'face' ? '👤 Face' : '👆 Fingerprint'}
                      </p>
                    </td>
                    <td className="py-16 px-16">
                      <Badge
                        variant={
                          record.syncStatus === 'synced'
                            ? 'success'
                            : record.syncStatus === 'pending'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {record.syncStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-text-primary mb-24">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
          <button className="p-24 glass-button rounded-glass text-center hover:scale-105 transition-transform">
            <svg
              className="w-8 h-8 mx-auto mb-8 text-accent-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              All Participants
            </span>
          </button>

          <button className="p-24 glass-button rounded-glass text-center hover:scale-105 transition-transform">
            <svg
              className="w-8 h-8 mx-auto mb-8 text-accent-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Export Reports
            </span>
          </button>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="p-24 glass-button rounded-glass text-center hover:scale-105 transition-transform"
          >
            <svg
              className="w-8 h-8 mx-auto mb-8 text-accent-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Kwantu Sync
            </span>
          </button>

          <button className="p-24 glass-button rounded-glass text-center hover:scale-105 transition-transform">
            <svg
              className="w-8 h-8 mx-auto mb-8 text-accent-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Audit Logs
            </span>
          </button>

          <button
            onClick={() => navigate('/stories')}
            className="p-24 glass-button rounded-glass text-center hover:scale-105 transition-transform relative"
          >
            <svg
              className="w-8 h-8 mx-auto mb-8 text-accent-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Review Stories
            </span>
            {stats.pendingStoriesReview > 0 && (
              <Badge
                variant="warning"
                className="absolute top-16 right-16"
              >
                {stats.pendingStoriesReview}
              </Badge>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Kwantu Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};

export default AdminPage;
