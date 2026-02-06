/**
 * Comprehensive Admin Panel
 * Full admin functionality for user, task, site, team, and onboarding management
 */

import { useState } from 'react';
import { GlassCard } from '@/components/ui';
import {
  UserManagementTab,
  TaskManagementTab,
  SiteManagementTab,
  TeamManagementTab,
  OnboardingManagementTab,
  DashboardTab
} from '@/components/admin/tabs';

type AdminTab = 'dashboard' | 'users' | 'tasks' | 'sites' | 'teams' | 'onboarding';

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: '📊' },
    { id: 'users' as AdminTab, label: 'Users', icon: '👥' },
    { id: 'tasks' as AdminTab, label: 'Tasks', icon: '✓' },
    { id: 'sites' as AdminTab, label: 'Sites', icon: '📍' },
    { id: 'teams' as AdminTab, label: 'Teams', icon: '🏢' },
    { id: 'onboarding' as AdminTab, label: 'Onboarding', icon: '📨' },
  ];

  return (
    <div className="space-y-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8 neon-text-blue">
            Admin Control Panel
          </h1>
          <p className="text-text-secondary">
            Complete management system for ITSON FSM Platform
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <GlassCard>
        <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 px-24 py-12 rounded-glass transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30 neon-glow-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }
              `}
            >
              <span className="mr-8">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'tasks' && <TaskManagementTab />}
        {activeTab === 'sites' && <SiteManagementTab />}
        {activeTab === 'teams' && <TeamManagementTab />}
        {activeTab === 'onboarding' && <OnboardingManagementTab />}
      </div>
    </div>
  );
}
