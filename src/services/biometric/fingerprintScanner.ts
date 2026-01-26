/**
 * Fingerprint Scanner Service
 *
 * Uses WebAuthn API for fingerprint authentication
 * POPIA-compliant: Stores public key credentials (non-reversible)
 */

/**
 * WebAuthn credential for fingerprint authentication
 */
export interface FingerprintCredential {
  credentialId: string;
  publicKey: string;
  participantId: string;
  createdAt: string;
}

/**
 * Check if fingerprint scanning is supported
 *
 * @returns true if browser supports WebAuthn
 */
export function isFingerprintSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );
}

/**
 * Check if device has fingerprint sensor
 *
 * @returns true if fingerprint sensor is available
 */
export async function hasFingerprintSensor(): Promise<boolean> {
  try {
    if (!isFingerprintSupported()) {
      return false;
    }

    // Check if platform authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Fingerprint sensor check error:', error);
    return false;
  }
}

/**
 * Enroll participant's fingerprint
 *
 * @param participantId - Participant ID
 * @param participantName - Participant name (for display)
 * @returns Enrollment result
 */
export async function enrollFingerprint(
  participantId: string,
  participantName: string
): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  try {
    if (!isFingerprintSupported()) {
      return {
        success: false,
        error: 'Fingerprint authentication is not supported on this device',
      };
    }

    // Create credential options
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'ITSON FSM Platform',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(participantId),
        name: participantId,
        displayName: participantName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // ES256
        },
        {
          type: 'public-key',
          alg: -257, // RS256
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create fingerprint credential',
      };
    }

    // Store credential ID for verification
    const credentialId = arrayBufferToBase64(credential.rawId);

    // Store in localStorage (in production, this would be in IndexedDB)
    const fingerprintData: FingerprintCredential = {
      credentialId,
      publicKey: credentialId, // Simplified - in production, store actual public key
      participantId,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      `fingerprint_${participantId}`,
      JSON.stringify(fingerprintData)
    );

    return {
      success: true,
      credentialId,
    };
  } catch (error: any) {
    console.error('Fingerprint enrollment error:', error);

    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Fingerprint enrollment was cancelled or denied',
      };
    }

    if (error.name === 'InvalidStateError') {
      return {
        success: false,
        error: 'Fingerprint already enrolled for this participant',
      };
    }

    return {
      success: false,
      error: `Fingerprint enrollment failed: ${error.message}`,
    };
  }
}

/**
 * Verify participant's fingerprint
 *
 * @param participantId - Participant ID
 * @returns Verification result
 */
export async function verifyFingerprint(
  participantId: string
): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  try {
    if (!isFingerprintSupported()) {
      return {
        success: false,
        error: 'Fingerprint authentication is not supported on this device',
      };
    }

    // Get stored credential
    const storedData = localStorage.getItem(`fingerprint_${participantId}`);

    if (!storedData) {
      return {
        success: false,
        error: 'No fingerprint enrolled for this participant',
      };
    }

    const fingerprintData: FingerprintCredential = JSON.parse(storedData);

    // Create verification challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [
        {
          type: 'public-key',
          id: base64ToArrayBuffer(fingerprintData.credentialId),
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    };

    // Get credential
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      return {
        success: false,
        error: 'Fingerprint verification failed',
      };
    }

    const credentialId = arrayBufferToBase64(assertion.rawId);

    // Verify credential ID matches
    if (credentialId !== fingerprintData.credentialId) {
      return {
        success: false,
        error: 'Fingerprint does not match enrolled fingerprint',
      };
    }

    return {
      success: true,
      credentialId,
    };
  } catch (error: any) {
    console.error('Fingerprint verification error:', error);

    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Fingerprint verification was cancelled or denied',
      };
    }

    return {
      success: false,
      error: `Fingerprint verification failed: ${error.message}`,
    };
  }
}

/**
 * Check if participant has enrolled fingerprint
 *
 * @param participantId - Participant ID
 * @returns true if fingerprint is enrolled
 */
export function hasEnrolledFingerprint(participantId: string): boolean {
  return localStorage.getItem(`fingerprint_${participantId}`) !== null;
}

/**
 * Delete enrolled fingerprint
 *
 * @param participantId - Participant ID
 */
export function deleteEnrolledFingerprint(participantId: string): void {
  localStorage.removeItem(`fingerprint_${participantId}`);
}

/**
 * Get enrollment info for participant
 *
 * @param participantId - Participant ID
 * @returns Enrollment info or null
 */
export function getFingerprintInfo(
  participantId: string
): FingerprintCredential | null {
  const storedData = localStorage.getItem(`fingerprint_${participantId}`);

  if (!storedData) {
    return null;
  }

  try {
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Failed to parse fingerprint data:', error);
    return null;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get user-friendly error message
 *
 * @param error - Error from WebAuthn API
 * @returns User-friendly message
 */
export function getFingerprintErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  switch (error.name) {
    case 'NotAllowedError':
      return 'Fingerprint access was denied. Please try again and allow fingerprint access.';
    case 'InvalidStateError':
      return 'This fingerprint is already enrolled.';
    case 'NotSupportedError':
      return 'Fingerprint authentication is not supported on this device.';
    case 'SecurityError':
      return 'Security error. Please ensure you are using HTTPS.';
    case 'AbortError':
      return 'Fingerprint operation was cancelled.';
    default:
      return error.message || 'Fingerprint operation failed';
  }
}
