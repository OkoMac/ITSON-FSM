/**
 * Team Management Tab
 */
import { useState } from 'react';
import { GlassCard, Button, Input } from '@/components/ui';

interface Team {
  id: string;
  name: string;
  members: string[];
  supervisor: string;
}

export function TeamManagementTab() {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Site Team A', members: ['worker1@itsonfsm.com', 'worker2@itsonfsm.com'], supervisor: 'supervisor@itsonfsm.com' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', supervisor: '', members: '' });

  const handleAddTeam = () => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name: formData.name,
      supervisor: formData.supervisor,
      members: formData.members.split(',').map(m => m.trim()).filter(m => m),
    };
    setTeams([...teams, newTeam]);
    setShowModal(false);
    setFormData({ name: '', supervisor: '', members: '' });
    alert('Team created successfully!');
  };

  return (
    <div className="space-y-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Team Management</h2>
        <Button onClick={() => setShowModal(true)} variant="primary">
          ➕ Create Team
        </Button>
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        {teams.map((team) => (
          <GlassCard key={team.id}>
            <div className="space-y-12">
              <h3 className="text-lg font-semibold text-text-primary">{team.name}</h3>
              <div className="text-sm text-text-secondary">
                <div className="mb-8">👤 Supervisor: {team.supervisor}</div>
                <div>👥 Members: {team.members.length}</div>
                <div className="mt-8 space-y-4">
                  {team.members.map((member, i) => (
                    <div key={i} className="text-xs text-text-tertiary">• {member}</div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-lg w-full">
            <div className="space-y-24">
              <h2 className="text-2xl font-bold text-text-primary">Create New Team</h2>
              <Input label="Team Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Site Team A" />
              <Input label="Supervisor Email" value={formData.supervisor} onChange={(e) => setFormData({...formData, supervisor: e.target.value})} placeholder="supervisor@itsonfsm.com" />
              <div className="form-group">
                <label className="form-label">Team Members (comma-separated emails)</label>
                <textarea value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})} className="input-field" rows={4} placeholder="worker1@itsonfsm.com, worker2@itsonfsm.com" />
              </div>
              <div className="flex gap-12">
                <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleAddTeam} variant="primary" className="flex-1" disabled={!formData.name || !formData.supervisor}>Create Team</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
