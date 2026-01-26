/**
 * AI Assistant Service
 *
 * Provides intelligent assistance and responses to user queries
 */

import type { User } from '@/types';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface AIContext {
  user: User;
  currentPage?: string;
  recentActions?: string[];
}

/**
 * Generate AI response based on user query and context
 */
export async function generateAIResponse(
  query: string,
  context: AIContext
): Promise<AIMessage> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const lowerQuery = query.toLowerCase();
  let content = '';
  let suggestions: string[] = [];

  // Role-based responses
  const isWorker = context.user.role === 'worker';
  const isAdmin = ['property-point', 'project-manager'].includes(context.user.role);

  // Check-in/Attendance queries
  if (lowerQuery.includes('check in') || lowerQuery.includes('attendance')) {
    if (isWorker) {
      content = "To check in, go to the Check In/Out page and use the biometric verification (face or fingerprint). Make sure you're at your assigned site. Your attendance will be automatically synced to Kwantu.";
      suggestions = ['How do I check out?', 'View my attendance history', 'What if check-in fails?'];
    } else {
      content = "You can view all participant attendance in the Admin Dashboard. The system tracks check-in/out times, location, and biometric verification. Reports can be exported in Excel, PDF, or CSV format.";
      suggestions = ['View attendance analytics', 'Export attendance report', 'Check sync status'];
    }
  }
  // Task queries
  else if (lowerQuery.includes('task') || lowerQuery.includes('assignment')) {
    if (isWorker) {
      content = "Your assigned tasks are visible on the Tasks page. You can view task details, mark them as in-progress or completed, and add notes. Supervisors will be notified of task updates.";
      suggestions = ['View my tasks', 'How to complete a task?', 'Task priority levels'];
    } else {
      content = "You can assign tasks to participants from the Admin page. Tasks can be prioritized, have due dates, and include detailed descriptions. Track completion rates in the Analytics dashboard.";
      suggestions = ['Create new task', 'View task analytics', 'Assign bulk tasks'];
    }
  }
  // Onboarding queries
  else if (lowerQuery.includes('onboard') || lowerQuery.includes('document')) {
    if (isWorker) {
      content = "Complete your onboarding by uploading required documents (ID, proof of residence, etc.), completing biometric enrollment, and signing POPIA consent. Your profile will be verified by an admin.";
      suggestions = ['Continue onboarding', 'Upload documents', 'What documents do I need?'];
    } else {
      content = "You can review pending onboarding applications in the Admin Dashboard. Verify documents, approve/reject applications, and track onboarding progress. The system extracts data from documents automatically.";
      suggestions = ['View pending applications', 'Document verification guide', 'Onboarding workflow'];
    }
  }
  // Stories queries
  else if (lowerQuery.includes('story') || lowerQuery.includes('impact')) {
    if (isWorker) {
      content = "Share your success story to inspire others! Go to the Stories page and click 'Share Your Story'. Include your journey, skills gained, and achievements. Stories are reviewed before publishing.";
      suggestions = ['Share my story', 'View published stories', 'Story guidelines'];
    } else {
      content = "Review submitted impact stories in the Stories page under 'Pending Review'. You can approve, request changes, or publish stories. Published stories showcase the programme's impact.";
      suggestions = ['Review pending stories', 'View published stories', 'Story metrics'];
    }
  }
  // Analytics queries
  else if (lowerQuery.includes('analytic') || lowerQuery.includes('report') || lowerQuery.includes('metric')) {
    if (isAdmin) {
      content = "Access comprehensive analytics in the Analytics page. View attendance trends, task completion rates, site performance, and participant growth. Export custom reports from the Reports page.";
      suggestions = ['View analytics dashboard', 'Export reports', 'Site performance comparison'];
    } else {
      content = "View your personal statistics in the Dashboard. Track your attendance, completed tasks, and performance metrics. Request detailed reports from your supervisor if needed.";
      suggestions = ['View my dashboard', 'Check my attendance', 'My task history'];
    }
  }
  // Sync queries
  else if (lowerQuery.includes('sync') || lowerQuery.includes('kwantu')) {
    if (isAdmin) {
      content = "Data syncs automatically to Kwantu on schedule (daily for attendance, weekly for reports). You can manually trigger sync from the Admin Dashboard. The Sync Manager shows status and retry failed syncs.";
      suggestions = ['Open Sync Manager', 'Check sync status', 'Retry failed syncs'];
    } else {
      content = "Your data (attendance, tasks, profile) is automatically synced to Kwantu. You don't need to do anything manually. If you notice sync issues, contact your administrator.";
      suggestions = ['Contact support', 'View my profile', 'Check data status'];
    }
  }
  // Notification queries
  else if (lowerQuery.includes('notification') || lowerQuery.includes('alert')) {
    content = "Enable push notifications to stay updated on tasks, attendance reminders, document approvals, and important announcements. Click the bell icon in the header to view recent notifications.";
    suggestions = ['Enable notifications', 'View all notifications', 'Notification settings'];
  }
  // Help queries
  else if (lowerQuery.includes('help') || lowerQuery.includes('how do i') || lowerQuery.includes('how to')) {
    content = `I can help you with:

• Check-in/out procedures
• Task management
• Onboarding process
• Impact stories
• Analytics and reports
• Data synchronization
• Notifications

What would you like to know more about?`;
    suggestions = ['Check-in help', 'Task help', 'Onboarding help', 'Reports help'];
  }
  // Getting started
  else if (lowerQuery.includes('start') || lowerQuery.includes('begin') || lowerQuery.includes('new')) {
    if (isWorker) {
      content = `Welcome to YETOMO! Here's how to get started:

1. Complete your onboarding profile
2. Enroll biometric verification
3. Check in at your assigned site
4. View and complete assigned tasks
5. Share your success story

Need help with any of these steps?`;
      suggestions = ['Complete onboarding', 'Biometric enrollment', 'My first check-in'];
    } else {
      content = `Welcome to the YETOMO Admin Dashboard! Key features:

1. Participant Management - Review and approve applications
2. Attendance Tracking - Monitor check-ins and site presence
3. Task Assignment - Create and track work assignments
4. Analytics - View comprehensive performance metrics
5. Reports - Export data for M&E

What would you like to explore first?`;
      suggestions = ['View participants', 'Create task', 'View analytics'];
    }
  }
  // Sites
  else if (lowerQuery.includes('site') || lowerQuery.includes('location')) {
    if (isWorker) {
      content = "Your assigned site is shown in your profile. Make sure to check in from the correct site location for accurate attendance tracking. Contact your supervisor if you need to change sites.";
      suggestions = ['View my site', 'Check-in location', 'Site information'];
    } else {
      content = "Manage sites from the Sites page. Create new sites, assign participants, track site-specific metrics, and monitor site performance. Each site has its own analytics dashboard.";
      suggestions = ['View all sites', 'Create new site', 'Site analytics'];
    }
  }
  // Default response
  else {
    content = `I'm here to help! I can assist with:

• **Check-in/Attendance** - How to check in, view attendance, sync status
• **Tasks** - Managing assignments, priorities, and completion
• **Onboarding** - Document upload, verification, biometric enrollment
• **Stories** - Sharing impact stories and reviewing submissions
• **Analytics** - Viewing metrics, reports, and performance data
• **Sync** - Understanding Kwantu synchronization

What would you like to know?`;
    suggestions = [
      'How do I check in?',
      'View my tasks',
      'What is Kwantu sync?',
      'Share my story',
    ];
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    suggestions,
  };
}

/**
 * Get suggested questions based on context
 */
export function getSuggestedQuestions(context: AIContext): string[] {
  const { user, currentPage } = context;
  const isWorker = user.role === 'worker';
  const isAdmin = ['property-point', 'project-manager'].includes(user.role);

  const suggestions: string[] = [];

  // Page-specific suggestions
  if (currentPage === '/check-in') {
    suggestions.push(
      'How do I check in?',
      'What if biometric fails?',
      'Can I check in from anywhere?'
    );
  } else if (currentPage === '/tasks') {
    suggestions.push('How do I complete a task?', 'What do task priorities mean?', 'Where do I see task history?');
  } else if (currentPage === '/onboarding') {
    suggestions.push(
      'What documents do I need?',
      'How long does verification take?',
      'What is biometric enrollment?'
    );
  } else if (currentPage === '/stories') {
    suggestions.push('How do I share my story?', 'When will my story be published?', 'Story guidelines');
  } else if (currentPage === '/admin') {
    if (isAdmin) {
      suggestions.push('How do I approve participants?', 'Export attendance report', 'Trigger manual sync');
    }
  } else if (currentPage === '/analytics') {
    suggestions.push('What metrics are tracked?', 'How to export data?', 'Understanding trends');
  } else if (currentPage === '/reports') {
    suggestions.push('Available report types', 'Export formats', 'Custom date ranges');
  }

  // General suggestions based on role
  if (isWorker) {
    suggestions.push('Getting started guide', 'My attendance history', 'Contact supervisor');
  } else if (isAdmin) {
    suggestions.push('Participant overview', 'System health check', 'Bulk operations');
  }

  return suggestions.slice(0, 6);
}

/**
 * Get quick actions based on context
 */
export function getQuickActions(context: AIContext): Array<{ label: string; action: string }> {
  const { user, currentPage } = context;
  const isWorker = user.role === 'worker';
  const isAdmin = ['property-point', 'project-manager'].includes(user.role);

  const actions: Array<{ label: string; action: string }> = [];

  if (isWorker) {
    if (currentPage !== '/check-in') {
      actions.push({ label: 'Check In/Out', action: '/check-in' });
    }
    if (currentPage !== '/tasks') {
      actions.push({ label: 'View My Tasks', action: '/tasks' });
    }
    actions.push({ label: 'Share My Story', action: '/stories' });
    actions.push({ label: 'View My Profile', action: '/profile' });
  }

  if (isAdmin) {
    if (currentPage !== '/admin') {
      actions.push({ label: 'Admin Dashboard', action: '/admin' });
    }
    if (currentPage !== '/analytics') {
      actions.push({ label: 'View Analytics', action: '/analytics' });
    }
    actions.push({ label: 'Export Reports', action: '/reports' });
    actions.push({ label: 'Review Stories', action: '/stories' });
  }

  return actions.slice(0, 4);
}
