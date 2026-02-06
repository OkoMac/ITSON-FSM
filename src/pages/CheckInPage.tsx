/**
 * Check-In/Out Page
 *
 * Biometric attendance tracking with face recognition and fingerprint scanning
 * GPS verification, photo evidence, and offline support
 */

import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import { FaceCapture, FingerprintPrompt, BiometricEnrollment } from '@/components/biometric';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/utils/db';
import type { AttendanceRecord, Participant } from '@/types';
import {
  verifyFace,
  canvasToBlob,
} from '@/services/biometric/faceRecognition';
import {
  getEnrollmentStatus,
  type BiometricType,
} from '@/services/biometric/biometricEnrollment';
import heroBuilding from '@/assets/images/hero-building.svg';

type CheckInStep = 'initial' | 'select-method' | 'face-verify' | 'fingerprint-verify' | 'enrollment' | 'complete';
type AttendanceAction = 'check-in' | 'check-out';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

const CheckInPage: React.FC = () => {
  const { user } = useAuthStore();

  const [step, setStep] = useState<CheckInStep>('initial');
  const [action, setAction] = useState<AttendanceAction>('check-in');
  const [selectedMethod, setSelectedMethod] = useState<BiometricType | null>(null);

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [currentCheckIn, setCurrentCheckIn] = useState<AttendanceRecord | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<LocationData | null>(null);

  const [needsEnrollment, setNeedsEnrollment] = useState(false);

  // Load participant data and today's attendance
  useEffect(() => {
    loadParticipantData();
    loadTodayAttendance();
  }, [user]);

  const loadParticipantData = async () => {
    if (!user) return;

    try {
      // Find participant record for current user
      const participants = await db.participants
        .where('userId')
        .equals(user.id)
        .toArray();

      if (participants.length > 0) {
        setParticipant(participants[0]);

        // Check enrollment status
        const enrollmentStatus = await getEnrollmentStatus(participants[0].id);

        if (!enrollmentStatus.canCheckIn) {
          setNeedsEnrollment(true);
          setStep('enrollment');
        }
      }
    } catch (err) {
      console.error('Error loading participant data:', err);
    }
  };

  const loadTodayAttendance = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const records = await db.attendanceRecords
        .where('participantId')
        .equals(user.id)
        .toArray();

      const todayRecords = records
        .filter((r) => r.checkInTime?.startsWith(today))
        .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''));

      setTodayAttendance(todayRecords);

      // Check if currently checked in
      const checkedIn = todayRecords.find((r) => r.checkInTime && !r.checkOutTime);

      if (checkedIn) {
        setCurrentCheckIn(checkedIn);
        setAction('check-out');
      } else {
        setAction('check-in');
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  const captureLocation = async (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error('Failed to get location. Please enable location services.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleStartCheckIn = () => {
    setError(null);
    setStep('select-method');
  };

  const handleMethodSelection = (method: BiometricType) => {
    setSelectedMethod(method);

    if (method === 'face') {
      setStep('face-verify');
    } else if (method === 'fingerprint') {
      setStep('fingerprint-verify');
    }
  };

  const handleFaceVerify = async (canvas: HTMLCanvasElement, _confidence: number) => {
    if (!participant) {
      setError('Participant data not found');
      return;
    }

    setError(null);

    try {
      // Verify face
      const verifyResult = await verifyFace(participant.id, canvas);

      if (!verifyResult.match) {
        setError(verifyResult.error || 'Face verification failed. Please try again.');
        setStep('select-method');
        return;
      }

      // Capture location
      const locationData = await captureLocation();

      // Store photo
      const blob = await canvasToBlob(canvas);

      // Create attendance record
      await createAttendanceRecord(
        'face',
        verifyResult.confidence,
        locationData,
        blob
      );

      setStep('complete');
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Check-in failed. Please try again.');
      setStep('select-method');
    }
  };

  const handleFingerprintVerify = async () => {
    if (!participant) {
      setError('Participant data not found');
      return;
    }

    setError(null);

    try {
      // Capture location
      const locationData = await captureLocation();

      // Create attendance record
      await createAttendanceRecord(
        'fingerprint',
        1.0, // Fingerprint is binary match
        locationData,
        null
      );

      setStep('complete');
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Check-in failed. Please try again.');
      setStep('select-method');
    }
  };

  const createAttendanceRecord = async (
    biometricType: 'face' | 'fingerprint',
    confidence: number,
    locationData: LocationData,
    photoBlob: Blob | null
  ) => {
    if (!participant || !user) {
      throw new Error('Participant or user data not found');
    }

    const now = new Date().toISOString();

    if (action === 'check-in') {
      // Create new check-in record
      const record: AttendanceRecord = {
        id: crypto.randomUUID(),
        participantId: participant.id,
        siteId: participant.siteId || 'unknown',
        date: now.split('T')[0],
        checkInTime: now,
        checkInLocation: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        },
        checkInMethod: biometricType,
        checkInPhoto: photoBlob ? await blobToBase64(photoBlob) : undefined,
        biometricConfidence: confidence,
        status: 'present',
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await db.attendanceRecords.add(record);
      setCurrentCheckIn(record);
      setAction('check-out');
    } else {
      // Update existing check-in with check-out data
      if (!currentCheckIn) {
        throw new Error('No active check-in found');
      }

      await db.attendanceRecords.update(currentCheckIn.id, {
        checkOutTime: now,
        checkOutLocation: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        },
        checkOutMethod: biometricType,
        checkOutPhoto: photoBlob ? await blobToBase64(photoBlob) : undefined,
        updatedAt: now,
      });

      setCurrentCheckIn(null);
      setAction('check-in');
    }

    // Reload today's attendance
    await loadTodayAttendance();
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleEnrollmentComplete = async () => {
    setNeedsEnrollment(false);
    setStep('initial');
    await loadParticipantData();
  };

  const handleBackToInitial = () => {
    setStep('initial');
    setSelectedMethod(null);
    setError(null);
  };

  const handleFinishCheckIn = () => {
    setStep('initial');
    setSelectedMethod(null);
    setError(null);
    setLocation(null);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateWorkHours = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Enrollment screen
  if (needsEnrollment && step === 'enrollment' && participant) {
    return (
      <div className="space-y-32 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            Biometric Enrollment Required
          </h1>
          <p className="text-text-secondary">
            Enroll your biometrics to enable check-in/out
          </p>
        </div>

        <BiometricEnrollment
          participantId={participant.id}
          participantName={participant.fullName}
          onComplete={handleEnrollmentComplete}
          onCancel={() => setNeedsEnrollment(false)}
        />
      </div>
    );
  }

  // Initial screen
  if (step === 'initial') {
    const isCheckedIn = currentCheckIn !== null;

    return (
      <div className="space-y-32 animate-fade-in">
        {/* Hero Section */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundImage: `url(${heroBuilding})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '200px',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/70" />
          <div className="relative z-10 p-32">
            <h1 className="text-4xl font-bold text-white mb-8">
              Biometric Attendance
            </h1>
            <p className="text-lg text-white/80">
              Use face recognition or fingerprint to check in/out
            </p>
          </div>
        </div>

        {/* Status card */}
        <GlassCard>
          <div className="text-center py-48">
            {isCheckedIn ? (
              <>
                <div className="w-24 h-24 mx-auto mb-24 bg-status-success/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-status-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <Badge variant="success" size="lg" className="mb-16">
                  Checked In
                </Badge>
                <p className="text-2xl font-bold text-text-primary mb-8 font-sf-mono">
                  {currentCheckIn?.checkInTime && formatTime(currentCheckIn.checkInTime)}
                </p>
                <p className="text-sm text-text-secondary mb-32">
                  {participant?.siteName || 'Site'}
                </p>
                <Button variant="secondary" onClick={handleStartCheckIn}>
                  Check Out
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto mb-24 bg-accent-blue/20 rounded-full flex items-center justify-center animate-pulse-glow">
                  <svg
                    className="w-12 h-12 text-accent-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-16">
                  Ready to Check In
                </p>
                <p className="text-sm text-text-secondary mb-32">
                  Use biometric verification to mark your attendance
                </p>
                <Button onClick={handleStartCheckIn}>Start Biometric Check-In</Button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Today's attendance */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-24">
            Today's Attendance
          </h2>
          {todayAttendance.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-32">
              No attendance records for today
            </p>
          ) : (
            <div className="space-y-16">
              {todayAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-16 rounded-glass bg-white/5"
                >
                  <div>
                    <div className="flex items-center gap-8 mb-4">
                      <p className="text-sm font-medium text-text-primary">
                        {record.checkInTime && formatTime(record.checkInTime)}
                      </p>
                      {record.checkOutTime && (
                        <>
                          <span className="text-text-tertiary">→</span>
                          <p className="text-sm font-medium text-text-primary">
                            {formatTime(record.checkOutTime)}
                          </p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {record.checkInMethod === 'face' ? 'Face Recognition' : 'Fingerprint'}
                      {record.biometricConfidence &&
                        ` • ${(record.biometricConfidence * 100).toFixed(0)}% confidence`}
                    </p>
                  </div>
                  {record.checkOutTime && (
                    <p className="text-sm font-semibold text-status-success font-sf-mono">
                      {calculateWorkHours(record.checkInTime!, record.checkOutTime)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // Method selection screen
  if (step === 'select-method') {
    return (
      <div className="space-y-32 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            Choose Verification Method
          </h1>
          <p className="text-text-secondary">
            Select how you'd like to {action === 'check-in' ? 'check in' : 'check out'}
          </p>
        </div>

        {error && (
          <div className="glass-card p-16 border border-status-error/20">
            <div className="flex gap-12">
              <svg
                className="w-5 h-5 text-status-error flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-status-error">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-16">
          <button
            onClick={() => handleMethodSelection('face')}
            className="glass-card p-24 hover:bg-white/10 transition-all focus-ring text-left"
          >
            <div className="flex items-center gap-16">
              <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-text-primary">
                  Face Recognition
                </h4>
                <p className="text-sm text-text-secondary mt-4">
                  Fast and contactless verification
                </p>
              </div>
              <svg
                className="w-6 h-6 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelection('fingerprint')}
            className="glass-card p-24 hover:bg-white/10 transition-all focus-ring text-left"
          >
            <div className="flex items-center gap-16">
              <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-text-primary">
                  Fingerprint Scan
                </h4>
                <p className="text-sm text-text-secondary mt-4">
                  Secure biometric verification
                </p>
              </div>
              <svg
                className="w-6 h-6 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>

        <Button onClick={handleBackToInitial} variant="secondary" className="w-full">
          Cancel
        </Button>
      </div>
    );
  }

  // Face verification screen
  if (step === 'face-verify' && participant) {
    return (
      <div className="space-y-32 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            Face Verification
          </h1>
          <p className="text-text-secondary">
            Verify your identity to {action === 'check-in' ? 'check in' : 'check out'}
          </p>
        </div>

        <FaceCapture
          mode="verification"
          onCapture={handleFaceVerify}
          onCancel={() => setStep('select-method')}
        />
      </div>
    );
  }

  // Fingerprint verification screen
  if (step === 'fingerprint-verify' && participant) {
    return (
      <div className="space-y-32 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            Fingerprint Verification
          </h1>
          <p className="text-text-secondary">
            Verify your identity to {action === 'check-in' ? 'check in' : 'check out'}
          </p>
        </div>

        <FingerprintPrompt
          mode="verification"
          participantId={participant.id}
          participantName={participant.fullName}
          onSuccess={handleFingerprintVerify}
          onCancel={() => setStep('select-method')}
        />
      </div>
    );
  }

  // Completion screen
  if (step === 'complete') {
    const wasCheckIn = action === 'check-out'; // If action is now check-out, we just did a check-in

    return (
      <div className="space-y-32 animate-fade-in">
        <GlassCard>
          <div className="text-center py-48">
            <div className="w-24 h-24 mx-auto mb-24 bg-status-success/20 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-status-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-8">
              {wasCheckIn ? 'Check-In Successful!' : 'Check-Out Successful!'}
            </h2>

            <p className="text-sm text-text-secondary mb-32">
              {wasCheckIn
                ? 'Your attendance has been recorded'
                : 'Your work session has been completed'}
            </p>

            {location && (
              <div className="glass-card-secondary p-16 rounded-glass-sm mb-24 max-w-md mx-auto">
                <div className="space-y-8 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Time:</span>
                    <span className="text-text-primary font-semibold font-sf-mono">
                      {formatTime(location.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Method:</span>
                    <span className="text-text-primary">
                      {selectedMethod === 'face' ? 'Face Recognition' : 'Fingerprint'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Location:</span>
                    <span className="text-text-primary">
                      ±{Math.round(location.accuracy)}m accuracy
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleFinishCheckIn} variant="primary" className="min-w-[200px]">
              Done
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return null;
};

export default CheckInPage;
