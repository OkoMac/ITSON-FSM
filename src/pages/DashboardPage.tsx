import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard, Badge } from '@/components/ui';
import heroBuilding from '@/assets/images/hero-building.svg';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data
  const stats = [
    {
      label: 'Today\'s Attendance',
      value: '92.3%',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      status: 'success' as const,
      trend: '+2.1%',
    },
    {
      label: 'Active Tasks',
      value: '12',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      status: 'info' as const,
    },
    {
      label: 'Pending Reviews',
      value: '5',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      status: 'warning' as const,
    },
    {
      label: 'Work Quality',
      value: '4.6/5',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      status: 'success' as const,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'check-in',
      title: 'Checked in at Main Site',
      time: '8:15 AM',
      status: 'success' as const,
    },
    {
      id: 2,
      type: 'task-complete',
      title: 'Completed: Workshop Cleaning',
      time: '10:30 AM',
      status: 'success' as const,
    },
    {
      id: 3,
      type: 'task-assigned',
      title: 'New task assigned: Equipment Inspection',
      time: '11:45 AM',
      status: 'info' as const,
    },
  ];

  return (
    <div className="space-y-32 animate-fade-in">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          backgroundImage: `url(${heroBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '280px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/70" />
        <div className="relative z-10 p-32 md:p-48">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-xl text-white/90 mb-8">
            {new Date().toLocaleDateString('en-ZA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-base text-white/70 max-w-2xl">
            Monitor your team's performance, track attendance, and manage facilities across all sites
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        {stats.map((stat) => (
          <GlassCard key={stat.label} variant="hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-8">{stat.label}</p>
                <p className="text-3xl font-bold text-text-primary font-sf-mono">
                  {stat.value}
                </p>
                {stat.trend && (
                  <p className="text-sm text-status-success mt-4">{stat.trend}</p>
                )}
              </div>
              <div className="p-12 bg-white/5 rounded-glass">
                <div className={`text-${stat.status === 'success' ? 'status-success' : stat.status === 'warning' ? 'status-warning' : 'accent-blue'}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Recent activity */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-text-primary mb-24">
          Recent Activity
        </h2>

        <div className="space-y-16">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-16 p-16 rounded-glass hover:bg-white/5 transition-colors"
            >
              <Badge variant={activity.status}>{activity.type}</Badge>

              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {activity.title}
                </p>
                <p className="text-xs text-text-tertiary mt-4">{activity.time}</p>
              </div>

              <svg
                className="w-5 h-5 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Quick actions */}
      {user?.role === 'worker' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-24">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-text-primary">Check In</span>
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="text-sm font-medium text-text-primary">View Tasks</span>
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
              <span className="text-sm font-medium text-text-primary">Documents</span>
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default DashboardPage;
