import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Cloud, CloudOff, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { offlineManager, type OfflineOperation } from '@/services/offline/offlineManager';

export function OfflineSyncPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadOperations();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOperations = async () => {
    const ops = await offlineManager.getPendingOperations();
    setOperations(ops);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await offlineManager.syncAll();
      setLastSync(new Date().toISOString());
      loadOperations();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanup = async () => {
    await offlineManager.cleanupSyncedOperations();
    loadOperations();
  };

  const pendingOps = operations.filter(op => !op.synced);
  const syncedOps = operations.filter(op => op.synced);

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div>
        <h1 className="text-24 font-bold">Offline Sync Status</h1>
        <p className="text-gray-600 mt-4">Monitor and manage offline data synchronization</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-16">
        <Card className={'p-20 ' + (isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <div className="flex items-center justify-between">
            <div>
              <p className={'text-sm mb-4 ' + (isOnline ? 'text-green-600' : 'text-red-600')}>
                Connection Status
              </p>
              <p className={'text-24 font-bold ' + (isOnline ? 'text-green-900' : 'text-red-900')}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            {isOnline ? (
              <Cloud className="w-32 h-32 text-green-600 opacity-50" />
            ) : (
              <CloudOff className="w-32 h-32 text-red-600 opacity-50" />
            )}
          </div>
        </Card>

        <Card className="p-20 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 mb-4">Pending Operations</p>
              <p className="text-24 font-bold text-orange-900">{pendingOps.length}</p>
            </div>
            <Clock className="w-32 h-32 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-20 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-4">Synced Operations</p>
              <p className="text-24 font-bold text-blue-900">{syncedOps.length}</p>
            </div>
            <CheckCircle className="w-32 h-32 text-blue-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card className="p-24">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Manual Sync</h3>
            <p className="text-sm text-gray-600 mt-4">
              {lastSync
                ? 'Last synced: ' + new Date(lastSync).toLocaleString()
                : 'Never synced'}
            </p>
          </div>
          <div className="flex space-x-12">
            <Button
              onClick={handleSync}
              disabled={!isOnline || syncing || pendingOps.length === 0}
            >
              <RefreshCw className={'w-16 h-16 mr-8 ' + (syncing ? 'animate-spin' : '')} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCleanup}
              disabled={syncedOps.length === 0}
            >
              Clean Up Synced
            </Button>
          </div>
        </div>
      </Card>

      {/* Pending Operations */}
      {pendingOps.length > 0 && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Pending Operations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-12 py-8 text-left">Type</th>
                  <th className="px-12 py-8 text-left">Entity</th>
                  <th className="px-12 py-8 text-left">Entity ID</th>
                  <th className="px-12 py-8 text-left">Timestamp</th>
                  <th className="px-12 py-8 text-left">Attempts</th>
                  <th className="px-12 py-8 text-left">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingOps.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-12 py-12">
                      <span className={'px-8 py-4 rounded-full text-xs font-medium ' + (
                        op.type === 'CREATE' ? 'bg-green-100 text-green-800' :
                        op.type === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {op.type}
                      </span>
                    </td>
                    <td className="px-12 py-12">{op.entity}</td>
                    <td className="px-12 py-12 font-mono text-xs">{op.entityId.slice(0, 8)}...</td>
                    <td className="px-12 py-12 text-xs">
                      {new Date(op.timestamp).toLocaleString()}
                    </td>
                    <td className="px-12 py-12">{op.attempts}</td>
                    <td className="px-12 py-12 text-xs text-red-600">{op.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Synced Operations History */}
      {syncedOps.length > 0 && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Recently Synced Operations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-12 py-8 text-left">Type</th>
                  <th className="px-12 py-8 text-left">Entity</th>
                  <th className="px-12 py-8 text-left">Entity ID</th>
                  <th className="px-12 py-8 text-left">Synced At</th>
                  <th className="px-12 py-8 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {syncedOps.slice(0, 20).map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-12 py-12">
                      <span className={'px-8 py-4 rounded-full text-xs font-medium ' + (
                        op.type === 'CREATE' ? 'bg-green-100 text-green-800' :
                        op.type === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {op.type}
                      </span>
                    </td>
                    <td className="px-12 py-12">{op.entity}</td>
                    <td className="px-12 py-12 font-mono text-xs">{op.entityId.slice(0, 8)}...</td>
                    <td className="px-12 py-12 text-xs">
                      {op.lastAttempt ? new Date(op.lastAttempt).toLocaleString() : '-'}
                    </td>
                    <td className="px-12 py-12">
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {operations.length === 0 && (
        <Card className="p-32 text-center">
          <Cloud className="w-48 h-48 text-gray-400 mx-auto mb-16" />
          <p className="text-gray-600">No offline operations tracked</p>
        </Card>
      )}
    </div>
  );
}
export default OfflineSyncPage;
