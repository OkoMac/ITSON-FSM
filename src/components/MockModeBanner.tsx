/**
 * Mock Mode Banner
 * Shows when the app is running in demo/mock mode
 */

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';

export default function MockModeBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('mockModeBannerDismissed');
    if (!dismissed && MOCK_MODE) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('mockModeBannerDismissed', 'true');
  };

  if (!isVisible || isDismissed || !MOCK_MODE) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                <span className="font-bold">Demo Mode:</span> This app is using mock data.
                Login with any demo credentials to explore features.
              </p>
              <p className="text-xs text-white/90 mt-0.5">
                Demo Login: admin@itsonfsm.com / password123
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-white/20 transition-colors"
            aria-label="Dismiss banner"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
