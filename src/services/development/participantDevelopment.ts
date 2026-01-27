/**
 * Participant Development: Journaling, Mentorship, Training Pathways
 */

import { db } from '@/utils/db';

export interface JournalEntry {
  id: string;
  participantId: string;
  date: string;
  title?: string;
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'difficult' | 'challenging';
  learnings?: string[];
  challenges?: string[];
  goals?: string[];
  private: boolean;
  createdAt: string;
}

export interface MentorshipRelationship {
  id: string;
  menteeId: string;
  mentorId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  focusAreas: string[];
  meetings: MentorshipMeeting[];
  goals: MentorshipGoal[];
  createdAt: string;
}

export interface MentorshipMeeting {
  id: string;
  date: string;
  duration: number; // minutes
  topics: string[];
  notes: string;
  actionItems: string[];
  nextMeetingDate?: string;
}

export interface MentorshipGoal {
  id: string;
  description: string;
  targetDate: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number; // 0-100
  completedAt?: string;
}

export interface TrainingPathway {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'soft-skills' | 'safety' | 'leadership' | 'other';
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: TrainingModule[];
  estimatedDuration: number; // hours
  prerequisites?: string[];
  certification: boolean;
  active: boolean;
  createdAt: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: number; // minutes
  resources: { title: string; url: string }[];
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
    passingScore: number;
  };
  order: number;
}

export interface TrainingEnrollment {
  id: string;
  participantId: string;
  pathwayId: string;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number; // 0-100
  completedModules: string[];
  currentModule?: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  certificateIssued?: boolean;
}

/**
 * Create journal entry
 */
export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const newEntry: JournalEntry = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`journal_${id}`, JSON.stringify(newEntry));

  return id;
}

/**
 * Create mentorship relationship
 */
export async function createMentorship(
  menteeId: string,
  mentorId: string,
  focusAreas: string[]
): Promise<string> {
  const id = crypto.randomUUID();
  const mentorship: MentorshipRelationship = {
    id,
    menteeId,
    mentorId,
    startDate: new Date().toISOString(),
    status: 'active',
    focusAreas,
    meetings: [],
    goals: [],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`mentorship_${id}`, JSON.stringify(mentorship));

  // Notify both parties
  const mentee = await db.participants.get(menteeId);
  const mentor = await db.users.get(mentorId);

  if (mentee) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: mentee.userId,
      type: 'general',
      title: 'Mentorship Assigned',
      message: `You have been paired with a mentor: ${mentor?.name || 'Mentor'}`,
      metadata: { mentorshipId: id },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return id;
}

/**
 * Add mentorship meeting
 */
export async function addMentorshipMeeting(
  mentorshipId: string,
  meeting: Omit<MentorshipMeeting, 'id'>
): Promise<void> {
  const mentorship = await getMentorship(mentorshipId);
  if (!mentorship) throw new Error('Mentorship not found');

  const meetingWithId: MentorshipMeeting = {
    ...meeting,
    id: crypto.randomUUID(),
  };

  mentorship.meetings.push(meetingWithId);

  localStorage.setItem(`mentorship_${mentorshipId}`, JSON.stringify(mentorship));
}

/**
 * Create training pathway
 */
export async function createTrainingPathway(
  pathway: Omit<TrainingPathway, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const newPathway: TrainingPathway = {
    ...pathway,
    id,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`pathway_${id}`, JSON.stringify(newPathway));

  return id;
}

/**
 * Enroll participant in training pathway
 */
export async function enrollInPathway(
  participantId: string,
  pathwayId: string
): Promise<string> {
  const id = crypto.randomUUID();
  const enrollment: TrainingEnrollment = {
    id,
    participantId,
    pathwayId,
    enrolledAt: new Date().toISOString(),
    progress: 0,
    completedModules: [],
    status: 'enrolled',
  };

  localStorage.setItem(`enrollment_${id}`, JSON.stringify(enrollment));

  // Notify participant
  const participant = await db.participants.get(participantId);
  const pathway = await getTrainingPathway(pathwayId);

  if (participant && pathway) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: participant.userId,
      type: 'general',
      title: 'Enrolled in Training',
      message: `You've been enrolled in: ${pathway.title}`,
      metadata: { enrollmentId: id, pathwayId },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return id;
}

/**
 * Complete training module
 */
export async function completeModule(
  enrollmentId: string,
  moduleId: string,
  score?: number
): Promise<void> {
  const enrollment = await getEnrollment(enrollmentId);
  if (!enrollment) throw new Error('Enrollment not found');

  const pathway = await getTrainingPathway(enrollment.pathwayId);
  if (!pathway) throw new Error('Pathway not found');

  // Add to completed modules
  if (!enrollment.completedModules.includes(moduleId)) {
    enrollment.completedModules.push(moduleId);
  }

  // Update progress
  enrollment.progress = (enrollment.completedModules.length / pathway.modules.length) * 100;

  // Check if all modules completed
  if (enrollment.completedModules.length === pathway.modules.length) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date().toISOString();

    if (pathway.certification) {
      enrollment.certificateIssued = true;

      // Notify about certificate
      const participant = await db.participants.get(enrollment.participantId);
      if (participant) {
        await db.notifications.add({
          id: crypto.randomUUID(),
          userId: participant.userId,
          type: 'general',
          title: 'Training Completed - Certificate Issued',
          message: `Congratulations! You've completed ${pathway.title}`,
          metadata: { enrollmentId, pathwayId: pathway.id },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } else {
    enrollment.status = 'in-progress';
    if (!enrollment.startedAt) {
      enrollment.startedAt = new Date().toISOString();
    }
  }

  localStorage.setItem(`enrollment_${enrollmentId}`, JSON.stringify(enrollment));
}

/**
 * Get participant's journal entries
 */
export async function getJournalEntries(participantId: string): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('journal_')) {
      const data = localStorage.getItem(key);
      if (data) {
        const entry = JSON.parse(data);
        if (entry.participantId === participantId) {
          entries.push(entry);
        }
      }
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

// Helper functions

async function getMentorship(id: string): Promise<MentorshipRelationship | null> {
  const data = localStorage.getItem(`mentorship_${id}`);
  return data ? JSON.parse(data) : null;
}

async function getTrainingPathway(id: string): Promise<TrainingPathway | null> {
  const data = localStorage.getItem(`pathway_${id}`);
  return data ? JSON.parse(data) : null;
}

async function getEnrollment(id: string): Promise<TrainingEnrollment | null> {
  const data = localStorage.getItem(`enrollment_${id}`);
  return data ? JSON.parse(data) : null;
}
