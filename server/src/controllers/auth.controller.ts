import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const signToken = (id: string, email: string, role: string): string => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return next(new ApiError('Email already in use', 400));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role: role || 'worker',
        status: 'active',
      })
      .returning(['id', 'email', 'name', 'role', 'created_at']);

    // Generate token
    const token = signToken(user.id, user.email, user.role);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return next(new ApiError('Please provide email and password', 400));
    }

    // Get user from database
    const user = await db('users')
      .where({ email, status: 'active' })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return next(new ApiError('Incorrect email or password', 401));
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return next(new ApiError('Incorrect email or password', 401));
    }

    // Update last login
    await db('users').where({ id: user.id }).update({ last_login: new Date() });

    // Generate token
    const token = signToken(user.id, user.email, user.role);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          profilePicture: user.profile_picture,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await db('users')
      .where({ id: req.user!.id })
      .whereNull('deleted_at')
      .select('id', 'email', 'name', 'role', 'phone', 'profile_picture', 'created_at')
      .first();

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await db('users')
      .where({ id: req.user!.id })
      .first();

    // Check current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordCorrect) {
      return next(new ApiError('Current password is incorrect', 401));
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db('users')
      .where({ id: req.user!.id })
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date(),
      });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
