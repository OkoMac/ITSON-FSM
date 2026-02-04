import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Task } from '@/types';

interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  approveTask: (id: string, feedback?: string) => Promise<void>;
  rejectTask: (id: string, feedback: string) => Promise<void>;
}

export const useTasks = (filters?: {
  status?: string;
  priority?: string;
  siteId?: string;
}): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getTasks(filters);

      // Map backend response to frontend Task type
      const mappedTasks: Task[] = response.data.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: task.status as 'pending' | 'in-progress' | 'completed' | 'rejected',
        siteId: task.site_id,
        siteName: task.site?.name || '',
        assignedToId: task.assigned_to_id,
        assignedToName: task.assigned_to?.name || '',
        assignedById: task.assigned_by_id,
        assignedByName: task.assigned_by?.name || '',
        dueDate: task.due_date,
        requiresPhotoEvidence: task.requires_photo_evidence,
        photoEvidence: task.photo_evidence,
        completedAt: task.completed_at,
        approvedBy: task.approved_by,
        approvedAt: task.approved_at,
        supervisorFeedback: task.supervisor_feedback,
        qualityRating: task.quality_rating,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));

      setTasks(mappedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: Partial<Task>): Promise<Task> => {
    try {
      const response = await api.createTask({
        title: taskData.title!,
        description: taskData.description!,
        priority: taskData.priority!,
        site_id: taskData.siteId!,
        assigned_to_id: taskData.assignedToId!,
        due_date: taskData.dueDate,
        requires_photo_evidence: taskData.requiresPhotoEvidence,
      });

      const newTask = response.data.task;
      await fetchTasks(); // Refresh the list
      return newTask;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create task');
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const response = await api.updateTask(id, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        photo_evidence: taskData.photoEvidence,
        quality_rating: taskData.qualityRating,
      });

      const updatedTask = response.data.task;
      await fetchTasks(); // Refresh the list
      return updatedTask;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update task');
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      await api.deleteTask(id);
      await fetchTasks(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete task');
    }
  };

  const approveTask = async (id: string, feedback?: string): Promise<void> => {
    try {
      await api.approveTask(id, { feedback });
      await fetchTasks(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to approve task');
    }
  };

  const rejectTask = async (id: string, feedback: string): Promise<void> => {
    try {
      await api.rejectTask(id, { feedback });
      await fetchTasks(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reject task');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [JSON.stringify(filters)]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    approveTask,
    rejectTask,
  };
};
