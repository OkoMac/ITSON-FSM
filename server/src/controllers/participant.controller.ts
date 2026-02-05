import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllParticipants = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, siteId, search } = req.query;

    let query = db('participants')
      .leftJoin('users', 'participants.user_id', 'users.id')
      .leftJoin('sites', 'participants.site_id', 'sites.id')
      .whereNull('participants.deleted_at')
      .select(
        'participants.*',
        'users.email as user_email',
        'sites.name as site_name'
      );

    // Filter by status
    if (status) {
      query = query.where('participants.status', status as string);
    }

    // Filter by site
    if (siteId) {
      query = query.where('participants.site_id', siteId as string);
    }

    // Search
    if (search) {
      query = query.where((builder) => {
        builder
          .where('participants.full_name', 'ilike', `%${search}%`)
          .orWhere('participants.sa_id_number', 'ilike', `%${search}%`)
          .orWhere('participants.email', 'ilike', `%${search}%`);
      });
    }

    const participants = await query.orderBy('participants.created_at', 'desc');

    res.status(200).json({
      status: 'success',
      results: participants.length,
      data: { participants },
    });
  } catch (error) {
    next(error);
  }
};

export const getParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const participant = await db('participants')
      .leftJoin('users', 'participants.user_id', 'users.id')
      .leftJoin('sites', 'participants.site_id', 'sites.id')
      .where({ 'participants.id': req.params.id })
      .whereNull('participants.deleted_at')
      .select(
        'participants.*',
        'users.email as user_email',
        'users.role as user_role',
        'sites.name as site_name',
        'sites.address as site_address'
      )
      .first();

    if (!participant) {
      return next(new ApiError('Participant not found', 404));
    }

    // Workers can only see their own profile
    if (req.user!.role === 'worker' && participant.user_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to view this participant', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { participant },
    });
  } catch (error) {
    next(error);
  }
};

export const createParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId,
      siteId,
      fullName,
      saIdNumber,
      dateOfBirth,
      gender,
      address,
      phone,
      email,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      startDate,
      expectedEndDate,
      popiaConsent,
      codeOfConductSigned,
    } = req.body;

    // Validate user exists
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // Check if participant already exists for this user
    const existingParticipant = await db('participants')
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .first();

    if (existingParticipant) {
      return next(new ApiError('Participant already exists for this user', 400));
    }

    // Validate site if provided
    if (siteId) {
      const site = await db('sites').where({ id: siteId }).first();
      if (!site) {
        return next(new ApiError('Site not found', 404));
      }
    }

    // Validate SA ID number format (13 digits)
    if (saIdNumber && !/^\d{13}$/.test(saIdNumber)) {
      return next(new ApiError('Invalid SA ID number format', 400));
    }

    const [participant] = await db('participants')
      .insert({
        user_id: userId,
        site_id: siteId,
        full_name: fullName,
        sa_id_number: saIdNumber,
        date_of_birth: dateOfBirth,
        gender,
        address,
        phone,
        email,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_relationship: emergencyContactRelationship,
        status: 'onboarding',
        start_date: startDate,
        expected_end_date: expectedEndDate,
        popia_consent: popiaConsent || false,
        popia_consent_date: popiaConsent ? new Date() : null,
        code_of_conduct_signed: codeOfConductSigned || false,
        biometric_enrolled: false,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: { participant },
    });
  } catch (error) {
    next(error);
  }
};

export const updateParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      siteId,
      fullName,
      saIdNumber,
      dateOfBirth,
      gender,
      address,
      phone,
      email,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      status,
      startDate,
      expectedEndDate,
      actualEndDate,
      popiaConsent,
      codeOfConductSigned,
    } = req.body;

    const existingParticipant = await db('participants')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!existingParticipant) {
      return next(new ApiError('Participant not found', 404));
    }

    // Workers can only update their own profile (limited fields)
    if (req.user!.role === 'worker' && existingParticipant.user_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to update this participant', 403));
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    // Supervisors+ can update all fields
    if (['supervisor', 'project-manager', 'property-point', 'system-admin'].includes(req.user!.role)) {
      if (siteId !== undefined) updateData.site_id = siteId;
      if (fullName !== undefined) updateData.full_name = fullName;
      if (saIdNumber !== undefined) {
        if (!/^\d{13}$/.test(saIdNumber)) {
          return next(new ApiError('Invalid SA ID number format', 400));
        }
        updateData.sa_id_number = saIdNumber;
      }
      if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
      if (gender !== undefined) updateData.gender = gender;
      if (status !== undefined) updateData.status = status;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (expectedEndDate !== undefined) updateData.expected_end_date = expectedEndDate;
      if (actualEndDate !== undefined) updateData.actual_end_date = actualEndDate;
    }

    // All users can update these fields
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (emergencyContactName !== undefined) updateData.emergency_contact_name = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergency_contact_phone = emergencyContactPhone;
    if (emergencyContactRelationship !== undefined) updateData.emergency_contact_relationship = emergencyContactRelationship;

    // POPIA consent
    if (popiaConsent !== undefined) {
      updateData.popia_consent = popiaConsent;
      if (popiaConsent && !existingParticipant.popia_consent_date) {
        updateData.popia_consent_date = new Date();
      }
    }

    if (codeOfConductSigned !== undefined) {
      updateData.code_of_conduct_signed = codeOfConductSigned;
    }

    const [participant] = await db('participants')
      .where({ id: req.params.id })
      .update(updateData)
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { participant },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await db('participants')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date() });

    if (result === 0) {
      return next(new ApiError('Participant not found', 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const participant = await db('participants')
      .leftJoin('sites', 'participants.site_id', 'sites.id')
      .where({ 'participants.user_id': req.user!.id })
      .whereNull('participants.deleted_at')
      .select(
        'participants.*',
        'sites.name as site_name',
        'sites.address as site_address'
      )
      .first();

    if (!participant) {
      return next(new ApiError('Participant profile not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { participant },
    });
  } catch (error) {
    next(error);
  }
};

export const enrollBiometric = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { biometricData } = req.body;

    const participant = await db('participants')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!participant) {
      return next(new ApiError('Participant not found', 404));
    }

    // Workers can only enroll their own biometrics
    if (req.user!.role === 'worker' && participant.user_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to enroll biometrics for this participant', 403));
    }

    const [updatedParticipant] = await db('participants')
      .where({ id: req.params.id })
      .update({
        biometric_enrolled: true,
        biometric_data: biometricData,
        updated_at: new Date(),
      })
      .returning('*');

    res.status(200).json({
      status: 'success',
      message: 'Biometric enrollment successful',
      data: {
        participant: {
          id: updatedParticipant.id,
          biometric_enrolled: updatedParticipant.biometric_enrolled,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentType, documentUrl } = req.body;

    const participant = await db('participants')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!participant) {
      return next(new ApiError('Participant not found', 404));
    }

    // Workers can only upload their own documents
    if (req.user!.role === 'worker' && participant.user_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to upload documents for this participant', 403));
    }

    // Update documents JSON
    const documents = participant.documents || {};
    documents[documentType] = {
      url: documentUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user!.id,
    };

    const [updatedParticipant] = await db('participants')
      .where({ id: req.params.id })
      .update({
        documents,
        updated_at: new Date(),
      })
      .returning('*');

    res.status(200).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: { participant: updatedParticipant },
    });
  } catch (error) {
    next(error);
  }
};

export const getParticipantStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await db('participants')
      .whereNull('deleted_at')
      .select(
        db.raw('COUNT(*) as total_participants'),
        db.raw("COUNT(*) FILTER (WHERE status = 'active') as active_participants"),
        db.raw("COUNT(*) FILTER (WHERE status = 'onboarding') as onboarding_participants"),
        db.raw("COUNT(*) FILTER (WHERE status = 'exited') as exited_participants"),
        db.raw('COUNT(*) FILTER (WHERE biometric_enrolled = true) as biometric_enrolled'),
        db.raw('COUNT(*) FILTER (WHERE popia_consent = true) as popia_consented')
      )
      .first();

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
