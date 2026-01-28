import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Clock } from 'lucide-react';
import { createWorkSchedule, getParticipantSchedules, type WorkSchedule } from '@/services/operations/workSchedules';
import { db } from '@/utils/db';
import { useAuthStore } from '@/store/useAuthStore';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WorkSchedulesPage() {
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [formData, setFormData] = useState({
    siteId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '17:00',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [participantsData, sitesData] = await Promise.all([
      db.participants.toArray(),
      db.sites.toArray(),
    ]);
    setParticipants(participantsData);
    setSites(sitesData);

    if (participantsData.length > 0) {
      const firstParticipant = participantsData[0].id;
      setSelectedParticipant(firstParticipant);
      loadSchedules(firstParticipant);
    }
  };

  const loadSchedules = async (participantId: string) => {
    const participantSchedules = await getParticipantSchedules(participantId);
    setSchedules(participantSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !user) return;

    await createWorkSchedule({
      participantId: selectedParticipant,
      siteId: formData.siteId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDuration: 60, // 1 hour lunch break
      active: true,
      effectiveFrom: new Date().toISOString(),
      createdBy: user.id,
    });

    setShowForm(false);
    setFormData({
      siteId: '',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '17:00',
    });
    loadSchedules(selectedParticipant);
  };

  const selectedParticipantData = participants.find(p => p.id === selectedParticipant);

  return (
    <div className="content-wrapper">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-16 mb-32">
        <div>
          <h1 className="heading-1">Work Schedules</h1>
          <p className="body-text mt-8">Manage participant work schedules and shifts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="touch-target">
          <Plus className="w-20 h-20 mr-10" />
          Add Schedule
        </Button>
      </div>

      {/* Participant Selection */}
      <Card className="card-content">
        <div className="form-group">
          <label className="form-label">Select Participant</label>
          <select
            value={selectedParticipant}
            onChange={(e) => {
              setSelectedParticipant(e.target.value);
              loadSchedules(e.target.value);
            }}
            className="input-field"
          >
            <option value="">Select a participant</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} - {p.idNumber}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Add Schedule Form */}
      {showForm && (
        <Card className="card-content">
          <div className="card-header">
            <h3 className="card-title">Create Work Schedule</h3>
            <p className="card-description">Set up a regular work schedule for the selected participant</p>
          </div>

          <form onSubmit={handleSubmit} className="section-spacing">
            <div className="form-group">
              <label className="form-label">Site</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <p className="form-helper">Choose the work site for this schedule</p>
            </div>

            <div className="form-group">
              <label className="form-label">Day of Week</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-12 pt-20">
              <Button type="submit" className="flex-1 touch-target">Create Schedule</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1 touch-target">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Schedule Grid */}
      {selectedParticipantData && (
        <Card className="card-content">
          <div className="card-header">
            <h3 className="card-title">{selectedParticipantData.fullName}'s Weekly Schedule</h3>
            <p className="card-description">View and manage weekly work schedule</p>
          </div>

          <div className="space-y-20">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySchedules = schedules.filter(s => s.dayOfWeek === dayIndex);

              return (
                <div key={dayIndex} className="bg-white/5 border border-white/10 rounded-xl p-20 hover:bg-white/8 transition-colors">
                  <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center space-x-12">
                      <Calendar className="w-20 h-20 text-blue-400" />
                      <span className="heading-3 mb-0">{day}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {daySchedules.length} schedule(s)
                    </span>
                  </div>

                  {daySchedules.length > 0 ? (
                    <div className="space-y-8">
                      {daySchedules.map((schedule) => {
                        const site = sites.find(s => s.id === schedule.siteId);
                        return (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between bg-gray-50 rounded-md p-12"
                          >
                            <div>
                              <p className="text-sm font-medium">{site?.name || 'Unknown Site'}</p>
                              <div className="flex items-center space-x-8 mt-4">
                                <Clock className="w-12 h-12 text-gray-500" />
                                <span className="text-xs text-gray-600">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No schedules for this day</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
export default WorkSchedulesPage;
