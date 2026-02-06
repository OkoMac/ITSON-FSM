/**
 * Task Management Tab - Create and assign tasks to users
 */
import { useState } from 'react';
import { GlassCard, Button, Input, Badge } from '@/components/ui';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  siteId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
}

export function TaskManagementTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    siteId: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
  });

  const handleCreateTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
    };
    setTasks([...tasks, newTask]);
    setShowModal(false);
    setFormData({ title: '', description: '', assignedTo: '', siteId: '', priority: 'medium', dueDate: '' });
    alert('Task created successfully!');
  };

  return (
    <div className="space-y-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Task Management</h2>
        <Button onClick={() => setShowModal(true)} variant="primary">
          <svg className="w-5 h-5 mr-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Task
        </Button>
      </div>

      <GlassCard>
        <div className="space-y-16">
          {tasks.length === 0 ? (
            <div className="text-center py-32 text-text-secondary">
              No tasks yet. Click "Create Task" to get started.
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-16 bg-white/5 rounded-glass hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-8">{task.title}</h3>
                    <p className="text-text-secondary mb-12">{task.description}</p>
                    <div className="flex gap-12 flex-wrap">
                      <Badge variant={
                        task.priority === 'high' ? 'error' :
                        task.priority === 'medium' ? 'warning' : 'default'
                      }>
                        {task.priority} priority
                      </Badge>
                      <Badge variant={
                        task.status === 'completed' ? 'success' :
                        task.status === 'in-progress' ? 'info' : 'default'
                      }>
                        {task.status}
                      </Badge>
                      <span className="text-sm text-text-tertiary">Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-24">
              <h2 className="text-2xl font-bold text-text-primary">Create New Task</h2>
              
              <Input
                label="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Install equipment"
              />

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field"
                  rows={4}
                  placeholder="Detailed task description..."
                />
              </div>

              <Input
                label="Assign To (User ID/Email)"
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                placeholder="worker1@itsonfsm.com"
              />

              <Input
                label="Site ID/Location"
                value={formData.siteId}
                onChange={(e) => setFormData({...formData, siteId: e.target.value})}
                placeholder="Site 1"
              />

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />

              <div className="flex gap-12">
                <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleCreateTask} variant="primary" className="flex-1"
                  disabled={!formData.title || !formData.assignedTo}>
                  Create Task
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
