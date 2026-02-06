/**
 * Skip Navigation Link
 * Allows keyboard users to skip directly to main content
 * WCAG 2.1 Level A requirement
 */

import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: '16px',
        background: '#00D9FF',
        color: '#000',
        textDecoration: 'none',
        fontWeight: 'bold',
        borderRadius: '8px',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '16px';
        e.currentTarget.style.top = '16px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
    >
      Skip to main content
    </a>
  );
};
