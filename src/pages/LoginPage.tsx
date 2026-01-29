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
    <div className="min-h-screen flex items-center justify-center p-16 bg-glass-black relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <GlassCard className="border-neon-cyan">
          {/* Logo */}
          <div className="text-center mb-48">
            <div className="flex justify-center mb-16">
              <div className="relative">
                <img
                  src={logoImage}
                  alt="ITSON Logo"
                  className="h-28 w-auto drop-shadow-lg"
                />
                <div className="absolute inset-0 blur-xl bg-accent-cyan/30 -z-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gradient-cyan mb-8">
              itson
            </h1>
            <p className="text-text-secondary text-sm font-medium tracking-widest uppercase">
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
              <div className="p-16 rounded-xl bg-status-error/10 border-2 border-status-error/40 backdrop-blur-lg">
                <div className="flex items-center gap-12">
                  <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-status-error font-medium">{error || validationError}</p>
                </div>
              </div>
            )}

            <Button type="submit" fullWidth loading={isLoading} className="btn-primary">
              <span className="text-base font-bold">Sign In</span>
            </Button>

            {/* Demo credentials */}
            <div className="mt-20 p-20 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20">
              <p className="text-xs text-accent-cyan font-semibold mb-12 uppercase tracking-wider">Demo Credentials</p>
              <div className="space-y-6">
                <p className="text-xs text-white/70">
                  <span className="text-white/50">Email:</span> demo@itsonfsm.com
                </p>
                <p className="text-xs text-white/70">
                  <span className="text-white/50">Password:</span> any password
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-36 pt-28 border-t-2 border-accent-cyan/20 text-center">
            <p className="text-xs text-white/50 uppercase tracking-widest">
              IDC Social Employment Fund Programme
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;
