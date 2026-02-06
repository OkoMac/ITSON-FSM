import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';

/**
 * Reports Controller
 * Handles M&E reporting, IDC compliance reports, and data exports
 */

/**
 * Generate attendance report
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const generateAttendanceReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, siteId, participantId, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError('Start date and end date are required', 400);
    }

    let query = db('attendance')
      .select(
        'attendance.*',
        'participants.full_name as participant_name',
        'participants.sa_id_number as id_number',
        'sites.name as site_name',
        'sites.address as site_address'
      )
      .join('participants', 'attendance.participant_id', 'participants.id')
      .leftJoin('sites', 'attendance.site_id', 'sites.id')
      .where('attendance.check_in_time', '>=', startDate)
      .where('attendance.check_in_time', '<=', endDate)
      .whereNull('attendance.deleted_at')
      .orderBy('attendance.check_in_time', 'desc');

    if (siteId) {
      query = query.where({ 'attendance.site_id': siteId });
    }

    if (participantId) {
      query = query.where({ 'attendance.participant_id': participantId });
    }

    const records = await query;

    // Calculate statistics
    const stats = {
      totalRecords: records.length,
      totalHoursWorked: records.reduce((sum, r) => sum + (r.hours_worked || 0), 0),
      biometricVerified: records.filter(r => r.biometric_verified).length,
      uniqueParticipants: new Set(records.map(r => r.participant_id)).size,
      uniqueSites: new Set(records.map(r => r.site_id)).size,
    };

    res.status(200).json({
      status: 'success',
      data: {
        report: {
          type: 'attendance',
          period: { startDate, endDate },
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          statistics: stats,
          records: format === 'summary' ? undefined : records,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate participants report
 * @access Admin, Project Manager, Property Point
 */
export const generateParticipantsReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, siteId, onboardingStatus } = req.query;

    let query = db('participants')
      .select(
        'participants.*',
        'sites.name as site_name',
        db.raw('COUNT(DISTINCT attendance.id) as total_attendance'),
        db.raw('SUM(attendance.hours_worked) as total_hours_worked')
      )
      .leftJoin('sites', 'participants.site_id', 'sites.id')
      .leftJoin('attendance', 'participants.id', 'attendance.participant_id')
      .whereNull('participants.deleted_at')
      .groupBy('participants.id', 'sites.name');

    if (status) {
      query = query.where({ 'participants.status': status });
    }

    if (siteId) {
      query = query.where({ 'participants.site_id': siteId });
    }

    if (onboardingStatus) {
      query = query.where({ 'participants.onboarding_status': onboardingStatus });
    }

    const participants = await query;

    // Calculate statistics
    const stats = {
      total: participants.length,
      byStatus: {} as Record<string, number>,
      byOnboardingStatus: {} as Record<string, number>,
      biometricEnrolled: participants.filter(p => p.biometric_enrolled).length,
      popiaConsent: participants.filter(p => p.popia_consent).length,
      codeOfConductSigned: participants.filter(p => p.code_of_conduct_signed).length,
    };

    participants.forEach(p => {
      stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
      if (p.onboarding_status) {
        stats.byOnboardingStatus[p.onboarding_status] = (stats.byOnboardingStatus[p.onboarding_status] || 0) + 1;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        report: {
          type: 'participants',
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          statistics: stats,
          participants,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate tasks report
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const generateTasksReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, status, siteId, assignedTo } = req.query;

    let query = db('tasks')
      .select(
        'tasks.*',
        'sites.name as site_name',
        'participants.full_name as assigned_to_name',
        'supervisors.name as created_by_name'
      )
      .leftJoin('sites', 'tasks.site_id', 'sites.id')
      .leftJoin('participants', 'tasks.assigned_to', 'participants.id')
      .leftJoin('users as supervisors', 'tasks.created_by', 'supervisors.id')
      .whereNull('tasks.deleted_at');

    if (startDate) {
      query = query.where('tasks.created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('tasks.created_at', '<=', endDate);
    }

    if (status) {
      query = query.where({ 'tasks.status': status });
    }

    if (siteId) {
      query = query.where({ 'tasks.site_id': siteId });
    }

    if (assignedTo) {
      query = query.where({ 'tasks.assigned_to': assignedTo });
    }

    const tasks = await query;

    // Calculate statistics
    const stats = {
      total: tasks.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      completionRate: 0,
      avgCompletionTime: 0,
    };

    tasks.forEach(task => {
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    });

    const completedTasks = tasks.filter(t => t.status === 'completed');
    stats.completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        report: {
          type: 'tasks',
          period: { startDate, endDate },
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          statistics: stats,
          tasks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate compliance report (IDC-aligned)
 * @access Admin, Project Manager, Property Point
 */
export const generateComplianceReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all participants
    const participants = await db('participants')
      .whereNull('deleted_at')
      .select('*');

    // Get attendance records for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await db('attendance')
      .where('check_in_time', '>=', thirtyDaysAgo.toISOString())
      .whereNull('deleted_at')
      .select('*');

    // Calculate compliance metrics
    const compliance = {
      participants: {
        total: participants.length,
        verified: participants.filter(p => p.status === 'verified').length,
        biometricEnrolled: participants.filter(p => p.biometric_enrolled).length,
        biometricEnrollmentRate: 0,
        popiaConsent: participants.filter(p => p.popia_consent).length,
        popiaConsentRate: 0,
        codeOfConductSigned: participants.filter(p => p.code_of_conduct_signed).length,
        codeOfConductRate: 0,
        documentationComplete: participants.filter(p =>
          p.biometric_enrolled && p.popia_consent && p.code_of_conduct_signed
        ).length,
        documentationCompleteRate: 0,
      },
      attendance: {
        total: attendance.length,
        biometricVerified: attendance.filter(a => a.biometric_verified).length,
        biometricVerificationRate: 0,
        totalHoursWorked: attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0),
        avgHoursPerDay: 0,
      },
      idc: {
        complianceScore: 0,
        dataQuality: 0,
        auditReady: false,
      },
    };

    // Calculate rates
    if (participants.length > 0) {
      compliance.participants.biometricEnrollmentRate =
        (compliance.participants.biometricEnrolled / participants.length) * 100;
      compliance.participants.popiaConsentRate =
        (compliance.participants.popiaConsent / participants.length) * 100;
      compliance.participants.codeOfConductRate =
        (compliance.participants.codeOfConductSigned / participants.length) * 100;
      compliance.participants.documentationCompleteRate =
        (compliance.participants.documentationComplete / participants.length) * 100;
    }

    if (attendance.length > 0) {
      compliance.attendance.biometricVerificationRate =
        (compliance.attendance.biometricVerified / attendance.length) * 100;
      compliance.attendance.avgHoursPerDay =
        compliance.attendance.totalHoursWorked / 30;
    }

    // Calculate IDC compliance score (weighted average)
    const weights = {
      biometricEnrollment: 0.25,
      popiaConsent: 0.25,
      codeOfConduct: 0.15,
      biometricVerification: 0.25,
      documentationComplete: 0.10,
    };

    compliance.idc.complianceScore =
      (compliance.participants.biometricEnrollmentRate * weights.biometricEnrollment) +
      (compliance.participants.popiaConsentRate * weights.popiaConsent) +
      (compliance.participants.codeOfConductRate * weights.codeOfConduct) +
      (compliance.attendance.biometricVerificationRate * weights.biometricVerification) +
      (compliance.participants.documentationCompleteRate * weights.documentationComplete);

    compliance.idc.dataQuality = compliance.idc.complianceScore > 90 ? 100 : compliance.idc.complianceScore;
    compliance.idc.auditReady = compliance.idc.complianceScore >= 95;

    res.status(200).json({
      status: 'success',
      data: {
        report: {
          type: 'compliance',
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          period: {
            startDate: thirtyDaysAgo.toISOString(),
            endDate: new Date().toISOString(),
          },
          compliance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate M&E (Monitoring & Evaluation) report
 * @access Admin, Project Manager, Property Point
 */
export const generateMEReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError('Start date and end date are required', 400);
    }

    // Get data for M&E indicators
    const participants = await db('participants')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .whereNull('deleted_at');

    const attendance = await db('attendance')
      .where('check_in_time', '>=', startDate)
      .where('check_in_time', '<=', endDate)
      .whereNull('deleted_at');

    const tasks = await db('tasks')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .whereNull('deleted_at');

    // M&E Indicators
    const indicators = {
      inputIndicators: {
        participantsOnboarded: participants.length,
        trainingSessionsCompleted: 0, // Would come from training module
        resourcesAllocated: 0, // Would come from resource module
      },
      outputIndicators: {
        tasksCompleted: tasks.filter(t => t.status === 'completed').length,
        totalHoursWorked: attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0),
        sitesActive: new Set(attendance.map(a => a.site_id)).size,
      },
      outcomeIndicators: {
        participantRetentionRate: 0,
        taskCompletionRate: tasks.length > 0
          ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
          : 0,
        avgProductivity: 0,
      },
      impactIndicators: {
        employmentGenerated: participants.filter(p => p.status === 'active').length,
        skillsDeveloped: 0, // Would come from training module
        economicValue: 0, // Would be calculated based on hours worked and rates
      },
    };

    // Calculate retention rate (participants still active)
    const activeParticipants = participants.filter(p => p.status === 'active' || p.status === 'verified');
    indicators.outcomeIndicators.participantRetentionRate =
      participants.length > 0 ? (activeParticipants.length / participants.length) * 100 : 0;

    // Calculate average productivity (tasks per participant per day)
    const days = Math.ceil(
      (new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24)
    );
    indicators.outcomeIndicators.avgProductivity =
      participants.length > 0 && days > 0
        ? tasks.length / participants.length / days
        : 0;

    res.status(200).json({
      status: 'success',
      data: {
        report: {
          type: 'monitoring_evaluation',
          period: { startDate, endDate },
          generatedAt: new Date().toISOString(),
          generatedBy: req.user?.id,
          indicators,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export report data (CSV/Excel format)
 * @access Admin, Project Manager, Property Point
 */
export const exportReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportType, startDate, endDate, format = 'csv' } = req.query;

    if (!reportType) {
      throw new ApiError('Report type is required', 400);
    }

    let data: any[] = [];
    let headers: string[] = [];

    switch (reportType) {
      case 'attendance':
        data = await db('attendance')
          .select(
            'attendance.*',
            'participants.full_name',
            'sites.name as site_name'
          )
          .join('participants', 'attendance.participant_id', 'participants.id')
          .leftJoin('sites', 'attendance.site_id', 'sites.id')
          .where('attendance.check_in_time', '>=', startDate)
          .where('attendance.check_in_time', '<=', endDate)
          .whereNull('attendance.deleted_at');

        headers = ['Date', 'Participant', 'Site', 'Check In', 'Check Out', 'Hours', 'Biometric Verified', 'Status'];
        break;

      case 'participants':
        data = await db('participants')
          .whereNull('deleted_at')
          .select('*');

        headers = ['Name', 'ID Number', 'Email', 'Phone', 'Status', 'Site', 'Biometric Enrolled', 'POPIA Consent'];
        break;

      default:
        throw new ApiError('Invalid report type', 400);
    }

    // In production, convert to CSV/Excel format
    // For now, return JSON
    res.status(200).json({
      status: 'success',
      data: {
        reportType,
        format,
        headers,
        data,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
