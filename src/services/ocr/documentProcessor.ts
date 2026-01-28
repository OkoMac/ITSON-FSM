/**
 * OCR and AI Document Processing Service
 *
 * Handles:
 * - Text extraction from documents (OCR)
 * - Document quality validation
 * - Signature detection
 * - Data field extraction
 * - Supervisor review triggers
 */

import { db } from '@/utils/db';
import type { Participant } from '@/types';

export interface OCRResult {
  text: string;
  confidence: number;
  fields: ExtractedFields;
  quality: QualityCheck;
  signatures: SignatureDetection[];
  requiresReview: boolean;
  reviewReasons: string[];
}

export interface ExtractedFields {
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: string;
  address?: string;
  bankAccount?: string;
  contactNumber?: string;
  [key: string]: string | undefined;
}

export interface QualityCheck {
  isReadable: boolean;
  isComplete: boolean;
  hasWatermark: boolean;
  isExpired: boolean;
  resolution: 'low' | 'medium' | 'high';
  issues: string[];
}

export interface SignatureDetection {
  found: boolean;
  location: { x: number; y: number; width: number; height: number };
  confidence: number;
}

/**
 * Process document with OCR and AI validation
 */
export async function processDocument(
  documentId: string,
  imageData: string,
  documentType: string
): Promise<OCRResult> {
  console.log(`Processing document: ${documentId}, type: ${documentType}`);

  // Simulate OCR processing (in production, call actual OCR API like Tesseract, Google Vision, AWS Textract)
  const ocrText = await simulateOCR(imageData);

  // Extract structured fields based on document type
  const extractedFields = await extractFieldsByType(ocrText, documentType);

  // Perform quality checks
  const qualityCheck = await performQualityCheck(imageData, ocrText);

  // Detect signatures
  const signatures = await detectSignatures(imageData);

  // Determine if supervisor review is required
  const { requiresReview, reasons } = determineReviewRequirement(
    qualityCheck,
    signatures,
    extractedFields,
    documentType
  );

  const result: OCRResult = {
    text: ocrText,
    confidence: calculateOverallConfidence(qualityCheck, signatures),
    fields: extractedFields,
    quality: qualityCheck,
    signatures,
    requiresReview,
    reviewReasons: reasons,
  };

  // Store OCR result in database
  await storeOCRResult(documentId, result);

  return result;
}

/**
 * Simulate OCR text extraction
 * In production: Replace with Tesseract.js, Google Vision API, or AWS Textract
 */
async function simulateOCR(_imageData: string): Promise<string> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return simulated extracted text
  return `
    REPUBLIC OF SOUTH AFRICA
    IDENTITY DOCUMENT

    Surname: NKOSI
    Names: THABO JAMES
    ID Number: 9301155234089
    Date of Birth: 15 Jan 1993
    Sex: M
    Country of Birth: RSA
    Status: Citizen

    Issued: 12 Mar 2015
    Expires: 11 Mar 2025
  `;
}

/**
 * Extract structured fields based on document type
 */
async function extractFieldsByType(
  text: string,
  documentType: string
): Promise<ExtractedFields> {
  const fields: ExtractedFields = {};

  switch (documentType) {
    case 'id-document':
    case 'id-copy':
      fields.fullName = extractPattern(text, /Names?:\s*([A-Z\s]+)/i);
      fields.idNumber = extractPattern(text, /ID\s*Number:\s*(\d{13})/i);
      fields.dateOfBirth = extractPattern(text, /Date\s*of\s*Birth:\s*([\d\s\w]+)/i);
      break;

    case 'proof-of-residence':
      fields.address = extractPattern(text, /Address:\s*(.+?)(?=\n|$)/i);
      fields.fullName = extractPattern(text, /Name:\s*([A-Z\s]+)/i);
      break;

    case 'bank-statement':
    case 'bank-confirmation':
      fields.bankAccount = extractPattern(text, /Account\s*(?:Number)?:\s*(\d+)/i);
      fields.fullName = extractPattern(text, /Account\s*Holder:\s*([A-Z\s]+)/i);
      break;

    case 'matric-certificate':
    case 'qualification':
      fields.fullName = extractPattern(text, /(?:Name|Student):\s*([A-Z\s]+)/i);
      fields.idNumber = extractPattern(text, /ID:\s*(\d{13})/i);
      break;

    case 'police-clearance':
      fields.fullName = extractPattern(text, /Name:\s*([A-Z\s]+)/i);
      fields.idNumber = extractPattern(text, /ID(?:\s*Number)?:\s*(\d{13})/i);
      break;
  }

  return fields;
}

/**
 * Extract pattern from text using regex
 */
function extractPattern(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Perform document quality checks
 */
async function performQualityCheck(
  imageData: string,
  text: string
): Promise<QualityCheck> {
  const issues: string[] = [];

  // Check if document is readable (enough text extracted)
  const isReadable = text.length > 50;
  if (!isReadable) {
    issues.push('Document is not readable or text extraction failed');
  }

  // Check completeness (has required fields)
  const isComplete = text.includes('ID') || text.includes('Name') || text.includes('Date');
  if (!isComplete) {
    issues.push('Document appears incomplete or missing required fields');
  }

  // Check for watermarks (simulation)
  const hasWatermark = Math.random() > 0.9; // 10% chance in simulation
  if (hasWatermark) {
    issues.push('Document contains watermark or "COPY" marking');
  }

  // Check if document is expired
  const expiryMatch = text.match(/Expir(?:es|y):\s*(\d{2}\s*\w+\s*\d{4})/i);
  const isExpired = expiryMatch ? checkIfExpired(expiryMatch[1]) : false;
  if (isExpired) {
    issues.push('Document has expired');
  }

  // Determine resolution (based on image data length as proxy)
  let resolution: 'low' | 'medium' | 'high' = 'medium';
  if (imageData.length < 50000) {
    resolution = 'low';
    issues.push('Image resolution is low, may affect quality');
  } else if (imageData.length > 200000) {
    resolution = 'high';
  }

  return {
    isReadable,
    isComplete,
    hasWatermark,
    isExpired,
    resolution,
    issues,
  };
}

/**
 * Check if document is expired
 */
function checkIfExpired(expiryDateStr: string): boolean {
  try {
    const expiryDate = new Date(expiryDateStr);
    return expiryDate < new Date();
  } catch {
    return false;
  }
}

/**
 * Detect signatures in document
 * In production: Use computer vision models or signature detection APIs
 */
async function detectSignatures(_imageData: string): Promise<SignatureDetection[]> {
  // Simulate signature detection
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 80% chance of finding a signature in simulation
  if (Math.random() > 0.2) {
    return [
      {
        found: true,
        location: { x: 100, y: 500, width: 200, height: 80 },
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      },
    ];
  }

  return [];
}

/**
 * Determine if document requires supervisor review
 */
function determineReviewRequirement(
  quality: QualityCheck,
  signatures: SignatureDetection[],
  fields: ExtractedFields,
  documentType: string
): { requiresReview: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let requiresReview = false;

  // Quality issues trigger review
  if (quality.issues.length > 0) {
    requiresReview = true;
    reasons.push(...quality.issues);
  }

  // Missing signature on documents that require it
  const requiresSignature = ['police-clearance', 'popia-consent', 'bank-confirmation'];
  if (requiresSignature.includes(documentType) && signatures.length === 0) {
    requiresReview = true;
    reasons.push('Missing required signature');
  }

  // Low signature confidence
  if (signatures.length > 0 && signatures[0].confidence < 0.7) {
    requiresReview = true;
    reasons.push('Signature detection confidence is low');
  }

  // Missing critical fields
  const criticalFields = ['fullName', 'idNumber'];
  const missingFields = criticalFields.filter((field) => !fields[field]);
  if (missingFields.length > 0) {
    requiresReview = true;
    reasons.push(`Missing critical fields: ${missingFields.join(', ')}`);
  }

  // Expired documents always require review
  if (quality.isExpired) {
    requiresReview = true;
  }

  return { requiresReview, reasons };
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(
  quality: QualityCheck,
  signatures: SignatureDetection[]
): number {
  let score = 1.0;

  // Reduce score for quality issues
  if (!quality.isReadable) score -= 0.3;
  if (!quality.isComplete) score -= 0.2;
  if (quality.hasWatermark) score -= 0.15;
  if (quality.isExpired) score -= 0.2;
  if (quality.resolution === 'low') score -= 0.1;

  // Factor in signature confidence
  if (signatures.length > 0) {
    const avgSignatureConfidence =
      signatures.reduce((sum, sig) => sum + sig.confidence, 0) / signatures.length;
    score = (score + avgSignatureConfidence) / 2;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Store OCR result in database
 */
async function storeOCRResult(documentId: string, result: OCRResult): Promise<void> {
  const doc = await db.documents.get(documentId);
  if (!doc) {
    throw new Error(`Document ${documentId} not found`);
  }

  await db.documents.update(documentId, {
    ocrResult: result,
    ocrProcessedAt: new Date().toISOString(),
    needsReview: result.requiresReview,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Cross-check extracted data with participant profile
 */
export async function crossCheckExtractedData(
  participant: Participant,
  extractedFields: ExtractedFields
): Promise<{ matches: boolean; discrepancies: string[] }> {
  const discrepancies: string[] = [];

  // Check ID number
  if (extractedFields.idNumber && participant.idNumber !== extractedFields.idNumber) {
    discrepancies.push(
      `ID number mismatch: Profile has ${participant.idNumber}, document has ${extractedFields.idNumber}`
    );
  }

  // Check name (fuzzy match)
  if (extractedFields.fullName) {
    const profileName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
    const extractedName = extractedFields.fullName.toLowerCase();
    const similarity = calculateStringSimilarity(profileName, extractedName);

    if (similarity < 0.8) {
      discrepancies.push(
        `Name mismatch: Profile has "${profileName}", document has "${extractedName}"`
      );
    }
  }

  return {
    matches: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Trigger supervisor review for document
 */
export async function triggerSupervisorReview(
  documentId: string,
  reasons: string[]
): Promise<void> {
  await db.documents.update(documentId, {
    status: 'PENDING_REVIEW',
    reviewReasons: reasons,
    reviewRequestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create notification for supervisors
  const supervisors = await db.users.where('role').equals('supervisor').toArray();

  for (const supervisor of supervisors) {
    await db.notifications.add({
      id: crypto.randomUUID(),
      userId: supervisor.id,
      type: 'document-pending',
      title: 'Document Review Required',
      message: `A document requires your review due to: ${reasons.join(', ')}`,
      metadata: { documentId },
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}
