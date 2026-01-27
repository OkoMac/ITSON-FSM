import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { processDocument } from '@/services/ocr/documentProcessor';
import { useAuth } from '@/contexts/AuthContext';

export function DocumentUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('id_document');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!preview || !user) return;

    setProcessing(true);
    try {
      const documentId = crypto.randomUUID();
      const ocrResult = await processDocument(documentId, preview, documentType);
      setResult(ocrResult);
    } catch (error) {
      console.error('Document processing failed:', error);
      setResult({ error: error instanceof Error ? error.message : 'Processing failed' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Document Upload & OCR</h1>
          <p className="text-gray-600 mt-4">Upload and process participant documents with AI validation</p>
        </div>
      </div>

      <Card className="p-24">
        <div className="space-y-20">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-8">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-12 py-8 border rounded-md"
            >
              <option value="id_document">ID Document</option>
              <option value="bank_proof">Proof of Banking</option>
              <option value="address_proof">Proof of Address</option>
              <option value="qualification">Educational Qualification</option>
              <option value="contract">Employment Contract</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-32 text-center">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-12"
            >
              <Upload className="w-48 h-48 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-4">PNG, JPG, PDF up to 10MB</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-12">
              <h3 className="font-medium">Document Preview</h3>
              <img src={preview} alt="Document preview" className="w-full max-h-[400px] object-contain border rounded-lg" />
              <Button
                onClick={handleProcess}
                disabled={processing}
                className="w-full"
              >
                {processing ? 'Processing...' : 'Process Document with OCR'}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="space-y-16 border-t pt-20">
              <h3 className="font-medium text-lg">OCR Results</h3>

              {/* Quality Check */}
              <Card className="p-16 bg-gray-50">
                <h4 className="font-medium mb-12">Quality Assessment</h4>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Quality</span>
                    <div className="flex items-center space-x-8">
                      {result.quality.isAcceptable ? (
                        <CheckCircle className="w-16 h-16 text-green-600" />
                      ) : (
                        <XCircle className="w-16 h-16 text-red-600" />
                      )}
                      <span className={result.quality.isAcceptable ? 'text-green-600' : 'text-red-600'}>
                        {result.quality.isAcceptable ? 'Acceptable' : 'Needs Review'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence Score</span>
                    <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  {result.quality.issues.length > 0 && (
                    <div className="mt-12 p-12 bg-yellow-50 rounded-md">
                      <div className="flex items-start space-x-8">
                        <AlertTriangle className="w-16 h-16 text-yellow-600 mt-2" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Quality Issues</p>
                          <ul className="text-xs text-yellow-700 mt-4 space-y-2">
                            {result.quality.issues.map((issue: string, idx: number) => (
                              <li key={idx}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Extracted Fields */}
              <Card className="p-16 bg-gray-50">
                <h4 className="font-medium mb-12">Extracted Information</h4>
                <div className="grid grid-cols-2 gap-12">
                  {Object.entries(result.fields).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-4">
                      <span className="text-xs text-gray-500 uppercase">{key.replace(/_/g, ' ')}</span>
                      <p className="text-sm font-medium">{value || 'Not found'}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Signatures */}
              {result.signatures.length > 0 && (
                <Card className="p-16 bg-gray-50">
                  <h4 className="font-medium mb-12">Signature Detection</h4>
                  <div className="space-y-8">
                    {result.signatures.map((sig: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">Signature {idx + 1}</span>
                        <div className="flex items-center space-x-8">
                          <CheckCircle className="w-16 h-16 text-green-600" />
                          <span className="text-sm">{(sig.confidence * 100).toFixed(1)}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Supervisor Review Required */}
              {result.requiresSupervisorReview && (
                <Card className="p-16 bg-orange-50 border-orange-200">
                  <div className="flex items-start space-x-12">
                    <AlertTriangle className="w-20 h-20 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-orange-900">Supervisor Review Required</h4>
                      <p className="text-sm text-orange-700 mt-4">
                        This document requires manual review by a supervisor due to quality or validation issues.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {result?.error && (
            <Card className="p-16 bg-red-50 border-red-200">
              <div className="flex items-start space-x-12">
                <XCircle className="w-20 h-20 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Processing Error</h4>
                  <p className="text-sm text-red-700 mt-4">{result.error}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
export default DocumentUploadPage;
