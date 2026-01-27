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

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'great': return '😄';
      case 'good': return '🙂';
      case 'neutral': return '😐';
      case 'challenging': return '😕';
      case 'difficult': return '😞';
      default: return '😐';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'achievement': return 'bg-green-100 text-green-800';
      case 'challenge': return 'bg-orange-100 text-orange-800';
      case 'learning': return 'bg-blue-100 text-blue-800';
      case 'goal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">My Journal</h1>
          <p className="text-gray-600 mt-4">Reflect on your experiences and track your growth</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-16 h-16 mr-8" />
          New Entry
        </Button>
      </div>

      {showForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Create Journal Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="block text-sm font-medium mb-8">Mood</label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value as any })}
                  className="w-full px-12 py-8 border rounded-md"
                >
                  <option value="great">😄 Great</option>
                  <option value="good">🙂 Good</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="challenging">😕 Challenging</option>
                  <option value="difficult">😞 Difficult</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-12 py-8 border rounded-md"
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
              <label className="block text-sm font-medium mb-8">Your Thoughts</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
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
          <Card key={entry.id} className="p-24">
            <div className="flex items-start justify-between mb-12">
              <div className="flex items-center space-x-12">
                <span className="text-24">{getMoodIcon(entry.mood)}</span>
                <div>
                  <div className="flex items-center space-x-8">
                    <span className={'px-8 py-4 rounded-full text-xs font-medium ' + getCategoryColor(entry.category)}>
                      {entry.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-4">
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
