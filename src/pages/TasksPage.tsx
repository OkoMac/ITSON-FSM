import React from 'react';
import { GlassCard, Badge } from '@/components/ui';

const TasksPage: React.FC = () => {
  const tasks = [
    {
      id: 1,
      title: 'Workshop Area Cleaning',
      description: 'Clean and organize workshop area 3',
      priority: 'high' as const,
      status: 'in-progress' as const,
      dueDate: 'Today, 2:00 PM',
      site: 'Main Factory',
    },
    {
      id: 2,
      title: 'Equipment Inspection',
      description: 'Inspect safety equipment in storage room',
      priority: 'medium' as const,
      status: 'pending' as const,
      dueDate: 'Tomorrow, 10:00 AM',
      site: 'Main Factory',
    },
    {
      id: 3,
      title: 'Inventory Count',
      description: 'Count and log all tools in workshop',
      priority: 'low' as const,
      status: 'pending' as const,
      dueDate: 'Friday, 3:00 PM',
      site: 'Main Factory',
    },
  ];

  const priorityColors = {
    high: 'error' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  const statusColors = {
    'in-progress': 'info' as const,
    'pending': 'default' as const,
    'completed': 'success' as const,
  };

  return (
    <div className="space-y-32 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">My Tasks</h1>
          <p className="text-text-secondary">{tasks.length} active tasks</p>
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-16">
        {tasks.map((task) => (
          <GlassCard key={task.id} variant="hover">
            <div className="flex items-start gap-16">
              <div className="flex-1">
                <div className="flex items-center gap-8 mb-8">
                  <Badge variant={priorityColors[task.priority]} size="sm">
                    {task.priority}
                  </Badge>
                  <Badge variant={statusColors[task.status]} size="sm">
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-8">
                  {task.title}
                </h3>
                <p className="text-sm text-text-secondary mb-12">
                  {task.description}
                </p>

                <div className="flex items-center gap-16 text-xs text-text-tertiary">
                  <span className="flex items-center gap-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {task.dueDate}
                  </span>
                  <span className="flex items-center gap-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {task.site}
                  </span>
                </div>
              </div>

              <button className="p-8 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
