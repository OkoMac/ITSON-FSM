import { useState } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { bulkCreateParticipants, verifyIDNumber, type BulkUploadRecord } from '@/services/admin/bulkOperations';
import { useAuth } from '@/contexts/AuthContext';

export function BulkImportPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<BulkUploadRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const csv = `idNumber,firstName,lastName,email,phoneNumber
9001015800081,John,Doe,john.doe@example.com,+27123456789
8505205800082,Jane,Smith,jane.smith@example.com,+27987654321`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_import_template.csv';
    a.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
    }
  };

  const parseCSV = (text: string): BulkUploadRecord[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const record: any = { row: index + 2, status: 'PENDING' };

      headers.forEach((header, i) => {
        record[header] = values[i] || '';
      });

      return record as BulkUploadRecord;
    });
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const text = await file.text();
      const records = parseCSV(text);

      // Validate ID numbers
      const validatedRecords = records.map(record => {
        const idCheck = verifyIDNumber(record.idNumber);
        if (!idCheck.valid) {
          return {
            ...record,
            status: 'FAILED' as const,
            error: idCheck.issues.join(', '),
          };
        }
        return record;
      });

      // Process only valid records
      const validRecords = validatedRecords.filter(r => r.status === 'PENDING');
      const processedRecords = validRecords.length > 0
        ? await bulkCreateParticipants(validRecords, user.id)
        : [];

      // Combine results
      const finalResults = validatedRecords.map(record => {
        if (record.status === 'FAILED') return record;
        return processedRecords.find(r => r.idNumber === record.idNumber) || record;
      });

      setResults(finalResults);
    } catch (error) {
      console.error('Bulk import failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Bulk Participant Import</h1>
          <p className="text-gray-600 mt-4">Import multiple participants from CSV file</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-16 h-16 mr-8" />
          Download Template
        </Button>
      </div>

      <Card className="p-24">
        <div className="space-y-20">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-32 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center space-y-12"
            >
              <Upload className="w-48 h-48 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  File must contain: idNumber, firstName, lastName, email, phoneNumber
                </p>
              </div>
            </label>
          </div>

          {file && results.length === 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'Processing...' : 'Upload and Process'}
            </Button>
          )}

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="space-y-16 border-t pt-20">
              <div className="grid grid-cols-3 gap-16">
                <Card className="p-16 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Records</p>
                      <p className="text-24 font-bold text-blue-900">{results.length}</p>
                    </div>
                    <AlertCircle className="w-32 h-32 text-blue-600 opacity-20" />
                  </div>
                </Card>

                <Card className="p-16 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Successful</p>
                      <p className="text-24 font-bold text-green-900">{successCount}</p>
                    </div>
                    <CheckCircle className="w-32 h-32 text-green-600 opacity-20" />
                  </div>
                </Card>

                <Card className="p-16 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Failed</p>
                      <p className="text-24 font-bold text-red-900">{failedCount}</p>
                    </div>
                    <XCircle className="w-32 h-32 text-red-600 opacity-20" />
                  </div>
                </Card>
              </div>

              {/* Detailed Results */}
              <Card className="p-16">
                <h3 className="font-medium mb-16">Import Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-12 py-8 text-left">Row</th>
                        <th className="px-12 py-8 text-left">ID Number</th>
                        <th className="px-12 py-8 text-left">Name</th>
                        <th className="px-12 py-8 text-left">Email</th>
                        <th className="px-12 py-8 text-left">Status</th>
                        <th className="px-12 py-8 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.map((record) => (
                        <tr key={record.row} className="hover:bg-gray-50">
                          <td className="px-12 py-12">{record.row}</td>
                          <td className="px-12 py-12 font-mono text-xs">{record.idNumber}</td>
                          <td className="px-12 py-12">{record.firstName} {record.lastName}</td>
                          <td className="px-12 py-12 text-xs">{record.email}</td>
                          <td className="px-12 py-12">
                            {record.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center px-8 py-4 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-12 h-12 mr-4" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-8 py-4 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-12 h-12 mr-4" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-12 py-12 text-xs">
                            {record.error || record.participantId || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Button
                onClick={() => {
                  setFile(null);
                  setResults([]);
                }}
                variant="outline"
                className="w-full"
              >
                Import Another File
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
export default BulkImportPage;
