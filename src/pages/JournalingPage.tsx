import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen } from 'lucide-react';
import { createJournalEntry, getParticipantJournalEntries, type JournalEntry } from '@/services/development/participantDevelopment';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/utils/db';

export function JournalingPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    mood: 'neutral' as 'great' | 'good' | 'neutral' | 'challenging' | 'difficult',
    category: 'reflection' as 'reflection' | 'achievement' | 'challenge' | 'learning' | 'goal',
  });

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    const participant = await db.participants.where('userId').equals(user.id).first();
    if (participant) {
      const participantEntries = await getParticipantJournalEntries(participant.id);
      setEntries(participantEntries);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const participant = await db.participants.where('userId').equals(user.id).first();
    if (!participant) return;

    await createJournalEntry({
      participantId: participant.id,
      date: new Date().toISOString(),
      content: formData.content,
      mood: formData.mood,
      category: formData.category,
      private: true,
    });

    setShowForm(false);
    setFormData({
      content: '',
      mood: 'neutral',
      category: 'reflection',
    });
    loadEntries();
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'great': return 'text-status-success';
      case 'good': return 'text-accent-blue';
      case 'neutral': return 'text-text-secondary';
      case 'challenging': return 'text-status-info';
      case 'difficult': return 'text-status-error';
      default: return 'text-text-secondary';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'achievement': return 'bg-status-success/20 text-status-success border-status-success/30';
      case 'challenge': return 'bg-accent-blue/20 text-accent-blue border-accent-blue/30';
      case 'learning': return 'bg-status-info/20 text-status-info border-status-info/30';
      case 'goal': return 'bg-accent-purple/20 text-accent-purple border-accent-purple/30';
      default: return 'bg-white/10 text-text-secondary border-white/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">My Journal</h1>
          <p className="text-gray-600 mt-4">Reflect on your experiences and track your growth</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-16 h-16 mr-8" />
          New Entry
        </Button>
      </div>

      {showForm && (
        <Card className="card-content">
          <h3 className="card-title">Create Journal Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div className="grid-2">
              <div>
                <label className="form-label">Mood</label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value as any })}
                  className="input-field"
                >
                  <option value="great">Great</option>
                  <option value="good">Good</option>
                  <option value="neutral">Neutral</option>
                  <option value="challenging">Challenging</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="input-field"
                >
                  <option value="reflection">Reflection</option>
                  <option value="achievement">Achievement</option>
                  <option value="challenge">Challenge</option>
                  <option value="learning">Learning</option>
                  <option value="goal">Goal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Your Thoughts</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input-field"
                rows={6}
                placeholder="Write about your day, achievements, challenges, or goals..."
                required
              />
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Save Entry</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-16">
        {entries.map((entry) => (
          <Card key={entry.id} className="card-content">
            <div className="flex items-start justify-between mb-12">
              <div className="flex items-center space-x-12">
                <div>
                  <div className="flex items-center space-x-8">
                    <span className={'px-8 py-4 rounded-full text-xs font-medium border ' + getMoodColor(entry.mood) + ' bg-white/5'}>
                      {entry.mood}
                    </span>
                    <span className={'px-8 py-4 rounded-full text-xs font-medium border ' + getCategoryColor(entry.category)}>
                      {entry.category}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary mt-4 block">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <Card className="p-32 text-center">
          <BookOpen className="w-48 h-48 text-gray-400 mx-auto mb-16" />
          <p className="text-gray-600">No journal entries yet. Start writing to track your journey!</p>
        </Card>
      )}
    </div>
  );
}
export default JournalingPage;
