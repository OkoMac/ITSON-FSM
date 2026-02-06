/**
 * Admin Dashboard Tab - Overview statistics
 */
import { GlassCard } from '@/components/ui';

export function DashboardTab() {
  const stats = [
    { label: 'Total Users', value: '127', change: '+12', icon: '👥' },
    { label: 'Active Sites', value: '8', change: '+2', icon: '📍' },
    { label: 'Pending Tasks', value: '34', change: '-5', icon: '✓' },
    { label: 'Teams', value: '6', change: '+1', icon: '🏢' },
    { label: 'Pending Invites', value: '15', change: '+8', icon: '📨' },
    { label: 'Today Attendance', value: '89%', change: '+3%', icon: '📊' },
  ];

  return (
    <div className="space-y-24">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-8">Admin Dashboard Overview</h2>
        <p className="text-text-secondary">Real-time statistics and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {stats.map((stat, index) => (
          <GlassCard key={index}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-4xl mb-8">{stat.icon}</div>
                <div className="text-sm text-text-secondary mb-4">{stat.label}</div>
                <div className="text-3xl font-bold text-text-primary mb-4">{stat.value}</div>
                <div className={`text-sm ${stat.change.startsWith('+') ? 'text-status-success' : 'text-status-error'}`}>
                  {stat.change} from last week
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <GlassCard>
          <h3 className="text-lg font-semibold text-text-primary mb-16">Quick Actions</h3>
          <div className="space-y-12">
            <a href="#" className="block p-12 bg-white/5 rounded-glass hover:bg-white/10 transition-colors">
              ➕ Add New User
            </a>
            <a href="#" className="block p-12 bg-white/5 rounded-glass hover:bg-white/10 transition-colors">
              ✓ Create Task
            </a>
            <a href="#" className="block p-12 bg-white/5 rounded-glass hover:bg-white/10 transition-colors">
              📍 Add Site
            </a>
            <a href="#" className="block p-12 bg-white/5 rounded-glass hover:bg-white/10 transition-colors">
              📨 Send Invites
            </a>
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
    </div>
  );
}
