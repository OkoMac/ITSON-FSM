import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';
import bcrypt from 'bcryptjs';

/**
 * User Controller
 * Handles user management operations (CRUD)
 */

/**
 * Get all users
 * @access Admin, Project Manager
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    let query = db('users').whereNull('deleted_at');

    // Filter by role
    if (role) {
      query = query.where({ role });
    }

    // Filter by status
    if (status) {
      query = query.where({ status });
    }

    // Search by name or email
    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const users = await query
      .select(
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at'
      )
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalResult = await db('users')
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    const total = Number(totalResult?.count || 0);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @access Admin, Project Manager, Self
 */
export const getUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check authorization: Admin, Project Manager, or self
    if (
      req.user?.role !== 'system-admin' &&
      req.user?.role !== 'project-manager' &&
      req.user?.id !== id
    ) {
      throw new ApiError('Not authorized to view this user', 403);
    }

    const user = await db('users')
      .where({ id })
      .whereNull('deleted_at')
      .select(
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at'
      )
      .first();

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @access Admin, Project Manager
 */
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role, phone, site_id, status = 'active' } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new ApiError('Please provide email, password, name, and role', 400);
    }

    // Check if user already exists
    const existingUser = await db('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();

    if (existingUser) {
      throw new ApiError('User with this email already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [user] = await db('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        phone,
        site_id,
        status,
      })
      .returning([
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at',
      ]);

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @access Admin, Project Manager, Self (limited)
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email, name, role, phone, site_id, status } = req.body;

    // Check if user exists
    const existingUser = await db('users')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!existingUser) {
      throw new ApiError('User not found', 404);
    }

    // Authorization check
    const isAdmin =
      req.user?.role === 'system-admin' || req.user?.role === 'project-manager';
    const isSelf = req.user?.id === id;

    if (!isAdmin && !isSelf) {
      throw new ApiError('Not authorized to update this user', 403);
    }

    // Build update object
    const updates: any = { updated_at: new Date() };

    // Only admins can update role and status
    if (isAdmin) {
      if (role) updates.role = role;
      if (status) updates.status = status;
      if (site_id !== undefined) updates.site_id = site_id;
    }

    // Anyone can update their own name, email, phone
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone;

    // Check if email is already taken by another user
    if (email) {
      const emailTaken = await db('users')
        .where({ email: email.toLowerCase() })
        .whereNot({ id })
        .whereNull('deleted_at')
        .first();

      if (emailTaken) {
        throw new ApiError('Email already in use', 400);
      }
    }

    // Update user
    const [user] = await db('users')
      .where({ id })
      .update(updates)
      .returning([
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at',
      ]);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * @access Admin, Project Manager
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?.id === id) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    // Check if user exists
    const user = await db('users')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Soft delete
    await db('users').where({ id }).update({
      deleted_at: new Date(),
      status: 'inactive',
    });

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore deleted user
 * @access Admin only
 */
export const restoreUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if user exists and is deleted
    const user = await db('users')
      .where({ id })
      .whereNotNull('deleted_at')
      .first();

    if (!user) {
      throw new ApiError('Deleted user not found', 404);
    }

    // Restore user
    const [restoredUser] = await db('users')
      .where({ id })
      .update({
        deleted_at: null,
        status: 'active',
        updated_at: new Date(),
      })
      .returning([
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at',
      ]);

    res.status(200).json({
      status: 'success',
      data: { user: restoredUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 * @access Admin only
 */
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      throw new ApiError('Please provide a role', 400);
    }

    // Validate role
    const validRoles = [
      'system-admin',
      'idc-admin',
      'project-manager',
      'property-point',
      'supervisor',
      'general-worker',
    ];

    if (!validRoles.includes(role)) {
      throw new ApiError('Invalid role', 400);
    }

    // Prevent changing own role
    if (req.user?.id === id) {
      throw new ApiError('Cannot change your own role', 400);
    }

    // Update role
    const [user] = await db('users')
      .where({ id })
      .whereNull('deleted_at')
      .update({ role, updated_at: new Date() })
      .returning([
        'id',
        'email',
        'name',
        'role',
        'status',
        'phone',
        'site_id',
        'created_at',
        'updated_at',
      ]);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
