import React, { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task } from '@/types';
import heroBuilding from '@/assets/images/hero-building.svg';

const TasksPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Mock tasks data - replace with actual data from IndexedDB/API
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Workshop Area Cleaning',
      description: 'Clean and organize workshop area 3. Ensure all tools are returned to their proper locations and sweep the floor.',
      priority: 'high',
      status: 'in-progress',
      siteId: 'site1',
      siteName: 'Main Factory Site',
      assignedToId: user?.id || 'p1',
      assignedToName: user?.name || 'John Worker',
      assignedById: 'supervisor1',
      assignedByName: 'John Supervisor',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      requiresPhotoEvidence: true,
      proofPhotos: [],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Equipment Inspection',
      description: 'Inspect safety equipment in storage room. Check for any damage or missing items.',
      priority: 'medium',
      status: 'pending',
      siteId: 'site1',
      siteName: 'Main Factory Site',
      assignedToId: user?.id || 'p1',
      assignedToName: user?.name || 'John Worker',
      assignedById: 'supervisor1',
      assignedByName: 'John Supervisor',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      requiresPhotoEvidence: true,
      proofPhotos: [],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Inventory Count',
      description: 'Count and log all tools in workshop. Update the inventory spreadsheet with current counts.',
      priority: 'low',
      status: 'pending',
      siteId: 'site1',
      siteName: 'Main Factory Site',
      assignedToId: user?.id || 'p1',
      assignedToName: user?.name || 'John Worker',
      assignedById: 'supervisor1',
      assignedByName: 'John Supervisor',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      requiresPhotoEvidence: false,
      proofPhotos: [],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'Office Desk Setup',
      description: 'Set up new desks in office area B. Arrange ergonomically and install cable management.',
      priority: 'urgent',
      status: 'approved',
      siteId: 'site2',
      siteName: 'City Office Hub',
      assignedToId: user?.id || 'p1',
      assignedToName: user?.name || 'John Worker',
      assignedById: 'supervisor2',
      assignedByName: 'Sarah Manager',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      requiresPhotoEvidence: true,
      proofPhotos: ['/mock-photo-1.jpg', '/mock-photo-2.jpg'],
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedByName: user?.name || 'John Worker',
      completionNote: 'All 10 desks have been set up according to the ergonomic guidelines. Cable management installed and tested.',
      supervisorFeedback: 'Excellent work! The desk setup looks professional and meets all requirements.',
      qualityRating: 5,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const handleCompleteTask = (taskId: string, photos: File[], note: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completedAt: new Date().toISOString(),
              completedByName: user?.name || 'Worker',
              completionNote: note,
              proofPhotos: photos.map((p) => URL.createObjectURL(p)), // In production, upload to server
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );
    setSelectedTask(null);
  };

  const priorityColors = {
    high: 'error' as const,
    urgent: 'error' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  const statusColors = {
    'in-progress': 'info' as const,
    'pending': 'default' as const,
    'completed': 'success' as const,
    'approved': 'success' as const,
    'rejected': 'error' as const,
    'requires-changes': 'warning' as const,
  };

  const formatDueDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (diffDays === 1) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-32 animate-fade-in">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          backgroundImage: `url(${heroBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/70" />
        <div className="relative z-10 p-32">
          <h1 className="text-4xl font-bold text-white mb-8">My Tasks</h1>
          <p className="text-lg text-white/80">{tasks.length} active tasks assigned to you</p>
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-16">
        {tasks.map((task) => (
          <GlassCard
            key={task.id}
            variant="hover"
            className="cursor-pointer"
            onClick={() => setSelectedTask(task)}
          >
            <div className="flex items-start gap-16">
              <div className="flex-1">
                <div className="flex items-center gap-8 mb-8">
                  <Badge variant={priorityColors[task.priority]} size="sm">
                    {task.priority}
                  </Badge>
                  <Badge variant={statusColors[task.status]} size="sm">
                    {task.status.replace('-', ' ')}
                  </Badge>
                  {task.requiresPhotoEvidence && (
                    <Badge variant="info" size="sm">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Photo Required
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-8">
                  {task.title}
                </h3>
                <p className="text-sm text-text-secondary mb-12 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center gap-16 text-xs text-text-tertiary">
                  <span className="flex items-center gap-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDueDate(task.dueDate)}
                  </span>
                  <span className="flex items-center gap-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {task.siteName}
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={handleCompleteTask}
          userRole={user?.role || 'worker'}
        />
      )}
    </div>
  );
};

export default TasksPage;
