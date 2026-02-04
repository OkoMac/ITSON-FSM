/**
 * AI Service - Claude API Integration
 * Provides intelligent assistance for ITSON FSM platform
 */

import type { User } from '@/types';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

interface AIContext {
  user: User;
  currentPage: string;
  conversationHistory?: AIMessage[];
}

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'claude'; // 'claude' or 'openai'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate AI response using Claude or OpenAI API
 */
export async function generateAIResponse(
  message: string,
  context: AIContext
): Promise<AIMessage> {
  try {
    // If no API key, return mock response
    if (!API_KEY) {
      return generateMockResponse(message, context);
    }

    if (AI_PROVIDER === 'claude') {
      return await generateClaudeResponse(message, context);
    } else {
      return await generateOpenAIResponse(message, context);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return generateMockResponse(message, context);
  }
}

/**
 * Generate response using Claude API
 */
async function generateClaudeResponse(
  message: string,
  context: AIContext
): Promise<AIMessage> {
  const systemPrompt = generateSystemPrompt(context);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...(context.conversationHistory || []).map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    suggestions: extractSuggestions(content),
  };
}

/**
 * Generate response using OpenAI API
 */
async function generateOpenAIResponse(
  message: string,
  context: AIContext
): Promise<AIMessage> {
  const systemPrompt = generateSystemPrompt(context);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(context.conversationHistory || []).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    suggestions: extractSuggestions(content),
  };
}

/**
 * Generate system prompt based on user context
 */
function generateSystemPrompt(context: AIContext): string {
  const { user, currentPage } = context;

  return `You are an AI assistant for the ITSON FSM (Field Service Management) platform. You help users with:

**User Context:**
- Name: ${user.name}
- Role: ${user.role}
- Current Page: ${currentPage}

**Your Capabilities:**
1. Task Management: Help users create, track, and complete tasks
2. Attendance: Guide users through check-in/check-out processes
3. Site Management: Provide information about work sites and locations
4. Documentation: Help with document uploads and compliance
5. Biometric Setup: Guide users through biometric enrollment
6. WhatsApp Onboarding: Explain the WhatsApp registration process
7. Reporting: Assist with generating reports and analytics
8. Troubleshooting: Help resolve technical issues

**Role-Specific Guidance:**
${getRoleSpecificGuidance(user.role)}

**Current Page Context:**
${getPageContext(currentPage)}

**Instructions:**
- Be helpful, concise, and professional
- Provide step-by-step guidance when needed
- Suggest relevant actions based on the user's role and current page
- Use clear, simple language
- Prioritize mobile-friendly responses (short paragraphs)

Always end your response with 2-3 suggested follow-up questions if appropriate.`;
}

/**
 * Get role-specific guidance
 */
function getRoleSpecificGuidance(role: string): string {
  const guidance: Record<string, string> = {
    worker: `
- Focus on daily tasks, check-in/out, and task completion
- Guide on submitting photo evidence
- Help with document uploads
- Explain biometric check-in process`,
    supervisor: `
- Help manage team assignments
- Guide on task approval/rejection
- Assist with monitoring attendance
- Explain reporting features`,
    'project-manager': `
- Focus on site management and overview
- Guide on resource allocation
- Help with performance analytics
- Assist with bulk operations`,
    'system-admin': `
- Provide full system administration guidance
- Help with user management
- Guide on system configuration
- Assist with integrations and advanced features`,
  };

  return guidance[role] || guidance.worker;
}

/**
 * Get page-specific context
 */
function getPageContext(path: string): string {
  const contexts: Record<string, string> = {
    '/dashboard': 'User is viewing the dashboard with stats and quick actions',
    '/check-in': 'User is on the check-in page for biometric attendance',
    '/tasks': 'User is viewing their task list',
    '/sites': 'User is viewing work sites and locations',
    '/profile': 'User is viewing their profile and settings',
    '/analytics': 'User is viewing analytics and reports',
    '/documents': 'User is managing documents and uploads',
    '/whatsapp': 'User is learning about WhatsApp onboarding',
  };

  for (const [route, context] of Object.entries(contexts)) {
    if (path.includes(route)) {
      return context;
    }
  }

  return 'User is navigating the platform';
}

/**
 * Extract suggestions from AI response
 */
function extractSuggestions(content: string): string[] {
  // Look for questions or suggestions at the end of the response
  const lines = content.split('\n');
  const suggestions: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) &&
      trimmed.includes('?')
    ) {
      suggestions.push(trimmed.replace(/^[-•\d.]\s*/, '').trim());
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Generate suggested questions based on context
 */
export function getSuggestedQuestions(context: AIContext): string[] {
  const { user, currentPage } = context;

  const baseQuestions: Record<string, string[]> = {
    '/dashboard': [
      'How do I check in for today?',
      'Show me my pending tasks',
      'What are my stats for this week?',
    ],
    '/check-in': [
      'How does biometric check-in work?',
      'What if my face scan fails?',
      'Can I check in manually?',
    ],
    '/tasks': [
      'How do I complete a task?',
      'What if I need help with a task?',
      'How do I upload photo evidence?',
    ],
    '/sites': [
      'What sites am I assigned to?',
      'How do I find site contact information?',
      'What are the site safety protocols?',
    ],
    '/documents': [
      'What documents do I need to upload?',
      'How do I upload my SA ID?',
      'What file formats are accepted?',
    ],
  };

  for (const [route, questions] of Object.entries(baseQuestions)) {
    if (currentPage.includes(route)) {
      return questions;
    }
  }

  // Default questions based on role
  const roleQuestions: Record<string, string[]> = {
    worker: [
      'How do I complete my assigned tasks?',
      'How do I check in with biometrics?',
      'Where can I see my work schedule?',
    ],
    supervisor: [
      'How do I approve tasks?',
      'How do I view team attendance?',
      'How do I assign new tasks?',
    ],
    'project-manager': [
      'How do I view site performance?',
      'How do I generate reports?',
      'How do I manage multiple sites?',
    ],
  };

  return roleQuestions[user.role] || roleQuestions.worker;
}

/**
 * Generate mock response (fallback when no API key)
 */
function generateMockResponse(message: string, context: AIContext): AIMessage {
  const messageLower = message.toLowerCase();

  let response = '';
  let suggestions: string[] = [];

  if (messageLower.includes('check in') || messageLower.includes('checkin')) {
    response = `To check in:

1. Go to the Check-In page
2. Position your face in the camera frame
3. Wait for biometric verification
4. Confirm your location is correct
5. Submit the check-in

Your attendance will be recorded automatically.`;
    suggestions = [
      'What if my face scan fails?',
      'Can I check in without biometrics?',
      'How accurate does my location need to be?',
    ];
  } else if (messageLower.includes('task')) {
    response = `For task management:

**View Tasks:** Check your Tasks page for all assignments
**Complete Tasks:**
1. Open the task
2. Follow the instructions
3. Upload photo evidence if required
4. Mark as complete

Supervisors will review and approve your work.`;
    suggestions = [
      'How do I upload photo evidence?',
      'What happens after I complete a task?',
      'Can I reject a task?',
    ];
  } else if (messageLower.includes('whatsapp')) {
    response = `WhatsApp Onboarding Process:

1. Send a message to our WhatsApp number
2. Provide your full name
3. Share your SA ID number
4. Upload required documents
5. Complete POPIA consent
6. Agree to code of conduct

You'll be registered and ready to work!`;
    suggestions = [
      'What documents do I need?',
      'How long does onboarding take?',
      'What if I make a mistake?',
    ];
  } else if (messageLower.includes('document')) {
    response = `Required documents:

• SA ID (both sides)
• Proof of residence
• Profile photo
• Bank details (for payments)

All documents can be uploaded via the Documents page or WhatsApp.`;
    suggestions = [
      'What file formats are accepted?',
      'Can I update documents later?',
      'Are my documents secure?',
    ];
  } else {
    response = `I'm here to help you with the ITSON FSM platform!

I can assist with:
• Task management
• Check-in/out procedures
• Site information
• Document uploads
• WhatsApp onboarding
• Troubleshooting

What would you like to know more about?`;
    suggestions = getSuggestedQuestions(context);
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
    suggestions,
  };
}

/**
 * Analyze user intent from message
 */
export function analyzeIntent(message: string): {
  intent: string;
  confidence: number;
  entities: string[];
} {
  const messageLower = message.toLowerCase();
  const intents = {
    'check-in': ['check in', 'checkin', 'clock in', 'attendance', 'biometric'],
    task: ['task', 'assignment', 'work', 'complete', 'finish'],
    document: ['document', 'upload', 'file', 'id', 'proof'],
    site: ['site', 'location', 'address', 'where'],
    help: ['help', 'how', 'what', 'why', 'explain'],
    whatsapp: ['whatsapp', 'onboard', 'register', 'sign up'],
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        return {
          intent,
          confidence: 0.8,
          entities: [keyword],
        };
      }
    }
  }

  return {
    intent: 'general',
    confidence: 0.5,
    entities: [],
  };
}
