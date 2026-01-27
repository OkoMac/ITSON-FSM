import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, Award, CheckCircle } from 'lucide-react';
import {
  createTrainingPathway,
  enrollInPathway,
  completeModule,
  getPathwayEnrollment,
  type TrainingPathway,
  type PathwayEnrollment,
} from '@/services/development/participantDevelopment';
import { db } from '@/utils/db';
import { useAuth } from '@/contexts/AuthContext';

export function TrainingPathwaysPage() {
  const { user } = useAuth();
  const [pathways, setPathways] = useState<TrainingPathway[]>([]);
  const [enrollments, setEnrollments] = useState<PathwayEnrollment[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    modules: [''],
    durationWeeks: 4,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const participantsData = await db.participants.toArray();
    setParticipants(participantsData);
    loadPathways();
    loadEnrollments();
  };

  const loadPathways = () => {
    const items: TrainingPathway[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('training_pathway_')) {
        items.push(JSON.parse(localStorage.getItem(key)!));
      }
    }
    setPathways(items);
  };

  const loadEnrollments = () => {
    const items: PathwayEnrollment[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pathway_enrollment_')) {
        items.push(JSON.parse(localStorage.getItem(key)!));
      }
    }
    setEnrollments(items);
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, ''],
    });
  };

  const handleModuleChange = (index: number, value: string) => {
    const newModules = [...formData.modules];
    newModules[index] = value;
    setFormData({ ...formData, modules: newModules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const modules = formData.modules.filter(m => m.trim());
    await createTrainingPathway({
      ...formData,
      modules,
      certification: true,
    });
    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      modules: [''],
      durationWeeks: 4,
    });
    loadPathways();
  };

  const handleEnroll = async (pathwayId: string, participantId: string) => {
    await enrollInPathway(participantId, pathwayId);
    loadEnrollments();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Training Pathways</h1>
          <p className="text-gray-600 mt-4">Manage training programs and participant enrollment</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-16 h-16 mr-8" />
          Create Pathway
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Create Training Pathway</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div>
              <label className="block text-sm font-medium mb-8">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Duration (Weeks)</label>
              <input
                type="number"
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                className="w-full px-12 py-8 border rounded-md"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Modules</label>
              <div className="space-y-8">
                {formData.modules.map((module, index) => (
                  <input
                    key={index}
                    type="text"
                    value={module}
                    onChange={(e) => handleModuleChange(index, e.target.value)}
                    className="w-full px-12 py-8 border rounded-md"
                    placeholder={'Module ' + (index + 1) + ' title'}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModule}
                className="mt-8"
              >
                Add Module
              </Button>
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Create Pathway</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        {pathways.map((pathway) => {
          const pathwayEnrollments = enrollments.filter(e => e.pathwayId === pathway.id);
          const activeEnrollments = pathwayEnrollments.filter(e => e.status === 'active').length;
          const completedEnrollments = pathwayEnrollments.filter(e => e.status === 'completed').length;

          return (
            <Card key={pathway.id} className="p-24">
              <div className="flex items-start justify-between mb-16">
                <div className="flex items-start space-x-12">
                  <div className="bg-blue-100 p-12 rounded-lg">
                    <BookOpen className="w-20 h-20 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{pathway.title}</h3>
                    <p className="text-sm text-gray-600 mt-4">{pathway.description}</p>
                  </div>
                </div>
                {pathway.certification && (
                  <Award className="w-20 h-20 text-yellow-600" />
                )}
              </div>

              <div className="space-y-12 mb-16">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{pathway.durationWeeks} weeks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Modules:</span>
                  <span className="font-medium">{pathway.modules.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Enrollments:</span>
                  <span className="font-medium">{activeEnrollments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">{completedEnrollments}</span>
                </div>
              </div>

              <div className="border-t pt-16">
                <p className="text-xs font-medium text-gray-600 mb-8">MODULES</p>
                <div className="space-y-4">
                  {pathway.modules.slice(0, 3).map((module, idx) => (
                    <div key={idx} className="flex items-center space-x-8 text-sm">
                      <CheckCircle className="w-12 h-12 text-gray-400" />
                      <span>{module}</span>
                    </div>
                  ))}
                  {pathway.modules.length > 3 && (
                    <p className="text-xs text-gray-500">+{pathway.modules.length - 3} more modules</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {pathways.length === 0 && (
        <Card className="p-32 text-center">
          <BookOpen className="w-48 h-48 text-gray-400 mx-auto mb-16" />
          <p className="text-gray-600">No training pathways created yet</p>
        </Card>
      )}
    </div>
  );
}
