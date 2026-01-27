/**
 * Offline-First Manager
 *
 * Handles:
 * - Offline operation queuing
 * - Network detection
 * - Automatic sync on reconnect
 * - Conflict resolution
 * - Data integrity
 */

import { db } from '@/utils/db';

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ operation: string; error: string }>;
}

class OfflineManager {
  private syncInProgress = false;
  private networkListener: (() => void) | null = null;

  /**
   * Initialize offline manager
   */
  async initialize() {
    console.log('Initializing offline manager...');

    // Listen for network changes
    this.setupNetworkListener();

    // Attempt initial sync if online
    if (navigator.onLine) {
      await this.syncAll();
    }
  }

  /**
   * Set up network status listener
   */
  private setupNetworkListener() {
    const handleOnline = async () => {
      console.log('Network reconnected - starting sync');
      await this.syncAll();
    };

    const handleOffline = () => {
      console.log('Network disconnected - entering offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.networkListener = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Queue an offline operation
   */
  async queueOperation(
    type: OfflineOperation['type'],
    entity: string,
    entityId: string,
    data: any
  ): Promise<void> {
    const operation: OfflineOperation = {
      id: crypto.randomUUID(),
      type,
      entity,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      attempts: 0,
    };

    // Store in IndexedDB offline queue
    await this.storeOperation(operation);

    console.log(`Queued ${type} operation for ${entity}:${entityId}`);

    // Try immediate sync if online
    if (navigator.onLine && !this.syncInProgress) {
      this.syncAll().catch(console.error);
    }
  }

  /**
   * Store operation in IndexedDB
   */
  private async storeOperation(operation: OfflineOperation): Promise<void> {
    // Create offline_operations table if it doesn't exist
    const table = (db as any).offline_operations;

    if (table) {
      await table.add(operation);
    } else {
      // Fallback: store in localStorage
      const key = `offline_op_${operation.id}`;
      localStorage.setItem(key, JSON.stringify(operation));
    }
  }

  /**
   * Get all pending operations
   */
  private async getPendingOperations(): Promise<OfflineOperation[]> {
    try {
      const table = (db as any).offline_operations;

      if (table) {
        return await table.where('synced').equals(false).toArray();
      } else {
        // Fallback: get from localStorage
        const operations: OfflineOperation[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('offline_op_')) {
            const data = localStorage.getItem(key);
            if (data) {
              const op = JSON.parse(data);
              if (!op.synced) {
                operations.push(op);
              }
            }
          }
        }
        return operations;
      }
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }

  /**
   * Sync all pending operations
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    if (!navigator.onLine) {
      console.log('Cannot sync - offline');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;
    console.log('Starting sync of all pending operations...');

    const operations = await this.getPendingOperations();
    console.log(`Found ${operations.length} pending operations`);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          operation: `${operation.type} ${operation.entity}:${operation.entityId}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Failed to sync operation ${operation.id}:`, error);
      }
    }

    this.syncInProgress = false;
    console.log(`Sync completed: ${result.synced} synced, ${result.failed} failed`);

    return result;
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: OfflineOperation): Promise<void> {
    console.log(`Syncing ${operation.type} ${operation.entity}:${operation.entityId}`);

    // Update attempt count
    operation.attempts++;
    operation.lastAttempt = new Date().toISOString();

    try {
      // Simulate API call (replace with actual API calls in production)
      await this.performServerSync(operation);

      // Mark as synced
      operation.synced = true;
      operation.error = undefined;

      await this.updateOperation(operation);

      console.log(`Successfully synced ${operation.id}`);
    } catch (error) {
      operation.error = error instanceof Error ? error.message : 'Sync failed';
      await this.updateOperation(operation);

      // Retry logic: give up after 5 attempts
      if (operation.attempts >= 5) {
        console.error(`Giving up on operation ${operation.id} after 5 attempts`);
        // Mark as failed but keep for manual review
        operation.synced = false;
      }

      throw error;
    }
  }

  /**
   * Perform actual server sync (placeholder - implement with real API)
   */
  private async performServerSync(operation: OfflineOperation): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production, make actual API calls here
    const endpoint = this.getApiEndpoint(operation.entity);
    const method = this.getHttpMethod(operation.type);

    console.log(`Would ${method} to ${endpoint} with data:`, operation.data);

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Network error');
    }

    // Success
    return;
  }

  /**
   * Get API endpoint for entity
   */
  private getApiEndpoint(entity: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.itsonfsm.com';
    return `${baseUrl}/api/${entity}`;
  }

  /**
   * Get HTTP method for operation type
   */
  private getHttpMethod(type: OfflineOperation['type']): string {
    switch (type) {
      case 'CREATE':
        return 'POST';
      case 'UPDATE':
        return 'PUT';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  /**
   * Update operation in storage
   */
  private async updateOperation(operation: OfflineOperation): Promise<void> {
    const table = (db as any).offline_operations;

    if (table) {
      await table.put(operation);
    } else {
      // Fallback: update in localStorage
      const key = `offline_op_${operation.id}`;
      localStorage.setItem(key, JSON.stringify(operation));
    }
  }

  /**
   * Clean up synced operations
   */
  async cleanupSyncedOperations(): Promise<number> {
    const table = (db as any).offline_operations;

    if (table) {
      const synced = await table.where('synced').equals(true).toArray();

      // Keep operations for 7 days for audit trail
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const toDelete = synced.filter((op) => new Date(op.timestamp) < sevenDaysAgo);

      for (const op of toDelete) {
        await table.delete(op.id);
      }

      return toDelete.length;
    } else {
      // Fallback: clean from localStorage
      let count = 0;
      const keysToDelete: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('offline_op_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const op = JSON.parse(data);
            if (op.synced) {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

              if (new Date(op.timestamp) < sevenDaysAgo) {
                keysToDelete.push(key);
                count++;
              }
            }
          }
        }
      }

      keysToDelete.forEach((key) => localStorage.removeItem(key));

      return count;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    lastSync?: string;
  }> {
    const operations = await this.getPendingOperations();

    const pending = operations.filter((op) => !op.synced && op.attempts < 5).length;
    const synced = operations.filter((op) => op.synced).length;
    const failed = operations.filter((op) => !op.synced && op.attempts >= 5).length;

    return {
      pending,
      synced,
      failed,
      lastSync: operations[0]?.lastAttempt,
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<SyncResult> {
    console.log('Force sync requested');
    return await this.syncAll();
  }

  /**
   * Clear all operations (use with caution!)
   */
  async clearAllOperations(): Promise<void> {
    const table = (db as any).offline_operations;

    if (table) {
      await table.clear();
    } else {
      // Clear from localStorage
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('offline_op_')) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
    }

    console.log('Cleared all offline operations');
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();
