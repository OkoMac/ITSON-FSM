import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';

/**
 * Sync Controller
 * Handles data synchronization with external systems (Kwantu, HR systems, etc.)
 */

/**
 * Sync participant data to external system
 * @access Admin, Project Manager, Property Point
 */
export const syncParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { participantId } = req.params;
    const { targetSystem = 'kwantu' } = req.body;

    // Get participant data
    const participant = await db('participants')
      .where({ id: participantId })
      .whereNull('deleted_at')
      .first();

    if (!participant) {
      throw new ApiError('Participant not found', 404);
    }

    // Only sync verified participants
    if (participant.status !== 'verified' && participant.status !== 'active') {
      throw new ApiError('Participant must be verified before syncing', 400);
    }

    // Get latest attendance records
    const attendanceRecords = await db('attendance')
      .where({ participant_id: participantId })
      .whereNull('deleted_at')
      .orderBy('check_in_time', 'desc')
      .limit(30);

    // Prepare sync payload
    const syncPayload = {
      participant: {
        id: participant.id,
        fullName: participant.full_name,
        idNumber: participant.sa_id_number,
        email: participant.email,
        phone: participant.phone,
        dateOfBirth: participant.date_of_birth,
        gender: participant.gender,
        status: participant.status,
        biometricEnrolled: participant.biometric_enrolled,
        popiaConsent: participant.popia_consent,
        popiaConsentDate: participant.popia_consent_date,
        codeOfConductSigned: participant.code_of_conduct_signed,
      },
      attendance: attendanceRecords.map(record => ({
        id: record.id,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        hoursWorked: record.hours_worked,
        siteId: record.site_id,
        biometricVerified: record.biometric_verified,
        status: record.status,
      })),
      metadata: {
        syncedAt: new Date().toISOString(),
        syncedBy: req.user?.id,
        targetSystem,
      },
    };

    // Create sync record
    const [syncRecord] = await db('sync_records')
      .insert({
        record_type: 'participant',
        record_id: participantId,
        target_system: targetSystem,
        payload: JSON.stringify(syncPayload),
        status: 'pending',
        created_by: req.user?.id,
      })
      .returning('*');

    // In production, this would trigger actual sync to external system
    // For now, simulate sync process
    await performSync(syncRecord.id, targetSystem, syncPayload);

    res.status(200).json({
      status: 'success',
      data: {
        syncRecord: {
          id: syncRecord.id,
          status: 'synced',
          syncedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk sync multiple participants
 * @access Admin, Project Manager, Property Point
 */
export const bulkSyncParticipants = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { participantIds, targetSystem = 'kwantu' } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      throw new ApiError('Please provide an array of participant IDs', 400);
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const participantId of participantIds) {
      try {
        // Get participant
        const participant = await db('participants')
          .where({ id: participantId })
          .whereNull('deleted_at')
          .first();

        if (!participant) {
          results.failed.push({ id: participantId, error: 'Participant not found' });
          continue;
        }

        if (participant.status !== 'verified' && participant.status !== 'active') {
          results.failed.push({ id: participantId, error: 'Participant not verified' });
          continue;
        }

        // Get attendance records
        const attendanceRecords = await db('attendance')
          .where({ participant_id: participantId })
          .whereNull('deleted_at')
          .orderBy('check_in_time', 'desc')
          .limit(30);

        // Prepare payload
        const syncPayload = {
          participant: {
            id: participant.id,
            fullName: participant.full_name,
            idNumber: participant.sa_id_number,
            email: participant.email,
            phone: participant.phone,
          },
          attendance: attendanceRecords.map(r => ({
            checkInTime: r.check_in_time,
            checkOutTime: r.check_out_time,
            hoursWorked: r.hours_worked,
          })),
        };

        // Create sync record
        await db('sync_records').insert({
          record_type: 'participant',
          record_id: participantId,
          target_system: targetSystem,
          payload: JSON.stringify(syncPayload),
          status: 'synced',
          created_by: req.user?.id,
          synced_at: new Date(),
        });

        results.successful.push(participantId);
      } catch (err: any) {
        results.failed.push({ id: participantId, error: err.message });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        total: participantIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sync history
 * @access Admin, Project Manager, Property Point
 */
export const getSyncHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { targetSystem, status, recordType, page = 1, limit = 50 } = req.query;

    let query = db('sync_records')
      .select(
        'sync_records.*',
        'participants.full_name as participant_name',
        'users.name as synced_by_name'
      )
      .leftJoin('participants', 'sync_records.record_id', 'participants.id')
      .leftJoin('users', 'sync_records.created_by', 'users.id')
      .orderBy('sync_records.created_at', 'desc');

    if (targetSystem) {
      query = query.where({ 'sync_records.target_system': targetSystem });
    }

    if (status) {
      query = query.where({ 'sync_records.status': status });
    }

    if (recordType) {
      query = query.where({ 'sync_records.record_type': recordType });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const records = await query.limit(Number(limit)).offset(offset);

    // Get total count
    const totalResult = await db('sync_records')
      .count('* as count')
      .first();
    const total = Number(totalResult?.count || 0);

    res.status(200).json({
      status: 'success',
      data: {
        records,
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
 * Get sync status for a specific record
 * @access Admin, Project Manager, Property Point
 */
export const getSyncStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { recordId } = req.params;

    const syncRecords = await db('sync_records')
      .where({ record_id: recordId })
      .orderBy('created_at', 'desc');

    const latestSync = syncRecords[0];

    res.status(200).json({
      status: 'success',
      data: {
        recordId,
        lastSync: latestSync ? {
          syncedAt: latestSync.synced_at,
          status: latestSync.status,
          targetSystem: latestSync.target_system,
          attempts: latestSync.attempts,
          error: latestSync.error_message,
        } : null,
        syncHistory: syncRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retry failed sync
 * @access Admin, Project Manager
 */
export const retrySyncRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { syncId } = req.params;

    const syncRecord = await db('sync_records')
      .where({ id: syncId })
      .first();

    if (!syncRecord) {
      throw new ApiError('Sync record not found', 404);
    }

    if (syncRecord.status === 'synced') {
      throw new ApiError('Record already synced', 400);
    }

    // Update attempts
    await db('sync_records')
      .where({ id: syncId })
      .update({
        status: 'pending',
        attempts: syncRecord.attempts + 1,
        updated_at: new Date(),
      });

    // Retry sync
    const payload = JSON.parse(syncRecord.payload);
    await performSync(syncId, syncRecord.target_system, payload);

    res.status(200).json({
      status: 'success',
      message: 'Sync retry initiated',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Configure sync settings
 * @access Admin only
 */
export const configureSyncSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { targetSystem, enabled, autoSync, syncFrequency, webhookUrl, apiKey } = req.body;

    // Store sync configuration
    const [config] = await db('sync_configurations')
      .insert({
        target_system: targetSystem,
        enabled: enabled !== undefined ? enabled : true,
        auto_sync: autoSync !== undefined ? autoSync : false,
        sync_frequency: syncFrequency || 'daily',
        webhook_url: webhookUrl,
        api_key: apiKey, // Should be encrypted in production
        updated_by: req.user?.id,
      })
      .onConflict('target_system')
      .merge()
      .returning('*');

    res.status(200).json({
      status: 'success',
      data: { config },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sync configuration
 * @access Admin, Project Manager
 */
export const getSyncConfiguration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { targetSystem } = req.params;

    const config = await db('sync_configurations')
      .where({ target_system: targetSystem })
      .first();

    if (!config) {
      throw new ApiError('Sync configuration not found', 404);
    }

    // Don't expose API key in response
    const { api_key, ...safeConfig } = config;

    res.status(200).json({
      status: 'success',
      data: { config: { ...safeConfig, hasApiKey: !!api_key } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to perform actual sync
 * In production, this would make API calls to external systems
 */
async function performSync(
  syncId: string,
  targetSystem: string,
  payload: any
): Promise<void> {
  try {
    // Get sync configuration
    const config = await db('sync_configurations')
      .where({ target_system: targetSystem })
      .first();

    if (!config || !config.enabled) {
      throw new Error(`Sync to ${targetSystem} is not enabled`);
    }

    // In production, make actual API call to external system
    // Example for Kwantu:
    // const response = await fetch(config.webhook_url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.api_key}`,
    //   },
    //   body: JSON.stringify(payload),
    // });

    // Simulate successful sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update sync record
    await db('sync_records')
      .where({ id: syncId })
      .update({
        status: 'synced',
        synced_at: new Date(),
        updated_at: new Date(),
      });
  } catch (error: any) {
    // Update sync record with error
    await db('sync_records')
      .where({ id: syncId })
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date(),
      });

    throw error;
  }
}
