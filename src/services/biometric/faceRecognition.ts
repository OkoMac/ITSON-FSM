/**
 * Face Recognition Service
 *
 * Uses Face-API.js for facial recognition and verification
 * Stores face descriptors (non-reversible templates) for privacy compliance
 */

import * as faceapi from 'face-api.js';

// Face detection confidence threshold (IDC requirement: >=80%)
const CONFIDENCE_THRESHOLD = 0.8;

// Face descriptor storage key prefix
const FACE_DESCRIPTOR_KEY = 'face_descriptor_';

/**
 * Initialize Face-API models
 * Loads required models from public/models directory
 */
export async function initializeFaceAPI(): Promise<void> {
  const MODEL_URL = '/models';

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
}

/**
 * Detect face in image and extract descriptor
 *
 * @param imageElement - HTML image or video element
 * @returns Face descriptor and confidence score
 */
export async function detectFace(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  descriptor: Float32Array | null;
  confidence: number;
  landmarks: faceapi.FaceLandmarks68 | null;
}> {
  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return {
        descriptor: null,
        confidence: 0,
        landmarks: null,
      };
    }

    const confidence = detection.detection.score;

    return {
      descriptor: detection.descriptor,
      confidence,
      landmarks: detection.landmarks,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      descriptor: null,
      confidence: 0,
      landmarks: null,
    };
  }
}

/**
 * Enroll participant's face
 * Captures face descriptor and stores it securely
 *
 * @param participantId - Participant ID
 * @param imageElement - Image containing participant's face
 * @returns Enrollment result with confidence score
 */
export async function enrollFace(
  participantId: string,
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  success: boolean;
  confidence: number;
  error?: string;
}> {
  const { descriptor, confidence } = await detectFace(imageElement);

  if (!descriptor) {
    return {
      success: false,
      confidence: 0,
      error: 'No face detected in image',
    };
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      success: false,
      confidence,
      error: `Face detection confidence too low (${(confidence * 100).toFixed(1)}%). Minimum required: ${CONFIDENCE_THRESHOLD * 100}%`,
    };
  }

  // Store descriptor in IndexedDB (non-reversible template)
  try {
    const descriptorArray = Array.from(descriptor);
    localStorage.setItem(
      `${FACE_DESCRIPTOR_KEY}${participantId}`,
      JSON.stringify(descriptorArray)
    );

    return {
      success: true,
      confidence,
    };
  } catch (error) {
    console.error('Face enrollment error:', error);
    return {
      success: false,
      confidence,
      error: 'Failed to store face descriptor',
    };
  }
}

/**
 * Verify participant's face against enrolled descriptor
 *
 * @param participantId - Participant ID
 * @param imageElement - Image containing face to verify
 * @returns Verification result with match confidence
 */
export async function verifyFace(
  participantId: string,
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{
  match: boolean;
  confidence: number;
  distance: number;
  error?: string;
}> {
  // Get enrolled descriptor
  const storedDescriptor = localStorage.getItem(`${FACE_DESCRIPTOR_KEY}${participantId}`);

  if (!storedDescriptor) {
    return {
      match: false,
      confidence: 0,
      distance: 1,
      error: 'No face descriptor found for participant. Please enroll first.',
    };
  }

  // Parse stored descriptor
  const enrolledDescriptor = new Float32Array(JSON.parse(storedDescriptor));

  // Detect face in current image
  const { descriptor: currentDescriptor, confidence: detectionConfidence } = await detectFace(
    imageElement
  );

  if (!currentDescriptor) {
    return {
      match: false,
      confidence: 0,
      distance: 1,
      error: 'No face detected in image',
    };
  }

  // Calculate Euclidean distance between descriptors
  const distance = faceapi.euclideanDistance(enrolledDescriptor, currentDescriptor);

  // Face-API considers distance < 0.6 as same person
  const DISTANCE_THRESHOLD = 0.6;
  const match = distance < DISTANCE_THRESHOLD;

  // Convert distance to confidence score (0-1)
  const matchConfidence = Math.max(0, 1 - distance);

  return {
    match,
    confidence: match ? Math.min(detectionConfidence, matchConfidence) : 0,
    distance,
  };
}

/**
 * Capture photo from video stream
 *
 * @param videoElement - Video element with active stream
 * @returns Canvas with captured frame
 */
export function capturePhotoFromVideo(videoElement: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

/**
 * Convert canvas to blob for storage
 *
 * @param canvas - Canvas element
 * @returns Blob containing image data
 */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Get camera stream
 *
 * @returns MediaStream from user's camera
 */
export async function getCameraStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    console.error('Camera access error:', error);
    throw new Error('Failed to access camera. Please grant camera permissions.');
  }
}

/**
 * Stop camera stream
 *
 * @param stream - MediaStream to stop
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Check if face recognition is supported
 *
 * @returns true if supported
 */
export function isFaceRecognitionSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get enrollment status for participant
 *
 * @param participantId - Participant ID
 * @returns true if participant has enrolled face
 */
export function hasEnrolledFace(participantId: string): boolean {
  return localStorage.getItem(`${FACE_DESCRIPTOR_KEY}${participantId}`) !== null;
}

/**
 * Delete enrolled face descriptor
 *
 * @param participantId - Participant ID
 */
export function deleteEnrolledFace(participantId: string): void {
  localStorage.removeItem(`${FACE_DESCRIPTOR_KEY}${participantId}`);
}
