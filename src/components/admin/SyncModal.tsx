/**
 * Kwantu Sync Modal
 *
 * Interface for managing data synchronization with Kwantu platform
 * Displays sync status, triggers manual syncs, and shows sync history
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, Badge } from '@/components/ui';
import {
  syncAllPendingRecords,
  getSyncQueueStatus,
  retryFailedSyncs,
  type SyncProgress,
} from '@/services/kwantu/syncEngine';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    synced: 0,
    failed: 0,
    pending: 0,
    percentage: 0,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSyncStatus();
    }
  }, [isOpen]);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncQueueStatus();
      setSyncProgress(status);
    } catch (err: any) {
      console.error('Error loading sync status:', err);
      setError(err.message);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncAllPendingRecords();
      setSyncProgress(result);
      setLastSyncTime(new Date().toLocaleString('en-ZA'));

      if (result.failed > 0) {
        setError(`Synced ${result.synced} records, but ${result.failed} failed.`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const retriedCount = await retryFailedSyncs(3);

      if (retriedCount > 0) {
        await loadSyncStatus();
      }

      setError(`Retried ${retriedCount} failed records.`);
    } catch (err: any) {
      console.error('Retry error:', err);
      setError(err.message || 'Retry failed. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kwantu Sync Manager"
      size="lg"
    >
      <div className="space-y-24">
        {/* Sync Progress Overview */}
        <div className="glass-card-secondary p-24 rounded-glass">
          <h3 className="text-base font-semibold text-text-primary mb-16">
            Sync Queue Status
          </h3>

          {/* Progress Bar */}
          <div className="mb-16">
            <div className="w-full h-8 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-blue to-status-success transition-all duration-500"
                style={{ width: `${syncProgress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary text-center mt-8">
              {syncProgress.percentage.toFixed(1)}% synced
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-12">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary font-sf-mono">
                {syncProgress.total}
              </p>
              <p className="text-xs text-text-tertiary mt-4">Total Records</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-status-success font-sf-mono">
                {syncProgress.synced}
              </p>
              <p className="text-xs text-text-tertiary mt-4">Synced</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-status-warning font-sf-mono">
                {syncProgress.pending}
              </p>
              <p className="text-xs text-text-tertiary mt-4">Pending</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-status-error font-sf-mono">
                {syncProgress.failed}
              </p>
              <p className="text-xs text-text-tertiary mt-4">Failed</p>
            </div>
          </div>
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="glass-card-secondary p-16 rounded-glass-sm">
            <div className="flex items-center gap-12">
              <svg
                className="w-5 h-5 text-status-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Last sync completed
                </p>
                <p className="text-xs text-text-tertiary">{lastSyncTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-card-secondary p-16 rounded-glass-sm border border-status-warning/20">
            <div className="flex gap-12">
              <svg
                className="w-5 h-5 text-status-warning flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-status-warning">{error}</p>
            </div>
          </div>
        )}

        {/* Sync Information */}
        <div className="glass-card-secondary p-24 rounded-glass">
          <h3 className="text-base font-semibold text-text-primary mb-16">
            Sync Schedule
          </h3>

          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <svg
                  className="w-5 h-5 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Real-time Sync
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Verified participants
                  </p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <svg
                  className="w-5 h-5 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Daily Sync
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Attendance records at 00:30
                  </p>
                </div>
              </div>
              <Badge variant="info">Scheduled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <svg
                  className="w-5 h-5 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Weekly Summary
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Sunday at 00:00
                  </p>
                </div>
              </div>
              <Badge variant="info">Scheduled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <svg
                  className="w-5 h-5 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Monthly Payroll
                  </p>
                  <p className="text-xs text-text-tertiary">
                    25th of each month
                  </p>
                </div>
              </div>
              <Badge variant="info">Scheduled</Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-12">
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing || syncProgress.pending === 0}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-8"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync Now ({syncProgress.pending})
              </>
            )}
          </Button>

          {syncProgress.failed > 0 && (
            <Button
              onClick={handleRetryFailed}
              variant="secondary"
              disabled={isRetrying}
              className="flex-1"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-8"></div>
                  Retrying...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Failed ({syncProgress.failed})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="glass-card-secondary p-16 rounded-glass-sm">
          <p className="text-xs text-text-tertiary">
            <strong className="text-text-secondary">Note:</strong> Manual sync will
            sync all pending attendance records, verified participants, and completed
            tasks to the Kwantu platform. Sync operations happen in the background and
            may take a few moments to complete.
          </p>
        </div>
      </div>
    </Modal>
  );
};
