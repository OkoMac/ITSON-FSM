import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { participantId, siteId, date, status, startDate, endDate } = req.query;

    let query = db('attendance_records')
      .leftJoin('participants', 'attendance_records.participant_id', 'participants.id')
      .leftJoin('sites', 'attendance_records.site_id', 'sites.id')
      .select(
        'attendance_records.*',
        'participants.full_name as participant_name',
        'sites.name as site_name'
      );

    // Filter by participant
    if (participantId) {
      query = query.where('attendance_records.participant_id', participantId as string);
    }

    // Filter by site
    if (siteId) {
      query = query.where('attendance_records.site_id', siteId as string);
    }

    // Filter by specific date
    if (date) {
      query = query.where('attendance_records.date', date as string);
    }

    // Filter by date range
    if (startDate && endDate) {
      query = query.whereBetween('attendance_records.date', [startDate as string, endDate as string]);
    }

    // Filter by status
    if (status) {
      query = query.where('attendance_records.status', status as string);
    }

    // If worker, only show their attendance
    if (req.user!.role === 'worker') {
      const participant = await db('participants').where({ user_id: req.user!.id }).first();
      if (participant) {
        query = query.where('attendance_records.participant_id', participant.id);
      }
    }

    const records = await query.orderBy('attendance_records.date', 'desc');

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: { attendanceRecords: records },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const record = await db('attendance_records')
      .leftJoin('participants', 'attendance_records.participant_id', 'participants.id')
      .leftJoin('sites', 'attendance_records.site_id', 'sites.id')
      .where({ 'attendance_records.id': req.params.id })
      .select(
        'attendance_records.*',
        'participants.full_name as participant_name',
        'participants.user_id as participant_user_id',
        'sites.name as site_name',
        'sites.address as site_address'
      )
      .first();

    if (!record) {
      return next(new ApiError('Attendance record not found', 404));
    }

    // Workers can only see their own attendance
    if (req.user!.role === 'worker' && record.participant_user_id !== req.user!.id) {
      return next(new ApiError('You do not have permission to view this record', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { attendanceRecord: record },
    });
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      siteId,
      checkInLocation,
      checkInMethod,
      checkInPhoto,
      biometricConfidence,
    } = req.body;

    // Get participant from user
    const participant = await db('participants')
      .where({ user_id: req.user!.id })
      .first();

    if (!participant) {
      return next(new ApiError('Participant record not found', 404));
    }

    // Check if biometric enrollment is complete
    if (!participant.biometric_enrolled) {
      return next(new ApiError('Biometric enrollment required before check-in', 400));
    }

    // Validate site exists
    const site = await db('sites').where({ id: siteId }).first();
    if (!site) {
      return next(new ApiError('Site not found', 404));
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existingRecord = await db('attendance_records')
      .where({
        participant_id: participant.id,
        date: today,
      })
      .whereNotNull('check_in_time')
      .whereNull('check_out_time')
      .first();

    if (existingRecord) {
      return next(new ApiError('Already checked in for today', 400));
    }

    // Create attendance record
    const [attendanceRecord] = await db('attendance_records')
      .insert({
        participant_id: participant.id,
        site_id: siteId,
        date: today,
        check_in_time: new Date(),
        check_in_location: checkInLocation,
        check_in_method: checkInMethod,
        check_in_photo: checkInPhoto,
        biometric_confidence: biometricConfidence,
        status: 'present',
        synced: false,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: { attendanceRecord },
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      checkOutLocation,
      checkOutMethod,
      checkOutPhoto,
    } = req.body;

    // Get participant from user
    const participant = await db('participants')
      .where({ user_id: req.user!.id })
      .first();

    if (!participant) {
      return next(new ApiError('Participant record not found', 404));
    }

    const today = new Date().toISOString().split('T')[0];

    // Find today's check-in record
    const attendanceRecord = await db('attendance_records')
      .where({
        participant_id: participant.id,
        date: today,
      })
      .whereNotNull('check_in_time')
      .whereNull('check_out_time')
      .first();

    if (!attendanceRecord) {
      return next(new ApiError('No active check-in found for today', 404));
    }

    // Update with check-out details
    const [updatedRecord] = await db('attendance_records')
      .where({ id: attendanceRecord.id })
      .update({
        check_out_time: new Date(),
        check_out_location: checkOutLocation,
        check_out_method: checkOutMethod,
        check_out_photo: checkOutPhoto,
        synced: false,
        updated_at: new Date(),
      })
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { attendanceRecord: updatedRecord },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get participant from user
    const participant = await db('participants')
      .where({ user_id: req.user!.id })
      .first();

    if (!participant) {
      return next(new ApiError('Participant record not found', 404));
    }

    const { startDate, endDate } = req.query;

    let query = db('attendance_records')
      .leftJoin('sites', 'attendance_records.site_id', 'sites.id')
      .where({ 'attendance_records.participant_id': participant.id })
      .select(
        'attendance_records.*',
        'sites.name as site_name'
      );

    // Filter by date range
    if (startDate && endDate) {
      query = query.whereBetween('attendance_records.date', [startDate as string, endDate as string]);
    }

    const records = await query.orderBy('attendance_records.date', 'desc');

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: { attendanceRecords: records },
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get participant from user
    const participant = await db('participants')
      .where({ user_id: req.user!.id })
      .first();

    if (!participant) {
      return next(new ApiError('Participant record not found', 404));
    }

    const today = new Date().toISOString().split('T')[0];

    const todayRecord = await db('attendance_records')
      .leftJoin('sites', 'attendance_records.site_id', 'sites.id')
      .where({
        'attendance_records.participant_id': participant.id,
        'attendance_records.date': today,
      })
      .select(
        'attendance_records.*',
        'sites.name as site_name'
      )
      .first();

    res.status(200).json({
      status: 'success',
      data: {
        isCheckedIn: todayRecord?.check_in_time && !todayRecord?.check_out_time,
        attendanceRecord: todayRecord || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return next(new ApiError('Invalid status', 400));
    }

    const [updatedRecord] = await db('attendance_records')
      .where({ id: req.params.id })
      .update({
        status,
        notes,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedRecord) {
      return next(new ApiError('Attendance record not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { attendanceRecord: updatedRecord },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { participantId, startDate, endDate } = req.query;

    let query = db('attendance_records');

    if (participantId) {
      query = query.where('participant_id', participantId as string);
    }

    if (startDate && endDate) {
      query = query.whereBetween('date', [startDate as string, endDate as string]);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_days'),
        db.raw("COUNT(*) FILTER (WHERE status = 'present') as present_days"),
        db.raw("COUNT(*) FILTER (WHERE status = 'absent') as absent_days"),
        db.raw("COUNT(*) FILTER (WHERE status = 'late') as late_days"),
        db.raw("COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as completed_days"),
        db.raw('AVG(biometric_confidence) as avg_confidence')
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
