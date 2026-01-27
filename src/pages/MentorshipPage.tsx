import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Target, Calendar } from 'lucide-react';
import {
  createMentorship,
  addMentorshipGoal,
  logMentorshipMeeting,
  getMentorship,
  type Mentorship,
  type MentorshipGoal,
  type MentorshipMeeting,
} from '@/services/development/participantDevelopment';
import { db } from '@/utils/db';

export function MentorshipPage() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    menteeId: '',
    mentorId: '',
    focusAreas: [''],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const participantsData = await db.participants.toArray();
    setParticipants(participantsData);
    loadMentorships();
  };

  const loadMentorships = () => {
    const items: Mentorship[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mentorship_')) {
        items.push(JSON.parse(localStorage.getItem(key)!));
      }
    }
    setMentorships(items);
  };

  const handleAddFocusArea = () => {
    setFormData({
      ...formData,
      focusAreas: [...formData.focusAreas, ''],
    });
  };

  const handleFocusAreaChange = (index: number, value: string) => {
    const newFocusAreas = [...formData.focusAreas];
    newFocusAreas[index] = value;
    setFormData({ ...formData, focusAreas: newFocusAreas });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const focusAreas = formData.focusAreas.filter(f => f.trim());
    await createMentorship(formData.menteeId, formData.mentorId, focusAreas);
    setShowCreateForm(false);
    setFormData({
      menteeId: '',
      mentorId: '',
      focusAreas: [''],
    });
    loadMentorships();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Mentorship Program</h1>
          <p className="text-gray-600 mt-4">Manage mentorship relationships and track progress</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-16 h-16 mr-8" />
          Create Mentorship
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Create Mentorship Relationship</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="block text-sm font-medium mb-8">Mentee</label>
                <select
                  value={formData.menteeId}
                  onChange={(e) => setFormData({ ...formData, menteeId: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                >
                  <option value="">Select mentee</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Mentor</label>
                <select
                  value={formData.mentorId}
                  onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                >
                  <option value="">Select mentor</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Focus Areas</label>
              <div className="space-y-8">
                {formData.focusAreas.map((area, index) => (
                  <input
                    key={index}
                    type="text"
                    value={area}
                    onChange={(e) => handleFocusAreaChange(index, e.target.value)}
                    className="w-full px-12 py-8 border rounded-md"
                    placeholder={'Focus area ' + (index + 1)}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFocusArea}
                className="mt-8"
              >
                Add Focus Area
              </Button>
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Create Mentorship</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-24">
        {mentorships.map((mentorship) => {
          const mentee = participants.find(p => p.id === mentorship.menteeId);
          const mentor = participants.find(p => p.id === mentorship.mentorId);

          return (
            <Card key={mentorship.id} className="p-24">
              <div className="flex items-start justify-between mb-20">
                <div className="flex items-start space-x-16">
                  <div className="bg-purple-100 p-12 rounded-lg">
                    <Users className="w-24 h-24 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{mentee?.fullName || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600 mt-4">
                      Mentored by {mentor?.fullName || 'Unknown'}
                    </p>
                    <div className="flex items-center space-x-12 mt-8">
                      <span className={'px-8 py-4 rounded-full text-xs font-medium ' + (
                        mentorship.status === 'active' ? 'bg-green-100 text-green-800' :
                        mentorship.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {mentorship.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Started {new Date(mentorship.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-16 mb-20">
                <div className="bg-gray-50 rounded-lg p-16">
                  <div className="flex items-center space-x-8 mb-8">
                    <Target className="w-16 h-16 text-gray-600" />
                    <p className="text-sm font-medium">Goals</p>
                  </div>
                  <p className="text-24 font-bold">{mentorship.goals.length}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-16">
                  <div className="flex items-center space-x-8 mb-8">
                    <Calendar className="w-16 h-16 text-gray-600" />
                    <p className="text-sm font-medium">Meetings</p>
                  </div>
                  <p className="text-24 font-bold">{mentorship.meetings.length}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-8">Focus Areas</p>
                <div className="flex flex-wrap gap-8">
                  {mentorship.focusAreas.map((area, idx) => (
                    <span key={idx} className="px-12 py-6 bg-purple-50 text-purple-800 rounded-full text-xs">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {mentorship.goals.length > 0 && (
                <div className="mt-20 pt-20 border-t">
                  <p className="text-sm font-medium mb-12">Recent Goals</p>
                  <div className="space-y-8">
                    {mentorship.goals.slice(0, 3).map((goal, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{goal.title}</span>
                        <span className={'px-8 py-4 rounded-full text-xs font-medium ' + (
                          goal.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        )}>
                          {goal.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {mentorships.length === 0 && (
        <Card className="p-32 text-center">
          <Users className="w-48 h-48 text-gray-400 mx-auto mb-16" />
          <p className="text-gray-600">No mentorship relationships created yet</p>
        </Card>
      )}
    </div>
  );
}
export default MentorshipPage;
