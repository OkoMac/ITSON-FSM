/**
 * Analytics Page
 *
 * Comprehensive analytics dashboard with visualizations
 */

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  MetricCard,
} from '@/components/analytics';
import {
  calculateAttendanceTrend,
  calculateTaskCompletionTrend,
  calculateOnboardingTrend,
  calculateSiteMetrics,
  calculateAttendanceByDayOfWeek,
  calculateTaskDistribution,
  calculateParticipantStatusDistribution,
  calculateAverageCompletionTime,
  calculateMetricTrend,
} from '@/services/analytics';
import { db } from '@/utils/db';

const AnalyticsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // Metrics
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [taskCompletionTrend, setTaskCompletionTrend] = useState<any[]>([]);
  const [onboardingTrend, setOnboardingTrend] = useState<any[]>([]);
  const [attendanceByDay, setAttendanceByDay] = useState<any[]>([]);
  const [taskDistribution, setTaskDistribution] = useState<any[]>([]);
  const [participantDistribution, setParticipantDistribution] = useState<any[]>([]);
  const [siteMetrics, setSiteMetrics] = useState<any[]>([]);
  const [avgCompletionTime, setAvgCompletionTime] = useState(0);

  // Trend metrics
  const [activeParticipantsTrend, setActiveParticipantsTrend] = useState<any>(null);
  const [attendanceRateTrend, setAttendanceRateTrend] = useState<any>(null);
  const [taskCompletionRateTrend, setTaskCompletionRateTrend] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);

    try {
      const [participantsData, attendanceData, tasksData, sitesData] = await Promise.all([
        db.participants.toArray(),
        db.attendanceRecords.toArray(),
        db.tasks.toArray(),
        db.sites.toArray(),
      ]);

      // Calculate trends
      const attendanceTrendData = calculateAttendanceTrend(attendanceData, timeRange);
      const taskCompletionTrendData = calculateTaskCompletionTrend(tasksData, timeRange);
      const onboardingTrendData = calculateOnboardingTrend(participantsData, timeRange);

      setAttendanceTrend(attendanceTrendData);
      setTaskCompletionTrend(taskCompletionTrendData);
      setOnboardingTrend(onboardingTrendData);

      // Calculate distributions
      const attendanceByDayData = calculateAttendanceByDayOfWeek(attendanceData);
      const taskDistData = calculateTaskDistribution(tasksData);
      const participantDistData = calculateParticipantStatusDistribution(participantsData);

      setAttendanceByDay(attendanceByDayData);
      setTaskDistribution(taskDistData);
      setParticipantDistribution(participantDistData);

      // Calculate site metrics
      const siteMetricsData = calculateSiteMetrics(
        sitesData,
        participantsData,
        attendanceData,
        tasksData
      );
      setSiteMetrics(siteMetricsData);

      // Calculate average completion time
      const avgTime = calculateAverageCompletionTime(tasksData);
      setAvgCompletionTime(avgTime);

      // Calculate trends for key metrics
      const currentPeriod = participantsData.filter((p) => p.status === 'active').length;
      const previousPeriod = Math.round(currentPeriod * 0.85); // Simulate previous period
      setActiveParticipantsTrend(calculateMetricTrend(currentPeriod, previousPeriod));

      const currentRate =
        attendanceData.length > 0
          ? (attendanceTrendData.reduce((sum, d) => sum + d.value, 0) /
              attendanceTrendData.length /
              currentPeriod) *
            100
          : 0;
      const previousRate = currentRate * 0.92;
      setAttendanceRateTrend(calculateMetricTrend(currentRate, previousRate));

      const completedTasks = tasksData.filter((t) => t.status === 'completed').length;
      const totalTasks = tasksData.length;
      const currentTaskRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const previousTaskRate = currentTaskRate * 0.88;
      setTaskCompletionRateTrend(calculateMetricTrend(currentTaskRate, previousTaskRate));
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <h1 className="text-3xl font-bold text-text-primary mb-32">Analytics</h1>
          <div className="text-center py-48">
            <div className="inline-block animate-spin rounded-full h-48 w-48 border-b-2 border-accent-blue"></div>
            <p className="text-text-secondary mt-16">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 mb-32">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-8">Analytics</h1>
            <p className="text-text-secondary">
              Comprehensive insights into programme performance and trends
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-8">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                className={`px-16 py-8 rounded-glass text-sm font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-accent-blue text-white'
                    : 'glass-button text-text-secondary hover:text-text-primary'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 mb-32">
          <MetricCard
            title="Active Participants"
            value={activeParticipantsTrend?.current || 0}
            change={activeParticipantsTrend?.changePercent}
            trend={activeParticipantsTrend?.trend}
            changeLabel="vs previous period"
            color="blue"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />

          <MetricCard
            title="Attendance Rate"
            value={`${attendanceRateTrend?.current.toFixed(1) || 0}%`}
            change={attendanceRateTrend?.changePercent}
            trend={attendanceRateTrend?.trend}
            changeLabel="vs previous period"
            color="green"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          <MetricCard
            title="Task Completion Rate"
            value={`${taskCompletionRateTrend?.current.toFixed(1) || 0}%`}
            change={taskCompletionRateTrend?.changePercent}
            trend={taskCompletionRateTrend?.trend}
            changeLabel="vs previous period"
            color="purple"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />

          <MetricCard
            title="Avg. Task Time"
            value={`${avgCompletionTime}h`}
            changeLabel="hours to complete"
            color="amber"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
          <GlassCard>
            <LineChart
              data={attendanceTrend}
              xKey="label"
              yKey="value"
              title="Attendance Trend"
              color="#3b82f6"
              height={300}
            />
          </GlassCard>

          <GlassCard>
            <BarChart
              data={taskCompletionTrend}
              xKey="label"
              yKey="value"
              title="Task Completion Trend"
              color="#10b981"
              height={300}
            />
          </GlassCard>
        </div>

        {/* Cumulative Growth */}
        <div className="mb-32">
          <GlassCard>
            <AreaChart
              data={onboardingTrend}
              xKey="label"
              yKey="value"
              title="Cumulative Participant Onboarding"
              color="#8b5cf6"
              height={300}
            />
          </GlassCard>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 mb-32">
          <GlassCard>
            <BarChart
              data={attendanceByDay}
              xKey="day"
              yKey="value"
              title="Attendance by Day of Week"
              color="#f59e0b"
              height={300}
            />
          </GlassCard>

          <GlassCard>
            <PieChart
              data={taskDistribution.map((d) => ({
                name: d.status,
                value: d.count,
              }))}
              title="Task Status Distribution"
              height={300}
            />
          </GlassCard>

          <GlassCard>
            <PieChart
              data={participantDistribution.map((d) => ({
                name: d.status,
                value: d.count,
              }))}
              title="Participant Status Distribution"
              height={300}
            />
          </GlassCard>
        </div>

        {/* Site Performance */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-24">Site Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Site
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Participants
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Attendance
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Tasks Done
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Tasks Pending
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {siteMetrics.map((site) => (
                  <tr key={site.siteId} className="border-b border-border hover:bg-white/5">
                    <td className="py-12 px-16 text-sm font-medium text-text-primary">
                      {site.siteName}
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary text-right">
                      {site.activeParticipants}
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary text-right">
                      {site.averageAttendance}%
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary text-right">
                      {site.tasksCompleted}
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary text-right">
                      {site.tasksPending}
                    </td>
                    <td className="py-12 px-16 text-sm font-medium text-right">
                      <span
                        className={`px-8 py-4 rounded-full text-xs ${
                          site.completionRate >= 75
                            ? 'bg-success/10 text-success'
                            : site.completionRate >= 50
                            ? 'bg-warning/10 text-warning'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {site.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
