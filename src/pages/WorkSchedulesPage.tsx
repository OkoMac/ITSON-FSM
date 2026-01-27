import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Clock } from 'lucide-react';
import { createWorkSchedule, getParticipantSchedules, type WorkSchedule } from '@/services/operations/workSchedules';
import { db } from '@/utils/db';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WorkSchedulesPage() {
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
    if (!selectedParticipant) return;

    await createWorkSchedule({
      participantId: selectedParticipant,
      siteId: formData.siteId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
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
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Work Schedules</h1>
          <p className="text-gray-600 mt-4">Manage participant work schedules</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-16 h-16 mr-8" />
          Add Schedule
        </Button>
      </div>

      {/* Participant Selection */}
      <Card className="p-20">
        <label className="block text-sm font-medium mb-8">Select Participant</label>
        <select
          value={selectedParticipant}
          onChange={(e) => {
            setSelectedParticipant(e.target.value);
            loadSchedules(e.target.value);
          }}
          className="w-full px-12 py-8 border rounded-md"
        >
          <option value="">Select a participant</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} - {p.idNumber}
            </option>
          ))}
        </select>
      </Card>

      {/* Add Schedule Form */}
      {showForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Create Work Schedule</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div>
              <label className="block text-sm font-medium mb-8">Site</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
                required
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Day of Week</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-12 py-8 border rounded-md"
                required
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="block text-sm font-medium mb-8">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-8">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Create Schedule</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Schedule Grid */}
      {selectedParticipantData && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">
            {selectedParticipantData.fullName}'s Weekly Schedule
          </h3>

          <div className="space-y-12">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySchedules = schedules.filter(s => s.dayOfWeek === dayIndex);

              return (
                <div key={dayIndex} className="border rounded-lg p-16">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-12">
                      <Calendar className="w-16 h-16 text-gray-500" />
                      <span className="font-medium">{day}</span>
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
