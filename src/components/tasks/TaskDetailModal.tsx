import React, { useState } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { DocumentUpload } from '@/components/onboarding/DocumentUpload';
import type { Task, UserRole } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, photos: File[], note: string) => void;
  userRole: UserRole;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
  userRole,
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!task) return null;

  const handleAddPhoto = (file: File) => {
    setPhotos([...photos, file]);
    setCurrentPhotoIndex(photos.length);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2));
    }
  };

  const handleSubmit = () => {
    if (task.requiresPhotoEvidence && photos.length === 0) {
      alert('Please add at least one photo');
      return;
    }
    onComplete(task.id, photos, note);
    setPhotos([]);
    setNote('');
    onClose();
  };

  const priorityColors = {
    low: 'info' as const,
    medium: 'warning' as const,
    high: 'error' as const,
    urgent: 'error' as const,
  };

  const statusColors = {
    pending: 'default' as const,
    'in-progress': 'info' as const,
    completed: 'success' as const,
    approved: 'success' as const,
    rejected: 'error' as const,
    'requires-changes': 'warning' as const,
  };

  const canComplete = userRole === 'worker' && task.status === 'pending';
  const isCompleted = ['completed', 'approved'].includes(task.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      size="lg"
    >
      <div className="space-y-24">
        {/* Task Info */}
        <div className="flex flex-wrap gap-8">
          <Badge variant={priorityColors[task.priority]}>
            {task.priority} priority
          </Badge>
          <Badge variant={statusColors[task.status]}>
            {task.status.replace('-', ' ')}
          </Badge>
          {task.requiresPhotoEvidence && (
            <Badge variant="info">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Photo required
            </Badge>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-text-tertiary mb-8">Description</h3>
          <p className="text-base text-text-primary whitespace-pre-wrap">
            {task.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-16 p-16 glass-card bg-white/5">
          <div>
            <p className="text-xs text-text-tertiary mb-4">Due Date</p>
            <p className="text-sm text-text-primary">
              {new Date(task.dueDate).toLocaleDateString('en-ZA', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {task.estimatedDuration && (
            <div>
              <p className="text-xs text-text-tertiary mb-4">Estimated Time</p>
              <p className="text-sm text-text-primary">
                {Math.floor(task.estimatedDuration / 60)}h {task.estimatedDuration % 60}m
              </p>
            </div>
          )}
          {task.locationDescription && (
            <div className="col-span-2">
              <p className="text-xs text-text-tertiary mb-4">Location</p>
              <p className="text-sm text-text-primary">{task.locationDescription}</p>
            </div>
          )}
        </div>

        {/* Completion Section (for workers) */}
        {canComplete && (
          <div className="space-y-16 pt-16 border-t border-white/10">
            <h3 className="text-base font-semibold text-text-primary">
              Complete Task
            </h3>

            {/* Photo Evidence */}
            {task.requiresPhotoEvidence && (
              <div className="space-y-12">
                <p className="text-sm text-text-secondary">
                  Upload photos as proof of work
                </p>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-12">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-24 object-cover rounded-glass"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-4 right-4 p-4 bg-status-error rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 5 && (
                  <DocumentUpload
                    label={photos.length === 0 ? 'Add Photo Evidence' : 'Add Another Photo'}
                    accept="image/*"
                    onUpload={handleAddPhoto}
                    value={null}
                    maxSize={10}
                  />
                )}
              </div>
            )}

            {/* Completion Note */}
            <div className="space-y-8">
              <label className="text-sm font-medium text-text-primary">
                Completion Note {!task.requiresPhotoEvidence && '(Optional)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Add any notes about completing this task..."
                className="input-field resize-none"
              />
            </div>

            <Button onClick={handleSubmit} fullWidth>
              Submit for Review
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Completed Task Info */}
        {isCompleted && (
          <div className="space-y-16 pt-16 border-t border-white/10">
            <div className="p-16 glass-card bg-status-success/10 border border-status-success/30">
              <div className="flex items-center gap-12 mb-12">
                <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-status-success">
                  Task Completed
                </p>
              </div>
              {task.completedAt && (
                <p className="text-xs text-text-secondary">
                  Completed on {new Date(task.completedAt).toLocaleString('en-ZA')}
                </p>
              )}
            </div>

            {task.completionNote && (
              <div>
                <h4 className="text-sm font-medium text-text-tertiary mb-8">
                  Completion Note
                </h4>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {task.completionNote}
                </p>
              </div>
            )}

            {task.proofPhotos && task.proofPhotos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text-tertiary mb-8">
                  Photo Evidence ({task.proofPhotos.length})
                </h4>
                <div className="grid grid-cols-3 gap-12">
                  {task.proofPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-24 object-cover rounded-glass cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {task.supervisorFeedback && (
              <div className="p-16 glass-card bg-accent-blue/10 border border-accent-blue/30">
                <h4 className="text-sm font-medium text-text-tertiary mb-8">
                  Supervisor Feedback
                </h4>
                <p className="text-sm text-text-primary mb-12">
                  {task.supervisorFeedback}
                </p>
                {task.qualityRating && (
                  <div className="flex items-center gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= task.qualityRating!
                            ? 'text-status-warning fill-current'
                            : 'text-text-tertiary'
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        {!canComplete && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
