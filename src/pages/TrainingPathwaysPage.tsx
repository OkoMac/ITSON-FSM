import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, Award, CheckCircle } from 'lucide-react';
import {
  createTrainingPathway,
  type TrainingPathway,
} from '@/services/development/participantDevelopment';
import heroBuilding from '@/assets/images/hero-building.svg';

interface PathwayEnrollment {
  id: string;
  pathwayId: string;
  participantId: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  completedModules: string[];
  certificateIssued: boolean;
  startedAt: string;
  completedAt?: string;
}

export function TrainingPathwaysPage() {
  const [pathways, setPathways] = useState<TrainingPathway[]>([]);
  const [enrollments, setEnrollments] = useState<PathwayEnrollment[]>([]);
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
    const modulesList = formData.modules.filter(m => m.trim()).map((title, index) => ({
      id: crypto.randomUUID(),
      title,
      description: "",
      content: "",
      duration: 60,
      resources: [],
      order: index,
    }));
    await createTrainingPathway({
      title: formData.title,
      description: formData.description,
      category: "other",
      level: "beginner",
      modules: modulesList,
      durationWeeks: formData.durationWeeks,
      estimatedDuration: modulesList.length * 60,
      certification: true,
      active: true,
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

  return (
    <div className="content-wrapper">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl mb-32"
        style={{
          backgroundImage: `url(${heroBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/70" />
        <div className="relative z-10 p-32 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-8">Training Pathways</h1>
            <p className="text-lg text-white/80">Manage training programs and participant enrollment</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="secondary">
            <Plus className="w-16 h-16 mr-8" />
            Create Pathway
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="card-content">
          <h3 className="card-title">Create Training Pathway</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div>
              <label className="form-label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="form-label">Duration (Weeks)</label>
              <input
                type="number"
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                required
              />
            </div>

            <div>
              <label className="form-label">Modules</label>
              <div className="space-y-8">
                {formData.modules.map((module, index) => (
                  <input
                    key={index}
                    type="text"
                    value={module}
                    onChange={(e) => handleModuleChange(index, e.target.value)}
                    className="input-field"
                    placeholder={'Module ' + (index + 1) + ' title'}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddModule}
                className="mt-8"
              >
                Add Module
              </Button>
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Create Pathway</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
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
            <Card key={pathway.id} className="card-content">
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
                      <span>{module.title}</span>
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
export default TrainingPathwaysPage;
