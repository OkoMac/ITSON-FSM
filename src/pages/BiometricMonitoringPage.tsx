/**
 * Biometric Monitoring Page
 *
 * Comprehensive biometric success rate monitoring dashboard
 */

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { Button } from '@/components/ui';
import { LineChart, BarChart, MetricCard } from '@/components/analytics';
import {
  getBiometricSuccessReport,
  logBiometricAttempt,
  type BiometricAttempt,
  type BiometricSuccessReport,
  type Device,
} from '@/services/monitoring/biometricMonitoring';
import { db } from '@/utils/db';

const BiometricMonitoringPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'last7days' | 'last30days'>('last7days');
  const [report, setReport] = useState<BiometricSuccessReport | null>(null);
  const [attempts, setAttempts] = useState<BiometricAttempt[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  // Aggregated data for charts
  const [successRateByParticipant, setSuccessRateByParticipant] = useState<any[]>([]);
  const [successRateBySite, setSuccessRateBySite] = useState<any[]>([]);
  const [dailySuccessRate, setDailySuccessRate] = useState<any[]>([]);
  const [devicePerformance, setDevicePerformance] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load biometric report
      const reportData = await getBiometricSuccessReport(period);
      setReport(reportData);
      setShowAlert(!reportData.meetsThreshold);

      // Load attempts from localStorage
      const attemptsData = await getAllAttempts();
      const filteredAttempts = filterAttemptsByPeriod(attemptsData, period);
      setAttempts(filteredAttempts);

      // Load devices from localStorage
      const devicesData = await getAllDevices();
      setDevices(devicesData);

      // Load participants and sites from DB
      const [participantsData, sitesData] = await Promise.all([
        db.participants.toArray(),
        db.sites.toArray(),
      ]);
      setParticipants(participantsData);
      setSites(sitesData);

      // Calculate aggregated data
      calculateSuccessRateByParticipant(filteredAttempts, participantsData);
      calculateSuccessRateBySite(filteredAttempts, participantsData, sitesData);
      calculateDailySuccessRate(filteredAttempts);
      calculateDevicePerformance(filteredAttempts, devicesData);
    } catch (error) {
      console.error('Failed to load biometric monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllAttempts = async (): Promise<BiometricAttempt[]> => {
    const items: BiometricAttempt[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('biometric_attempt_')) {
        const data = localStorage.getItem(key);
        if (data) items.push(JSON.parse(data));
      }
    }
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  };

  const getAllDevices = async (): Promise<Device[]> => {
    const items: Device[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('device_')) {
        const data = localStorage.getItem(key);
        if (data) items.push(JSON.parse(data));
      }
    }
    return items;
  };

  const filterAttemptsByPeriod = (
    attempts: BiometricAttempt[],
    period: string
  ): BiometricAttempt[] => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    return attempts.filter((a) => new Date(a.timestamp) >= startDate);
  };

  const calculateSuccessRateByParticipant = (
    attempts: BiometricAttempt[],
    participants: any[]
  ) => {
    const participantMap = new Map<string, { total: number; successful: number }>();

    attempts.forEach((attempt) => {
      const current = participantMap.get(attempt.participantId) || { total: 0, successful: 0 };
      current.total++;
      if (attempt.success) current.successful++;
      participantMap.set(attempt.participantId, current);
    });

    const data = Array.from(participantMap.entries())
      .map(([participantId, stats]) => {
        const participant = participants.find((p) => p.id === participantId);
        return {
          name: participant?.fullName || 'Unknown',
          successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
          total: stats.total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setSuccessRateByParticipant(data);
  };

  const calculateSuccessRateBySite = (
    attempts: BiometricAttempt[],
    participants: any[],
    sites: any[]
  ) => {
    const siteMap = new Map<string, { total: number; successful: number }>();

    attempts.forEach((attempt) => {
      const participant = participants.find((p) => p.id === attempt.participantId);
      if (participant?.siteId) {
        const current = siteMap.get(participant.siteId) || { total: 0, successful: 0 };
        current.total++;
        if (attempt.success) current.successful++;
        siteMap.set(participant.siteId, current);
      }
    });

    const data = Array.from(siteMap.entries())
      .map(([siteId, stats]) => {
        const site = sites.find((s) => s.id === siteId);
        return {
          name: site?.name || 'Unknown',
          successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
          total: stats.total,
        };
      })
      .sort((a, b) => b.total - a.total);

    setSuccessRateBySite(data);
  };

  const calculateDailySuccessRate = (attempts: BiometricAttempt[]) => {
    const dailyMap = new Map<string, { total: number; successful: number }>();

    attempts.forEach((attempt) => {
      const date = new Date(attempt.timestamp).toLocaleDateString();
      const current = dailyMap.get(date) || { total: 0, successful: 0 };
      current.total++;
      if (attempt.success) current.successful++;
      dailyMap.set(date, current);
    });

    const data = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setDailySuccessRate(data);
  };

  const calculateDevicePerformance = (attempts: BiometricAttempt[], devices: Device[]) => {
    const deviceMap = new Map<string, { total: number; successful: number }>();

    attempts.forEach((attempt) => {
      const current = deviceMap.get(attempt.deviceId) || { total: 0, successful: 0 };
      current.total++;
      if (attempt.success) current.successful++;
      deviceMap.set(attempt.deviceId, current);
    });

    const data = Array.from(deviceMap.entries())
      .map(([deviceId, stats]) => {
        const device = devices.find((d) => d.id === deviceId);
        return {
          deviceId: device?.serialNumber || deviceId.slice(0, 8),
          model: device?.model || 'Unknown',
          successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
          total: stats.total,
          status: device?.status || 'unknown',
        };
      })
      .sort((a, b) => b.total - a.total);

    setDevicePerformance(data);
  };

  const handleTestAttempt = async (success: boolean) => {
    // Create a test biometric attempt
    const testParticipant = participants[Math.floor(Math.random() * participants.length)];
    const testDevice = devices[0] || { id: 'test-device-001' };

    if (testParticipant) {
      await logBiometricAttempt(
        testParticipant.id,
        Math.random() > 0.5 ? 'face' : 'fingerprint',
        success,
        testDevice.id,
        success ? Math.random() * 100 : undefined,
        success ? undefined : 'Test failure'
      );

      // Reload data
      await loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <h1 className="text-3xl font-bold text-text-primary mb-32">Biometric Monitoring</h1>
          <div className="text-center py-48">
            <div className="inline-block animate-spin rounded-full h-48 w-48 border-b-2 border-accent-blue"></div>
            <p className="text-text-secondary mt-16">Loading biometric data...</p>
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
            <h1 className="text-3xl font-bold text-text-primary mb-8">
              Biometric Monitoring
            </h1>
            <p className="text-text-secondary">
              Track biometric authentication success rates and device performance
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-8">
            {['last7days', 'last30days'].map((periodOption) => (
              <button
                key={periodOption}
                onClick={() => setPeriod(periodOption as 'last7days' | 'last30days')}
                className={`px-16 py-8 rounded-glass text-sm font-medium transition-colors ${
                  period === periodOption
                    ? 'bg-accent-blue text-white'
                    : 'glass-button text-text-secondary hover:text-text-primary'
                }`}
              >
                {periodOption === 'last7days' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Banner */}
        {showAlert && report && (
          <div className="mb-32">
            <GlassCard variant="elevated" className="bg-error/10 border-error/30">
              <div className="flex items-start space-x-12">
                <svg
                  className="w-24 h-24 text-error flex-shrink-0 mt-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-error mb-4">
                    Success Rate Below Threshold
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Current biometric success rate is{' '}
                    <span className="font-bold text-error">{report.successRate.toFixed(1)}%</span>,
                    which is below the required 80% threshold. Immediate action may be required.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 mb-32">
          <MetricCard
            title="Total Attempts"
            value={report?.totalAttempts || 0}
            changeLabel="biometric authentication attempts"
            color="blue"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            }
          />

          <MetricCard
            title="Success Rate"
            value={`${report?.successRate.toFixed(1) || 0}%`}
            trend={
              report?.meetsThreshold
                ? 'up'
                : 'down'
            }
            changeLabel="target: 80%"
            color={report?.meetsThreshold ? 'green' : 'red'}
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
            title="Successful Attempts"
            value={report?.successfulAttempts || 0}
            changeLabel="verified authentications"
            color="green"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
          />

          <MetricCard
            title="Failed Attempts"
            value={report?.failedAttempts || 0}
            changeLabel="authentication failures"
            color="red"
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            }
          />
        </div>

        {/* Success Rate by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
          <GlassCard>
            <h3 className="text-lg font-semibold text-text-primary mb-16">
              Success Rate by Authentication Type
            </h3>
            <div className="space-y-16">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-8">
                    <svg
                      className="w-20 h-20 text-accent-blue"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-text-primary">Face Recognition</span>
                  </div>
                  <span className="text-text-primary font-bold">
                    {report?.byType.face.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-8">
                  <div
                    className="bg-accent-blue h-8 rounded-full transition-all"
                    style={{ width: `${report?.byType.face.rate || 0}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-4">
                  {report?.byType.face.successful} / {report?.byType.face.total} attempts
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-8">
                    <svg
                      className="w-20 h-20 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                      />
                    </svg>
                    <span className="font-medium text-text-primary">Fingerprint</span>
                  </div>
                  <span className="text-text-primary font-bold">
                    {report?.byType.fingerprint.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-8">
                  <div
                    className="bg-purple-400 h-8 rounded-full transition-all"
                    style={{ width: `${report?.byType.fingerprint.rate || 0}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-4">
                  {report?.byType.fingerprint.successful} / {report?.byType.fingerprint.total}{' '}
                  attempts
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <LineChart
              data={dailySuccessRate}
              xKey="date"
              yKey="successRate"
              title="Daily Success Rate Trend"
              color="#10b981"
              height={250}
            />
          </GlassCard>
        </div>

        {/* Success Rate by Participant and Site */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
          <GlassCard>
            <BarChart
              data={successRateByParticipant}
              xKey="name"
              yKey="successRate"
              title="Success Rate by Participant (Top 10)"
              color="#3b82f6"
              height={300}
            />
          </GlassCard>

          <GlassCard>
            <BarChart
              data={successRateBySite}
              xKey="name"
              yKey="successRate"
              title="Success Rate by Site"
              color="#8b5cf6"
              height={300}
            />
          </GlassCard>
        </div>

        {/* Device Performance */}
        <GlassCard className="mb-32">
          <div className="flex items-center justify-between mb-24">
            <h2 className="text-xl font-semibold text-text-primary">Device Performance</h2>
            <div className="text-sm text-text-secondary">
              {devices.length} device{devices.length !== 1 ? 's' : ''} registered
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Device ID
                  </th>
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Model
                  </th>
                  <th className="text-center py-12 px-16 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Total Attempts
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {devicePerformance.map((device) => (
                  <tr key={device.deviceId} className="border-b border-border hover:bg-white/5">
                    <td className="py-12 px-16 text-sm font-medium text-text-primary">
                      {device.deviceId}
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary">{device.model}</td>
                    <td className="py-12 px-16 text-sm text-center">
                      <span
                        className={`px-8 py-4 rounded-full text-xs font-medium ${
                          device.status === 'active'
                            ? 'bg-success/10 text-success'
                            : device.status === 'maintenance'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="py-12 px-16 text-sm text-text-primary text-right">
                      {device.total}
                    </td>
                    <td className="py-12 px-16 text-sm font-medium text-right">
                      <span
                        className={`px-8 py-4 rounded-full text-xs ${
                          device.successRate >= 80
                            ? 'bg-success/10 text-success'
                            : device.successRate >= 60
                            ? 'bg-warning/10 text-warning'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {device.successRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {devicePerformance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center text-text-secondary">
                      No device performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Recent Attempts Log */}
        <GlassCard>
          <div className="flex items-center justify-between mb-24">
            <h2 className="text-xl font-semibold text-text-primary">Recent Biometric Attempts</h2>
            <div className="flex space-x-8">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleTestAttempt(true)}
              >
                Test Success
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleTestAttempt(false)}
              >
                Test Failure
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Timestamp
                  </th>
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Participant
                  </th>
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="text-center py-12 px-16 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-right py-12 px-16 text-sm font-medium text-text-secondary">
                    Confidence
                  </th>
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Device
                  </th>
                  <th className="text-left py-12 px-16 text-sm font-medium text-text-secondary">
                    Failure Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 20).map((attempt) => {
                  const participant = participants.find((p) => p.id === attempt.participantId);
                  const device = devices.find((d) => d.id === attempt.deviceId);

                  return (
                    <tr key={attempt.id} className="border-b border-border hover:bg-white/5">
                      <td className="py-12 px-16 text-sm text-text-primary">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                      <td className="py-12 px-16 text-sm text-text-primary">
                        {participant?.fullName || 'Unknown'}
                      </td>
                      <td className="py-12 px-16 text-sm text-text-primary capitalize">
                        {attempt.attemptType}
                      </td>
                      <td className="py-12 px-16 text-sm text-center">
                        {attempt.success ? (
                          <span className="inline-flex items-center px-8 py-4 rounded-full text-xs font-medium bg-success/10 text-success">
                            <svg
                              className="w-12 h-12 mr-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-8 py-4 rounded-full text-xs font-medium bg-error/10 text-error">
                            <svg
                              className="w-12 h-12 mr-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-12 px-16 text-sm text-text-primary text-right">
                        {attempt.confidence ? `${attempt.confidence.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-12 px-16 text-sm text-text-primary">
                        {device?.serialNumber || attempt.deviceId.slice(0, 8)}
                      </td>
                      <td className="py-12 px-16 text-sm text-text-secondary">
                        {attempt.failureReason || '-'}
                      </td>
                    </tr>
                  );
                })}
                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-text-secondary">
                      No biometric attempts recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default BiometricMonitoringPage;
