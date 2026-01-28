import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { UserCheck, UserX, UserMinus, Award } from 'lucide-react';
import { transitionLifecycleStatus, getLifecycleHistory, type LifecycleTransition } from '@/services/lifecycle/participantLifecycle';
import { db } from '@/utils/db';
import { useAuthStore } from '@/store/useAuthStore';

export function LifecycleManagementPage() {
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [history, setHistory] = useState<LifecycleTransition[]>([]);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [formData, setFormData] = useState({
    newStatus: 'active' as 'active' | 'inactive' | 'suspended' | 'exited' | 'graduated',
    reason: '',
    exitReason: undefined as 'personal' | 'performance' | 'health' | 'completed' | 'other' | undefined,
    notes: '',
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    if (selectedParticipant) {
      loadHistory();
    }
  }, [selectedParticipant]);

  const loadParticipants = async () => {
    const data = await db.participants.toArray();
    setParticipants(data);
  };

  const loadHistory = async () => {
    const transitions = await getLifecycleHistory(selectedParticipant);
    setHistory(transitions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await transitionLifecycleStatus(
      selectedParticipant,
      formData.newStatus,
      formData.reason,
      user.id,
      {
        exitReason: formData.exitReason,
        notes: formData.notes,
      }
    );

    setShowTransitionForm(false);
    setFormData({
      newStatus: 'active',
      reason: '',
      exitReason: undefined,
      notes: '',
    });
    loadParticipants();
    loadHistory();
  };

  const selectedParticipantData = participants.find(p => p.id === selectedParticipant);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="w-16 h-16 text-green-600" />;
      case 'exited': return <UserX className="w-16 h-16 text-red-600" />;
      case 'suspended': return <UserMinus className="w-16 h-16 text-orange-600" />;
      case 'graduated': return <Award className="w-16 h-16 text-purple-600" />;
      default: return <UserCheck className="w-16 h-16 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'exited': return 'bg-red-100 text-red-800';
      case 'graduated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusCounts = {
    active: participants.filter(p => p.status === 'active').length,
    inactive: participants.filter(p => p.status === 'inactive').length,
    suspended: participants.filter(p => p.status === 'suspended').length,
    exited: participants.filter(p => p.status === 'exited').length,
    graduated: participants.filter(p => p.graduationDate).length,
  };

  return (
    <div className="content-wrapper">
      <div>
        <h1 className="heading-1">Participant Lifecycle Management</h1>
        <p className="text-gray-600 mt-4">Track and manage participant status transitions</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-5 gap-16">
        <Card className="p-16 bg-green-50 border-green-200">
          <div className="text-center">
            <UserCheck className="w-24 h-24 text-green-600 mx-auto mb-8" />
            <p className="text-sm text-green-600 mb-4">Active</p>
            <p className="text-24 font-bold text-green-900">{statusCounts.active}</p>
          </div>
        </Card>

        <Card className="card-content">
          <div className="text-center">
            <UserCheck className="w-24 h-24 text-gray-600 mx-auto mb-8" />
            <p className="text-sm text-gray-600 mb-4">Inactive</p>
            <p className="heading-1">{statusCounts.inactive}</p>
          </div>
        </Card>

        <Card className="p-16 bg-orange-50 border-orange-200">
          <div className="text-center">
            <UserMinus className="w-24 h-24 text-orange-600 mx-auto mb-8" />
            <p className="text-sm text-orange-600 mb-4">Suspended</p>
            <p className="text-24 font-bold text-orange-900">{statusCounts.suspended}</p>
          </div>
        </Card>

        <Card className="p-16 bg-red-50 border-red-200">
          <div className="text-center">
            <UserX className="w-24 h-24 text-red-600 mx-auto mb-8" />
            <p className="text-sm text-red-600 mb-4">Exited</p>
            <p className="text-24 font-bold text-red-900">{statusCounts.exited}</p>
          </div>
        </Card>

        <Card className="p-16 bg-purple-50 border-purple-200">
          <div className="text-center">
            <Award className="w-24 h-24 text-purple-600 mx-auto mb-8" />
            <p className="text-sm text-purple-600 mb-4">Graduated</p>
            <p className="text-24 font-bold text-purple-900">{statusCounts.graduated}</p>
          </div>
        </Card>
      </div>

      {/* Participant Selection */}
      <Card className="card-content">
        <label className="form-label">Select Participant</label>
        <select
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
          className="input-field"
        >
          <option value="">Select a participant</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} - {p.status.toUpperCase()}
            </option>
          ))}
        </select>
      </Card>

      {selectedParticipantData && (
        <>
          {/* Current Status */}
          <Card className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-16">
                {getStatusIcon(selectedParticipantData.status)}
                <div>
                  <h3 className="font-medium text-lg">{selectedParticipantData.fullName}</h3>
                  <div className="flex items-center space-x-8 mt-4">
                    <span className={'px-12 py-6 rounded-full text-xs font-medium ' + getStatusColor(selectedParticipantData.status)}>
                      {selectedParticipantData.status.toUpperCase()}
                    </span>
                    {selectedParticipantData.statusChangedAt && (
                      <span className="text-xs text-gray-500">
                        Since {new Date(selectedParticipantData.statusChangedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowTransitionForm(!showTransitionForm)}>
                Change Status
              </Button>
            </div>
          </Card>

          {/* Transition Form */}
          {showTransitionForm && (
            <Card className="card-content">
              <h3 className="card-title">Change Participant Status</h3>
              <form onSubmit={handleSubmit} className="space-y-16">
                <div>
                  <label className="form-label">New Status</label>
                  <select
                    value={formData.newStatus}
                    onChange={(e) => setFormData({ ...formData, newStatus: e.target.value as any })}
                    className="input-field"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="exited">Exited</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Reason</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                {formData.newStatus === 'exited' && (
                  <div>
                    <label className="form-label">Exit Reason</label>
                    <select
                      value={formData.exitReason}
                      onChange={(e) => setFormData({ ...formData, exitReason: e.target.value as any })}
                      className="input-field"
                      required
                    >
                      <option value="">Select exit reason</option>
                      <option value="personal">Personal Reasons</option>
                      <option value="performance">Performance Issues</option>
                      <option value="health">Health Reasons</option>
                      <option value="completed">Program Completed</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-12">
                  <Button type="submit" className="flex-1">Save Status Change</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowTransitionForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Lifecycle History */}
          <Card className="card-content">
            <h3 className="card-title">Lifecycle History</h3>
            <div className="space-y-12">
              {history.map((transition) => (
                <div key={transition.id} className="flex items-start space-x-12 pb-12 border-b last:border-0">
                  <div className="mt-4">{getStatusIcon(transition.toStatus || transition.newStatus)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-8">
                      <span className={'px-8 py-4 rounded-full text-xs font-medium ' + getStatusColor(transition.fromStatus || transition.previousStatus)}>
                        {transition.fromStatus || transition.previousStatus}
                      </span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className={'px-8 py-4 rounded-full text-xs font-medium ' + getStatusColor(transition.toStatus || transition.newStatus)}>
                        {transition.toStatus || transition.newStatus}
                      </span>
                    </div>
                    <p className="text-sm mt-8">{transition.reason}</p>
                    {transition.notes && (
                      <p className="text-xs text-gray-600 mt-4">{transition.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-8">
                      {new Date(transition.transitionedAt || transition.changedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-center text-gray-500 py-16">No lifecycle transitions recorded</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
export default LifecycleManagementPage;
