/**
 * Document Extraction Service
 *
 * Uses Docling-compatible extraction logic with OCR fallback.
 * This is a mock implementation - replace with actual Docling integration.
 *
 * COMPLIANCE: All extraction is non-destructive. Original files are preserved.
 */

import type { DocumentExtractionResult, OnboardingDocumentType } from '@/types';

// Field extraction patterns
const EXTRACTION_PATTERNS = {
  saIdNumber: /\b\d{13}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phoneNumber: /\b(?:\+27|0)[1-9]\d{8,9}\b/g,
  dateOfBirth: /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g,
  accountNumber: /\b\d{10,16}\b/g,
  branchCode: /\b\d{6}\b/g,
};

// Known keywords for document type detection
const DOCUMENT_KEYWORDS = {
  'certified-sa-id': ['identity document', 'republic of south africa', 'id number', 'certified copy'],
  'police-affidavit': ['south african police service', 'affidavit', 'commissioner of oaths'],
  'proof-of-bank-account': ['bank statement', 'account number', 'branch code', 'balance'],
  'proof-of-address': ['municipal', 'utility bill', 'proof of residence', 'address'],
  'application-form': ['application', 'applicant', 'employment', 'programme'],
  'cv': ['curriculum vitae', 'cv', 'experience', 'education', 'skills'],
  'popia-consent': ['popia', 'consent', 'personal information', 'data protection'],
};

/**
 * Extract data from document file
 *
 * @param file - File to extract from
 * @param expectedType - Expected document type for validation
 * @returns Extraction result with fields and confidence scores
 */
export async function extractDocumentData(
  file: File,
  expectedType: OnboardingDocumentType
): Promise<DocumentExtractionResult> {
  const startTime = Date.now();

  try {
    // Step 1: Read file content
    const rawText = await extractText(file);

    // Step 2: Extract structured fields
    const extractedFields = extractStructuredFields(rawText, expectedType);

    // Step 3: Calculate confidence scores
    const confidenceScores = calculateConfidenceScores(extractedFields, rawText, expectedType);

    // Step 4: Generate flags/warnings
    const flags = generateValidationFlags(extractedFields, confidenceScores, expectedType);

    const processingTimeMs = Date.now() - startTime;

    return {
      extractedFields,
      confidenceScores,
      flags,
      pageCount: 1, // Mock - in production, extract from PDF
      rawText,
      processingTimeMs,
    };
  } catch (error) {
    throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from file (supports PDF, images, docs)
 */
async function extractText(file: File): Promise<string> {
  const mimeType = file.type;

  // For images, we'd use OCR (Tesseract.js or similar)
  if (mimeType.startsWith('image/')) {
    // Mock OCR - in production, use actual OCR library
    return `[OCR EXTRACTED TEXT FROM ${file.name}]\nSample extracted text for testing...`;
  }

  // For PDFs, use PDF.js or similar
  if (mimeType === 'application/pdf') {
    // Mock PDF extraction - in production, use pdf.js or Docling
    return `[PDF EXTRACTED TEXT FROM ${file.name}]\nSample extracted text for testing...`;
  }

  // For text-based documents
  if (mimeType.includes('text')) {
    return await file.text();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Extract structured fields based on document type
 */
function extractStructuredFields(
  text: string,
  documentType: OnboardingDocumentType
): Array<{ fieldName: string; value: string; confidence: number }> {
  const fields: Array<{ fieldName: string; value: string; confidence: number }> = [];

  // Extract SA ID Number
  const idMatches = text.match(EXTRACTION_PATTERNS.saIdNumber);
  if (idMatches && idMatches.length > 0) {
    fields.push({
      fieldName: 'saIdNumber',
      value: idMatches[0],
      confidence: 0.9,
    });
  }

  // Extract email
  const emailMatches = text.match(EXTRACTION_PATTERNS.email);
  if (emailMatches && emailMatches.length > 0) {
    fields.push({
      fieldName: 'email',
      value: emailMatches[0],
      confidence: 0.85,
    });
  }

  // Extract phone number
  const phoneMatches = text.match(EXTRACTION_PATTERNS.phoneNumber);
  if (phoneMatches && phoneMatches.length > 0) {
    fields.push({
      fieldName: 'phoneNumber',
      value: phoneMatches[0],
      confidence: 0.8,
    });
  }

  // Extract date of birth
  const dobMatches = text.match(EXTRACTION_PATTERNS.dateOfBirth);
  if (dobMatches && dobMatches.length > 0) {
    fields.push({
      fieldName: 'dateOfBirth',
      value: dobMatches[0],
      confidence: 0.85,
    });
  }

  // Extract name (basic heuristic - in production, use NER)
  const nameMatch = text.match(/(?:name|full name)[:]\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch && nameMatch[1]) {
    fields.push({
      fieldName: 'fullName',
      value: nameMatch[1],
      confidence: 0.75,
    });
  }

  // Document-specific extractions
  switch (documentType) {
    case 'proof-of-bank-account':
      const accountMatches = text.match(EXTRACTION_PATTERNS.accountNumber);
      const branchMatches = text.match(EXTRACTION_PATTERNS.branchCode);
      if (accountMatches) {
        fields.push({
          fieldName: 'bankAccountNumber',
          value: accountMatches[0],
          confidence: 0.9,
        });
      }
      if (branchMatches) {
        fields.push({
          fieldName: 'branchCode',
          value: branchMatches[0],
          confidence: 0.85,
        });
      }
      break;

    case 'proof-of-address':
      // Extract address (simplified)
      const addressMatch = text.match(/(?:address|residential address)[:]\s*(.+?)(?:\n|$)/i);
      if (addressMatch && addressMatch[1]) {
        fields.push({
          fieldName: 'address',
          value: addressMatch[1].trim(),
          confidence: 0.7,
        });
      }
      break;

    case 'cv':
      // Extract skills, education, experience (simplified)
      const skillsMatch = text.match(/(?:skills|competencies)[:]\s*(.+?)(?:\n\n|$)/is);
      if (skillsMatch && skillsMatch[1]) {
        fields.push({
          fieldName: 'skills',
          value: skillsMatch[1].trim(),
          confidence: 0.65,
        });
      }
      break;
  }

  return fields;
}

/**
 * Calculate confidence scores for each field type
 */
function calculateConfidenceScores(
  fields: Array<{ fieldName: string; value: string; confidence: number }>,
  rawText: string,
  documentType: OnboardingDocumentType
): Record<string, number> {
  const scores: Record<string, number> = {};

  // Base confidence from extracted fields
  fields.forEach((field) => {
    scores[field.fieldName] = field.confidence;
  });

  // Document type match confidence
  const keywords = DOCUMENT_KEYWORDS[documentType] || [];
  const keywordMatches = keywords.filter((keyword) =>
    rawText.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  scores.documentTypeMatch = keywords.length > 0 ? keywordMatches / keywords.length : 0;

  // Overall confidence
  const avgFieldConfidence = fields.length > 0
    ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
    : 0;

  scores.overall = (avgFieldConfidence + scores.documentTypeMatch) / 2;

  return scores;
}

/**
 * Generate validation flags and warnings
 */
function generateValidationFlags(
  fields: Array<{ fieldName: string; value: string; confidence: number }>,
  confidenceScores: Record<string, number>,
  documentType: OnboardingDocumentType
): string[] {
  const flags: string[] = [];

  // Check overall confidence
  if (confidenceScores.overall < 0.5) {
    flags.push('LOW_CONFIDENCE_EXTRACTION');
  }

  // Check document type match
  if (confidenceScores.documentTypeMatch < 0.6) {
    flags.push('DOCUMENT_TYPE_MISMATCH');
  }

  // Check required fields for document type
  const requiredFields = getRequiredFieldsForDocumentType(documentType);
  const extractedFieldNames = fields.map((f) => f.fieldName);

  requiredFields.forEach((requiredField) => {
    if (!extractedFieldNames.includes(requiredField)) {
      flags.push(`MISSING_${requiredField.toUpperCase()}`);
    }
  });

  // Check for low-confidence fields
  fields.forEach((field) => {
    if (field.confidence < 0.6) {
      flags.push(`LOW_CONFIDENCE_${field.fieldName.toUpperCase()}`);
    }
  });

  return flags;
}

/**
 * Get required fields for each document type
 */
function getRequiredFieldsForDocumentType(documentType: OnboardingDocumentType): string[] {
  switch (documentType) {
    case 'certified-sa-id':
      return ['saIdNumber', 'fullName', 'dateOfBirth'];
    case 'proof-of-bank-account':
      return ['bankAccountNumber', 'branchCode'];
    case 'proof-of-address':
      return ['address'];
    case 'cv':
      return ['fullName', 'skills'];
    case 'application-form':
      return ['fullName', 'saIdNumber'];
    default:
      return [];
  }
}

/**
 * Validate SA ID number checksum
 */
export function validateSAIDNumber(idNumber: string): boolean {
  if (!/^\d{13}$/.test(idNumber)) {
    return false;
  }

  // Luhn algorithm for SA ID validation
  const digits = idNumber.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i];
    } else {
      const doubled = digits[i] * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

/**
 * Extract date of birth from SA ID number
 */
export function extractDOBFromSAID(idNumber: string): string | null {
  if (!validateSAIDNumber(idNumber)) {
    return null;
  }

  const year = parseInt(idNumber.substring(0, 2));
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);

  // Assume year 2000 cutoff
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  return `${fullYear}-${month}-${day}`;
}
