/**
 * AI Assistant Component
 *
 * Floating AI assistant chat interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/useAuthStore';
import {
  generateAIResponse,
  getSuggestedQuestions,
  type AIMessage,
} from '@/services/ai';

export const AIAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      const welcomeMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello ${user?.name.split(' ')[0]}! 👋 I'm your ITSON FSM assistant. How can I help you today?`,
        timestamp: new Date().toISOString(),
        suggestions: getSuggestedQuestions({
          user: user!,
          currentPage: location.pathname,
        }),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content?: string) => {
    const messageText = content || inputValue.trim();
    if (!messageText || !user) return;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await generateAIResponse(messageText, {
        user,
        currentPage: location.pathname,
      });

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-16 md:bottom-24 md:right-24 z-50 w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-accent-blue to-accent-blue-light shadow-xl hover:scale-110 transition-transform flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <svg
            className="w-24 h-24 md:w-28 md:h-28 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-success animate-pulse"></span>
        </button>
      )}

      {/* Chat Window - Full screen on mobile, floating on desktop */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-24 z-50 md:w-[400px] md:max-w-[calc(100vw-48px)] md:h-[600px] md:max-h-[calc(100vh-100px)] md:rounded-glass bg-surface-primary md:glass-card border-0 md:border md:border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-16 border-b border-border bg-surface-primary">
            <div className="flex items-center space-x-12">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-blue to-accent-blue-light flex items-center justify-center">
                <svg
                  className="w-20 h-20 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
                <p className="text-xs text-text-secondary">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <button
                onClick={handleClear}
                className="p-8 rounded-lg hover:bg-white/10 transition-colors"
                title="Clear chat"
              >
                <svg
                  className="w-16 h-16 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-8 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <svg
                  className="w-16 h-16 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-16 space-y-16">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] p-12 rounded-glass',
                    message.role === 'user'
                      ? 'bg-accent-blue text-white'
                      : 'bg-surface-secondary text-text-primary'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-12 space-y-6">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left px-12 py-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary p-12 rounded-glass">
                  <div className="flex space-x-4">
                    <div className="w-8 h-8 rounded-full bg-text-secondary animate-bounce"></div>
                    <div
                      className="w-8 h-8 rounded-full bg-text-secondary animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-8 h-8 rounded-full bg-text-secondary animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-16 border-t border-border">
            <div className="flex space-x-8">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-16 py-12 rounded-glass glass-button text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="px-20 py-12 rounded-glass bg-accent-blue text-white hover:bg-accent-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-20 h-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
