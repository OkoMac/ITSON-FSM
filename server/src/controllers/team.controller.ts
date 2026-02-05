import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';

/**
 * Team Controller
 * Handles team management operations (CRUD)
 */

/**
 * Get all teams
 * @access Admin, Project Manager, Supervisor
 */
export const getAllTeams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { site_id, supervisor_id, search } = req.query;

    let query = db('teams').whereNull('deleted_at');

    // Filter by site
    if (site_id) {
      query = query.where({ site_id });
    }

    // Filter by supervisor
    if (supervisor_id) {
      query = query.where({ supervisor_id });
    }

    // Search by name
    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const teams = await query
      .select('*')
      .orderBy('created_at', 'desc');

    // Get member details for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await db('team_members')
          .where({ team_id: team.id })
          .whereNull('removed_at')
          .join('users', 'team_members.user_id', 'users.id')
          .select(
            'users.id',
            'users.name',
            'users.email',
            'users.role',
            'team_members.joined_at'
          );

        const supervisor = await db('users')
          .where({ id: team.supervisor_id })
          .select('id', 'name', 'email', 'role')
          .first();

        return {
          ...team,
          supervisor,
          members,
          memberCount: members.length,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: { teams: teamsWithMembers },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get team by ID
 * @access Admin, Project Manager, Supervisor, Team Members
 */
export const getTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const team = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Get members
    const members = await db('team_members')
      .where({ team_id: id })
      .whereNull('removed_at')
      .join('users', 'team_members.user_id', 'users.id')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'users.phone',
        'team_members.joined_at'
      );

    // Get supervisor details
    const supervisor = await db('users')
      .where({ id: team.supervisor_id })
      .select('id', 'name', 'email', 'role', 'phone')
      .first();

    res.status(200).json({
      status: 'success',
      data: {
        team: {
          ...team,
          supervisor,
          members,
          memberCount: members.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create team
 * @access Admin, Project Manager, Supervisor
 */
export const createTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, supervisor_id, site_id } = req.body;

    // Validate required fields
    if (!name || !supervisor_id) {
      throw new ApiError('Please provide team name and supervisor', 400);
    }

    // Verify supervisor exists and has appropriate role
    const supervisor = await db('users')
      .where({ id: supervisor_id })
      .whereNull('deleted_at')
      .first();

    if (!supervisor) {
      throw new ApiError('Supervisor not found', 404);
    }

    if (
      supervisor.role !== 'supervisor' &&
      supervisor.role !== 'project-manager' &&
      supervisor.role !== 'system-admin'
    ) {
      throw new ApiError('Selected user is not a supervisor', 400);
    }

    // Create team
    const [team] = await db('teams')
      .insert({
        name,
        description,
        supervisor_id,
        site_id,
        created_by: req.user?.id,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: {
        team: {
          ...team,
          supervisor,
          members: [],
          memberCount: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update team
 * @access Admin, Project Manager, Supervisor
 */
export const updateTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, supervisor_id, site_id } = req.body;

    // Check if team exists
    const existingTeam = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!existingTeam) {
      throw new ApiError('Team not found', 404);
    }

    // Build update object
    const updates: any = { updated_at: new Date() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (site_id !== undefined) updates.site_id = site_id;

    // If updating supervisor, verify they exist and have appropriate role
    if (supervisor_id) {
      const supervisor = await db('users')
        .where({ id: supervisor_id })
        .whereNull('deleted_at')
        .first();

      if (!supervisor) {
        throw new ApiError('Supervisor not found', 404);
      }

      if (
        supervisor.role !== 'supervisor' &&
        supervisor.role !== 'project-manager' &&
        supervisor.role !== 'system-admin'
      ) {
        throw new ApiError('Selected user is not a supervisor', 400);
      }

      updates.supervisor_id = supervisor_id;
    }

    // Update team
    const [team] = await db('teams')
      .where({ id })
      .update(updates)
      .returning('*');

    // Get updated supervisor and members
    const supervisor = await db('users')
      .where({ id: team.supervisor_id })
      .select('id', 'name', 'email', 'role')
      .first();

    const members = await db('team_members')
      .where({ team_id: id })
      .whereNull('removed_at')
      .join('users', 'team_members.user_id', 'users.id')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'team_members.joined_at'
      );

    res.status(200).json({
      status: 'success',
      data: {
        team: {
          ...team,
          supervisor,
          members,
          memberCount: members.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete team (soft delete)
 * @access Admin, Project Manager
 */
export const deleteTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if team exists
    const team = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Soft delete team
    await db('teams').where({ id }).update({
      deleted_at: new Date(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Team deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to team
 * @access Admin, Project Manager, Supervisor
 */
export const addTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      throw new ApiError('Please provide user ID', 400);
    }

    // Check if team exists
    const team = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Check if user exists
    const user = await db('users')
      .where({ id: user_id })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if user is already a member
    const existing = await db('team_members')
      .where({ team_id: id, user_id })
      .whereNull('removed_at')
      .first();

    if (existing) {
      throw new ApiError('User is already a team member', 400);
    }

    // Add member
    await db('team_members').insert({
      team_id: id,
      user_id,
      added_by: req.user?.id,
    });

    // Return updated team
    const members = await db('team_members')
      .where({ team_id: id })
      .whereNull('removed_at')
      .join('users', 'team_members.user_id', 'users.id')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'team_members.joined_at'
      );

    res.status(200).json({
      status: 'success',
      data: { members },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove member from team
 * @access Admin, Project Manager, Supervisor
 */
export const removeTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, userId } = req.params;

    // Check if team exists
    const team = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Prevent removing supervisor from their own team
    if (team.supervisor_id === userId) {
      throw new ApiError('Cannot remove supervisor from their own team', 400);
    }

    // Remove member (soft delete)
    const updated = await db('team_members')
      .where({ team_id: id, user_id: userId })
      .whereNull('removed_at')
      .update({
        removed_at: new Date(),
        removed_by: req.user?.id,
      });

    if (updated === 0) {
      throw new ApiError('Team member not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Team member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get team members
 * @access Admin, Project Manager, Supervisor, Team Members
 */
export const getTeamMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if team exists
    const team = await db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!team) {
      throw new ApiError('Team not found', 404);
    }

    // Get members
    const members = await db('team_members')
      .where({ team_id: id })
      .whereNull('removed_at')
      .join('users', 'team_members.user_id', 'users.id')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'users.phone',
        'team_members.joined_at'
      )
      .orderBy('team_members.joined_at', 'asc');

    res.status(200).json({
      status: 'success',
      data: { members },
    });
  } catch (error) {
    next(error);
  }
};
