/**
 * Face Capture Component
 *
 * Camera interface for face recognition enrollment and verification
 */

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import {
  getCameraStream,
  stopCameraStream,
  detectFace,
  capturePhotoFromVideo,
} from '@/services/biometric/faceRecognition';

interface FaceCaptureProps {
  mode: 'enrollment' | 'verification';
  onCapture: (canvas: HTMLCanvasElement, confidence: number) => void;
  onCancel: () => void;
  minConfidence?: number;
}

export const FaceCapture: React.FC<FaceCaptureProps> = ({
  mode,
  onCapture,
  onCancel,
  minConfidence = 0.8,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // Start camera on mount
  useEffect(() => {
    startCamera();

    return () => {
      cleanup();
    };
  }, []);

  // Face detection loop
  useEffect(() => {
    if (!videoRef.current || isLoading) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const result = await detectFace(videoRef.current);

      if (result.descriptor) {
        setFaceDetected(true);
        setConfidence(result.confidence);
      } else {
        setFaceDetected(false);
        setConfidence(0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await getCameraStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !faceDetected) return;

    setIsCapturing(true);

    try {
      const canvas = capturePhotoFromVideo(videoRef.current);
      const result = await detectFace(canvas);

      if (!result.descriptor) {
        setError('No face detected. Please try again.');
        setIsCapturing(false);
        return;
      }

      if (result.confidence < minConfidence) {
        setError(
          `Face detection confidence too low (${(result.confidence * 100).toFixed(1)}%). Please ensure good lighting and look directly at camera.`
        );
        setIsCapturing(false);
        return;
      }

      cleanup();
      onCapture(canvas, result.confidence);
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(err.message);
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const getConfidenceColor = () => {
    if (confidence >= minConfidence) return 'text-status-success';
    if (confidence >= 0.6) return 'text-status-warning';
    return 'text-status-error';
  };

  const getInstructions = () => {
    if (mode === 'enrollment') {
      return 'Position your face in the center and look directly at the camera';
    }
    return 'Verify your identity by looking at the camera';
  };

  return (
    <div className="glass-card p-24 space-y-16">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text-primary">
          {mode === 'enrollment' ? 'Enroll Face' : 'Verify Face'}
        </h3>
        <p className="text-sm text-text-secondary mt-4">{getInstructions()}</p>
      </div>

      {/* Video feed */}
      <div className="relative rounded-glass overflow-hidden bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-blue border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center p-24">
              <div className="w-16 h-16 rounded-full bg-status-error/20 flex items-center justify-center mx-auto mb-16">
                <svg
                  className="w-8 h-8 text-status-error"
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
              </div>
              <p className="text-status-error font-medium">{error}</p>
              <Button onClick={startCamera} variant="secondary" className="mt-16">
                Retry
              </Button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }} // Mirror for natural selfie view
        />

        {/* Face detection overlay */}
        {!isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-64 h-80 border-4 rounded-glass transition-colors ${
                faceDetected && confidence >= minConfidence
                  ? 'border-status-success'
                  : faceDetected
                    ? 'border-status-warning'
                    : 'border-white/30'
              }`}
            >
              {/* Corner guides */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-accent-blue"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-accent-blue"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-accent-blue"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-accent-blue"></div>
            </div>
          </div>
        )}

        {/* Confidence indicator */}
        {!isLoading && !error && faceDetected && (
          <div className="absolute bottom-16 left-0 right-0 text-center">
            <div className="inline-block glass-card px-16 py-8">
              <p className={`text-sm font-semibold ${getConfidenceColor()}`}>
                Confidence: {(confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status message */}
      {!isLoading && !error && (
        <div className="text-center">
          {faceDetected ? (
            confidence >= minConfidence ? (
              <p className="text-status-success text-sm font-medium">
                Face detected - Ready to capture
              </p>
            ) : (
              <p className="text-status-warning text-sm font-medium">
                Face detected - Improve lighting or positioning
              </p>
            )
          ) : (
            <p className="text-text-secondary text-sm">
              No face detected - Position yourself in the frame
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-12">
        <Button onClick={handleCancel} variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleCapture}
          variant="primary"
          className="flex-1"
          disabled={!faceDetected || confidence < minConfidence || isCapturing || isLoading}
        >
          {isCapturing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-8"></div>
              Capturing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Capture
            </>
          )}
        </Button>
      </div>

      {/* Tips */}
      <div className="glass-card-secondary p-16 rounded-glass-sm">
        <p className="text-xs text-text-secondary font-medium mb-8">Tips for best results:</p>
        <ul className="text-xs text-text-tertiary space-y-4">
          <li>• Ensure good lighting (avoid backlighting)</li>
          <li>• Look directly at the camera</li>
          <li>• Remove glasses or hats if possible</li>
          <li>• Keep your face centered in the guide</li>
        </ul>
      </div>
    </div>
  );
};
