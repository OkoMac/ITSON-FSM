import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, priority, siteId, assignedToId, search } = req.query;

    let query = db('tasks')
      .leftJoin('sites', 'tasks.site_id', 'sites.id')
      .leftJoin('users as assigned_to', 'tasks.assigned_to_id', 'assigned_to.id')
      .leftJoin('users as assigned_by', 'tasks.assigned_by_id', 'assigned_by.id')
      .whereNull('tasks.deleted_at')
      .select(
        'tasks.*',
        'sites.name as site_name',
        'assigned_to.name as assigned_to_name',
        'assigned_by.name as assigned_by_name'
      );

    // Filter by status
    if (status) {
      query = query.where('tasks.status', status as string);
    }

    // Filter by priority
    if (priority) {
      query = query.where('tasks.priority', priority as string);
    }

    // Filter by site
    if (siteId) {
      query = query.where('tasks.site_id', siteId as string);
    }

    // Filter by assigned user
    if (assignedToId) {
      query = query.where('tasks.assigned_to_id', assignedToId as string);
    }

    // If worker, only show their tasks
    if (req.user!.role === 'worker') {
      query = query.where('tasks.assigned_to_id', req.user!.id);
    }

    // Search
    if (search) {
      query = query.where((builder) => {
        builder
          .where('tasks.title', 'ilike', `%${search}%`)
          .orWhere('tasks.description', 'ilike', `%${search}%`);
      });
    }

    const tasks = await query.orderBy('tasks.created_at', 'desc');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await db('tasks')
      .leftJoin('sites', 'tasks.site_id', 'sites.id')
      .leftJoin('users as assigned_to', 'tasks.assigned_to_id', 'assigned_to.id')
      .leftJoin('users as assigned_by', 'tasks.assigned_by_id', 'assigned_by.id')
      .where({ 'tasks.id': req.params.id })
      .whereNull('tasks.deleted_at')
      .select(
        'tasks.*',
        'sites.name as site_name',
        'sites.address as site_address',
        'assigned_to.name as assigned_to_name',
        'assigned_to.email as assigned_to_email',
        'assigned_by.name as assigned_by_name'
      )
      .first();

    if (!task) {
      return next(new ApiError('Task not found', 404));
    }

    // Workers can only see their own tasks
    if (req.user!.role === 'worker' && task.assigned_to_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to view this task', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      priority,
      siteId,
      assignedToId,
      dueDate,
      requiresPhotoEvidence,
    } = req.body;

    // Validate site exists
    const site = await db('sites').where({ id: siteId }).first();
    if (!site) {
      return next(new ApiError('Site not found', 404));
    }

    // Validate assigned user exists if provided
    if (assignedToId) {
      const user = await db('users').where({ id: assignedToId }).first();
      if (!user) {
        return next(new ApiError('Assigned user not found', 404));
      }
    }

    const [task] = await db('tasks')
      .insert({
        title,
        description,
        priority: priority || 'medium',
        status: 'pending',
        site_id: siteId,
        assigned_to_id: assignedToId,
        assigned_by_id: req.user!.id,
        due_date: dueDate,
        requires_photo_evidence: requiresPhotoEvidence || false,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      siteId,
      assignedToId,
      dueDate,
      requiresPhotoEvidence,
      completionNote,
      proofPhotos,
    } = req.body;

    // Get existing task
    const existingTask = await db('tasks')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!existingTask) {
      return next(new ApiError('Task not found', 404));
    }

    // Workers can only update their own tasks
    if (req.user!.role === 'worker' && existingTask.assigned_to_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to update this task', 403));
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    // Supervisors+ can update all fields
    if (['supervisor', 'project-manager', 'system-admin'].includes(req.user!.role)) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (siteId !== undefined) updateData.site_id = siteId;
      if (assignedToId !== undefined) updateData.assigned_to_id = assignedToId;
      if (dueDate !== undefined) updateData.due_date = dueDate;
      if (requiresPhotoEvidence !== undefined) updateData.requires_photo_evidence = requiresPhotoEvidence;
    }

    // Workers can update status, completion note, and proof photos
    if (status !== undefined) updateData.status = status;
    if (completionNote !== undefined) updateData.completion_note = completionNote;
    if (proofPhotos !== undefined) updateData.proof_photos = proofPhotos;

    // Set completion timestamp when marking as completed
    if (status === 'completed' && !existingTask.completed_at) {
      updateData.completed_at = new Date();
    }

    const [task] = await db('tasks')
      .where({ id: req.params.id })
      .update(updateData)
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await db('tasks')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date() });

    if (result === 0) {
      return next(new ApiError('Task not found', 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const approveTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { qualityRating, supervisorFeedback } = req.body;

    const task = await db('tasks')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!task) {
      return next(new ApiError('Task not found', 404));
    }

    if (task.status !== 'completed') {
      return next(new ApiError('Only completed tasks can be approved', 400));
    }

    const [updatedTask] = await db('tasks')
      .where({ id: req.params.id })
      .update({
        status: 'approved',
        quality_rating: qualityRating,
        supervisor_feedback: supervisorFeedback,
        updated_at: new Date(),
      })
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supervisorFeedback } = req.body;

    if (!supervisorFeedback) {
      return next(new ApiError('Feedback is required when rejecting a task', 400));
    }

    const task = await db('tasks')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!task) {
      return next(new ApiError('Task not found', 404));
    }

    if (task.status !== 'completed') {
      return next(new ApiError('Only completed tasks can be rejected', 400));
    }

    const [updatedTask] = await db('tasks')
      .where({ id: req.params.id })
      .update({
        status: 'requires-changes',
        supervisor_feedback: supervisorFeedback,
        updated_at: new Date(),
      })
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tasks = await db('tasks')
      .leftJoin('sites', 'tasks.site_id', 'sites.id')
      .where({ 'tasks.assigned_to_id': req.user!.id })
      .whereNull('tasks.deleted_at')
      .select(
        'tasks.*',
        'sites.name as site_name',
        'sites.address as site_address'
      )
      .orderBy('tasks.due_date', 'asc');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};
