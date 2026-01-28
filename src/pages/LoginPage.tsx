import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard, Input, Button } from '@/components/ui';
import logoImage from '@/assets/images/itson-logo.svg';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-16 bg-gradient-to-b from-glass-black via-glass-black-light to-glass-black">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <GlassCard>
          {/* Logo */}
          <div className="text-center mb-40">
            <div className="flex justify-center mb-12">
              <img
                src={logoImage}
                alt="ITSON Logo"
                className="h-24 w-auto"
              />
            </div>
            <p className="text-text-secondary text-base font-medium tracking-wide">
              Facilities Management System
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-24">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />

            {(error || validationError) && (
              <div className="p-12 rounded-glass bg-status-error/10 border border-status-error/30">
                <p className="text-sm text-status-error">{error || validationError}</p>
              </div>
            )}

            <Button type="submit" fullWidth loading={isLoading}>
              Sign In
            </Button>

            {/* Demo credentials */}
            <div className="mt-16 p-16 rounded-glass bg-white/5">
              <p className="text-xs text-text-secondary mb-8">Demo Credentials:</p>
              <p className="text-xs text-text-tertiary">Email: demo@itsonfsm.com</p>
              <p className="text-xs text-text-tertiary">Password: any password</p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-32 pt-24 border-t border-white/10 text-center">
            <p className="text-xs text-text-tertiary">
              IDC Social Employment Fund Programme
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;
