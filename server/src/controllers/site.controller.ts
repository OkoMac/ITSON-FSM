import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllSites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, search } = req.query;

    let query = db('sites').whereNull('deleted_at');

    if (status) {
      query = query.where('status', status as string);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('address', 'ilike', `%${search}%`);
      });
    }

    const sites = await query.orderBy('name', 'asc');

    res.status(200).json({
      status: 'success',
      results: sites.length,
      data: { sites },
    });
  } catch (error) {
    next(error);
  }
};

export const getSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const site = await db('sites')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!site) {
      return next(new ApiError('Site not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { site },
    });
  } catch (error) {
    next(error);
  }
};

export const createSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      contactPerson,
      contactPhone,
      contactEmail,
      status,
      metadata,
    } = req.body;

    const [site] = await db('sites')
      .insert({
        name,
        address,
        latitude,
        longitude,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        status: status || 'active',
        metadata,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: { site },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      contactPerson,
      contactPhone,
      contactEmail,
      status,
      metadata,
    } = req.body;

    const [site] = await db('sites')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .update({
        name,
        address,
        latitude,
        longitude,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        status,
        metadata,
        updated_at: new Date(),
      })
      .returning('*');

    if (!site) {
      return next(new ApiError('Site not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { site },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await db('sites')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date() });

    if (result === 0) {
      return next(new ApiError('Site not found', 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
