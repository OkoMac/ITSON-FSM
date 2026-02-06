import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';

/**
 * Analytics Controller
 * Handles analytics data for dashboards and insights
 */

/**
 * Get dashboard analytics
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const getDashboardAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = '30days', siteId } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Participants statistics
    let participantQuery = db('participants').whereNull('deleted_at');
    if (siteId) participantQuery = participantQuery.where({ site_id: siteId });

    const participants = await participantQuery;
    const activeParticipants = participants.filter(p => p.status === 'active');

    // Attendance statistics
    let attendanceQuery = db('attendance')
      .whereNull('deleted_at')
      .where('check_in_time', '>=', startDate)
      .where('check_in_time', '<=', endDate);
    if (siteId) attendanceQuery = attendanceQuery.where({ site_id: siteId });

    const attendance = await attendanceQuery;

    // Task statistics
    let taskQuery = db('tasks')
      .whereNull('deleted_at')
      .where('created_at', '>=', startDate);
    if (siteId) taskQuery = taskQuery.where({ site_id: siteId });

    const tasks = await taskQuery;

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await db('attendance')
      .whereNull('deleted_at')
      .where('check_in_time', '>=', today)
      .count('* as count')
      .first();

    const analytics = {
      overview: {
        totalParticipants: participants.length,
        activeParticipants: activeParticipants.length,
        totalAttendanceRecords: attendance.length,
        totalTasks: tasks.length,
        todayAttendance: Number(todayAttendance?.count || 0),
      },
      participants: {
        byStatus: {
          active: participants.filter(p => p.status === 'active').length,
          verified: participants.filter(p => p.status === 'verified').length,
          pending: participants.filter(p => p.status === 'pending').length,
          inactive: participants.filter(p => p.status === 'inactive').length,
        },
        byGender: {
          male: participants.filter(p => p.gender === 'male').length,
          female: participants.filter(p => p.gender === 'female').length,
          other: participants.filter(p => p.gender === 'other').length,
        },
        biometricEnrollment: {
          enrolled: participants.filter(p => p.biometric_enrolled).length,
          pending: participants.filter(p => !p.biometric_enrolled).length,
          enrollmentRate: participants.length > 0
            ? (participants.filter(p => p.biometric_enrolled).length / participants.length) * 100
            : 0,
        },
      },
      attendance: {
        total: attendance.length,
        totalHoursWorked: attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0),
        averageHoursPerDay: attendance.length > 0
          ? attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0) / attendance.length
          : 0,
        byStatus: {
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          late: attendance.filter(a => a.status === 'late').length,
          excused: attendance.filter(a => a.status === 'excused').length,
        },
        biometricVerificationRate: attendance.length > 0
          ? (attendance.filter(a => a.biometric_verified).length / attendance.length) * 100
          : 0,
      },
      tasks: {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          cancelled: tasks.filter(t => t.status === 'cancelled').length,
        },
        byPriority: {
          low: tasks.filter(t => t.priority === 'low').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          high: tasks.filter(t => t.priority === 'high').length,
          urgent: tasks.filter(t => t.priority === 'urgent').length,
        },
        completionRate: tasks.length > 0
          ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
          : 0,
        averageCompletionTime: await calculateAverageCompletionTime(tasks),
      },
      compliance: {
        popiaConsent: {
          total: participants.length,
          consented: participants.filter(p => p.popia_consent).length,
          rate: participants.length > 0
            ? (participants.filter(p => p.popia_consent).length / participants.length) * 100
            : 0,
        },
        codeOfConduct: {
          total: participants.length,
          signed: participants.filter(p => p.code_of_conduct_signed).length,
          rate: participants.length > 0
            ? (participants.filter(p => p.code_of_conduct_signed).length / participants.length) * 100
            : 0,
        },
      },
    };

    res.status(200).json({
      status: 'success',
      data: {
        analytics,
        period: { start: startDate, end: endDate },
        siteId: siteId || 'all',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance trends
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const getAttendanceTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = '30days', siteId, groupBy = 'day' } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    let query = db('attendance')
      .whereNull('deleted_at')
      .where('check_in_time', '>=', startDate)
      .where('check_in_time', '<=', endDate);

    if (siteId) {
      query = query.where({ site_id: siteId });
    }

    const records = await query;

    // Group by day/week/month
    const trends = groupAttendanceData(records, groupBy as string);

    res.status(200).json({
      status: 'success',
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task completion trends
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const getTaskTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = '30days', siteId } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    let query = db('tasks')
      .whereNull('deleted_at')
      .where('created_at', '>=', startDate);

    if (siteId) {
      query = query.where({ site_id: siteId });
    }

    const tasks = await query;

    const trends = groupTaskData(tasks);

    res.status(200).json({
      status: 'success',
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get participant growth trends
 * @access Admin, Project Manager, Property Point
 */
export const getParticipantGrowth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = '12months' } = req.query;

    const endDate = new Date();
    const startDate = new Date();

    if (period === '12months') {
      startDate.setMonth(startDate.getMonth() - 12);
    } else if (period === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    const participants = await db('participants')
      .whereNull('deleted_at')
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'asc');

    const growth = groupParticipantGrowth(participants);

    res.status(200).json({
      status: 'success',
      data: { growth },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get site performance comparison
 * @access Admin, Project Manager, Property Point
 */
export const getSitePerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sites = await db('sites').whereNull('deleted_at');

    const sitePerformance = await Promise.all(
      sites.map(async (site) => {
        const participants = await db('participants')
          .where({ site_id: site.id })
          .whereNull('deleted_at')
          .count('* as count')
          .first();

        const attendance = await db('attendance')
          .where({ site_id: site.id })
          .whereNull('deleted_at')
          .select(
            db.raw('COUNT(*) as total'),
            db.raw('SUM(hours_worked) as total_hours'),
            db.raw('AVG(hours_worked) as avg_hours')
          )
          .first();

        const tasks = await db('tasks')
          .where({ site_id: site.id })
          .whereNull('deleted_at')
          .select(
            db.raw('COUNT(*) as total'),
            db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed")
          )
          .first();

        return {
          site: {
            id: site.id,
            name: site.name,
            address: site.address,
          },
          metrics: {
            participants: Number(participants?.count || 0),
            attendanceRecords: Number(attendance?.total || 0),
            totalHoursWorked: Number(attendance?.total_hours || 0),
            avgHoursPerRecord: Number(attendance?.avg_hours || 0),
            totalTasks: Number(tasks?.total || 0),
            completedTasks: Number(tasks?.completed || 0),
            taskCompletionRate: tasks?.total
              ? (Number(tasks.completed) / Number(tasks.total)) * 100
              : 0,
          },
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: { sitePerformance },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top performers
 * @access Admin, Project Manager, Property Point, Supervisor
 */
export const getTopPerformers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = 10, metric = 'hours', period = '30days' } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period.replace('days', '')));

    // Get participants with their stats
    const participants = await db('participants')
      .select('participants.*')
      .whereNull('participants.deleted_at')
      .where('participants.status', 'active');

    const participantsWithStats = await Promise.all(
      participants.map(async (p) => {
        const attendanceStats = await db('attendance')
          .where({ participant_id: p.id })
          .where('check_in_time', '>=', startDate)
          .whereNull('deleted_at')
          .select(
            db.raw('COUNT(*) as days_worked'),
            db.raw('SUM(hours_worked) as total_hours')
          )
          .first();

        const taskStats = await db('tasks')
          .where({ assigned_to: p.id })
          .where('created_at', '>=', startDate)
          .whereNull('deleted_at')
          .select(
            db.raw('COUNT(*) as total_tasks'),
            db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks")
          )
          .first();

        return {
          participant: {
            id: p.id,
            name: p.full_name,
            email: p.email,
          },
          stats: {
            daysWorked: Number(attendanceStats?.days_worked || 0),
            totalHours: Number(attendanceStats?.total_hours || 0),
            totalTasks: Number(taskStats?.total_tasks || 0),
            completedTasks: Number(taskStats?.completed_tasks || 0),
          },
        };
      })
    );

    // Sort based on metric
    let sorted;
    if (metric === 'hours') {
      sorted = participantsWithStats.sort((a, b) => b.stats.totalHours - a.stats.totalHours);
    } else if (metric === 'tasks') {
      sorted = participantsWithStats.sort((a, b) => b.stats.completedTasks - a.stats.completedTasks);
    } else {
      sorted = participantsWithStats.sort((a, b) => b.stats.daysWorked - a.stats.daysWorked);
    }

    const topPerformers = sorted.slice(0, Number(limit));

    res.status(200).json({
      status: 'success',
      data: { topPerformers },
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function calculateAverageCompletionTime(tasks: any[]): number {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.created_at).getTime();
    const completed = new Date(task.completed_at).getTime();
    return sum + (completed - created);
  }, 0);

  return totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // Convert to days
}

function groupAttendanceData(records: any[], groupBy: string): any[] {
  const grouped: { [key: string]: any } = {};

  records.forEach(record => {
    const date = new Date(record.check_in_time);
    let key: string;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        count: 0,
        hours: 0,
        biometricVerified: 0,
      };
    }

    grouped[key].count++;
    grouped[key].hours += record.hours_worked || 0;
    if (record.biometric_verified) grouped[key].biometricVerified++;
  });

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

function groupTaskData(tasks: any[]): any[] {
  const grouped: { [key: string]: any } = {};

  tasks.forEach(task => {
    const date = new Date(task.created_at);
    const key = date.toISOString().split('T')[0];

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        created: 0,
        completed: 0,
        pending: 0,
        in_progress: 0,
      };
    }

    grouped[key].created++;
    if (task.status === 'completed') grouped[key].completed++;
    if (task.status === 'pending') grouped[key].pending++;
    if (task.status === 'in_progress') grouped[key].in_progress++;
  });

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

function groupParticipantGrowth(participants: any[]): any[] {
  const grouped: { [key: string]: any } = {};

  participants.forEach(participant => {
    const date = new Date(participant.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[key]) {
      grouped[key] = {
        month: key,
        new: 0,
        total: 0,
      };
    }

    grouped[key].new++;
  });

  // Calculate cumulative total
  let total = 0;
  const result = Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
  result.forEach(item => {
    total += item.new;
    item.total = total;
  });

  return result;
}
