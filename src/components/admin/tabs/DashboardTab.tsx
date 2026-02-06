/**
 * Admin Dashboard Tab - Overview statistics
 */
import { GlassCard } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export function DashboardTab() {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Total Users',
      value: '127',
      change: '+12',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      action: () => navigate('/admin'),
    },
    {
      label: 'Active Sites',
      value: '8',
      change: '+2',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => navigate('/sites'),
    },
    {
      label: 'Pending Tasks',
      value: '34',
      change: '-5',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      action: () => navigate('/tasks'),
    },
    {
      label: 'Teams',
      value: '6',
      change: '+1',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => navigate('/admin'),
    },
    {
      label: 'Pending Invites',
      value: '15',
      change: '+8',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => navigate('/onboarding'),
    },
    {
      label: 'Today Attendance',
      value: '89%',
      change: '+3%',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => navigate('/analytics'),
    },
  ];

  return (
    <div className="space-y-24">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-8">Admin Dashboard Overview</h2>
        <p className="text-text-secondary">Real-time statistics and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.action}
            className="text-left w-full transition-all duration-200 hover:scale-105 hover:shadow-glow group"
          >
            <GlassCard>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-8 text-accent-blue group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className="text-sm text-text-secondary mb-4">{stat.label}</div>
                  <div className="text-3xl font-bold text-text-primary mb-4">{stat.value}</div>
                  <div className={`text-sm ${stat.change.startsWith('+') ? 'text-status-success' : 'text-accent-blue'}`}>
                    {stat.change} from last week
                  </div>
                </div>
                <svg className="w-5 h-5 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <GlassCard>
          <h3 className="text-lg font-semibold text-text-primary mb-16">Quick Actions</h3>
          <div className="space-y-12">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-12 p-12 bg-white/5 rounded-glass hover:bg-accent-blue/10 hover:border hover:border-accent-blue/30 transition-all group"
            >
              <svg className="w-5 h-5 text-accent-blue group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="flex-1 text-left">Add New User</span>
              <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="w-full flex items-center gap-12 p-12 bg-white/5 rounded-glass hover:bg-accent-blue/10 hover:border hover:border-accent-blue/30 transition-all group"
            >
              <svg className="w-5 h-5 text-accent-blue group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="flex-1 text-left">Create Task</span>
              <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/sites')}
              className="w-full flex items-center gap-12 p-12 bg-white/5 rounded-glass hover:bg-accent-blue/10 hover:border hover:border-accent-blue/30 transition-all group"
            >
              <svg className="w-5 h-5 text-accent-blue group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="flex-1 text-left">Add Site</span>
              <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-center gap-12 p-12 bg-white/5 rounded-glass hover:bg-accent-blue/10 hover:border hover:border-accent-blue/30 transition-all group"
            >
              <svg className="w-5 h-5 text-accent-blue group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-left">Send Invites</span>
              <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-text-primary mb-16">Recent Activity</h3>
          <div className="space-y-12 text-sm">
            <div className="flex items-start gap-12 p-8">
              <div className="text-accent-blue">•</div>
              <div className="flex-1 text-text-secondary">
                <span className="text-text-primary">John Doe</span> completed onboarding
                <div className="text-xs text-text-tertiary mt-2">2 minutes ago</div>
              </div>
            </div>
            <div className="flex items-start gap-12 p-8">
              <div className="text-status-success">•</div>
              <div className="flex-1 text-text-secondary">
                <span className="text-text-primary">Jane Smith</span> checked in at Downtown Office
                <div className="text-xs text-text-tertiary mt-2">15 minutes ago</div>
              </div>
            </div>
            <div className="flex items-start gap-12 p-8">
              <div className="text-status-warning">•</div>
              <div className="flex-1 text-text-secondary">
                New task assigned to <span className="text-text-primary">Site Team A</span>
                <div className="text-xs text-text-tertiary mt-2">1 hour ago</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Insights & Recommendations */}
      <GlassCard>
        <div className="flex items-start gap-16">
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-accent-blue to-accent-blue-light flex items-center justify-center">
              <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-8">Insights & Recommendations</h3>
            <p className="text-sm text-text-secondary mb-16">Based on your current data, here are actionable insights to improve operations:</p>
            <div className="space-y-12">
              <div className="flex items-start gap-12 p-12 bg-status-success/5 border border-status-success/20 rounded-glass">
                <svg className="w-5 h-5 text-status-success flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-text-primary text-sm mb-4">Strong Growth: +12 new users this week</div>
                  <div className="text-xs text-text-secondary">Consider expanding to 2-3 new sites to accommodate growth. Review onboarding capacity and team structures.</div>
                </div>
              </div>
              <div className="flex items-start gap-12 p-12 bg-accent-blue/5 border border-accent-blue/20 rounded-glass">
                <svg className="w-5 h-5 text-accent-blue flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-text-primary text-sm mb-4">34 Pending Tasks Requiring Attention</div>
                  <div className="text-xs text-text-secondary">Review task assignments and deadlines. Consider redistributing workload across teams to improve completion rates.</div>
                </div>
              </div>
              <div className="flex items-start gap-12 p-12 bg-status-info/5 border border-status-info/20 rounded-glass">
                <svg className="w-5 h-5 text-status-info flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-text-primary text-sm mb-4">15 Pending Invites - Send Now</div>
                  <div className="text-xs text-text-secondary">High invitation backlog detected. Send bulk invites to approved contacts to maintain onboarding momentum. Track completion rates in Analytics.</div>
                </div>
              </div>
              <div className="flex items-start gap-12 p-12 bg-white/5 border border-white/10 rounded-glass">
                <svg className="w-5 h-5 text-text-secondary flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-text-primary text-sm mb-4">Track Trends: View Analytics Dashboard</div>
                  <div className="text-xs text-text-secondary">89% attendance is above target. Analyze patterns by site, team, and time period to identify best practices for replication.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
