/**
 * Reports Page
 *
 * M&E reporting interface with Excel/PDF/CSV export
 * IDC-aligned reporting for compliance and data analysis
 */

import React, { useState } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import { db } from '@/utils/db';
import {
  generateAttendanceReport,
  generateParticipantReport,
  generateTaskReport,
  generateComplianceReport,
  generateCSV,
  downloadCSV,
  type ExcelReportData,
} from '@/services/reporting/excelExport';
import { generatePDFReport } from '@/services/reporting/pdfExport';
import { useAuthStore } from '@/store/useAuthStore';

type ReportType = 'attendance' | 'participants' | 'tasks' | 'compliance';
type ExportFormat = 'csv' | 'excel' | 'pdf';

const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();

  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'attendance' as ReportType,
      name: 'Attendance Report',
      description: 'Check-in/out records with biometric verification',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'participants' as ReportType,
      name: 'Participants Report',
      description: 'Participant profiles and onboarding status',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: 'tasks' as ReportType,
      name: 'Task Completion Report',
      description: 'Completed tasks with quality ratings',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      id: 'compliance' as ReportType,
      name: 'Compliance Summary',
      description: 'IDC compliance metrics and POPIA status',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewData(null);

    try {
      // Load data from IndexedDB
      const [participants, attendance, tasks] = await Promise.all([
        db.participants.toArray(),
        db.attendanceRecords.toArray(),
        db.tasks.toArray(),
      ]);

      // Generate report data based on type
      let reportData: ExcelReportData;

      switch (reportType) {
        case 'attendance':
          reportData = generateAttendanceReport(
            attendance,
            participants,
            startDate,
            endDate
          );
          break;

        case 'participants':
          reportData = generateParticipantReport(participants);
          break;

        case 'tasks':
          reportData = generateTaskReport(tasks, participants, startDate, endDate);
          break;

        case 'compliance':
          reportData = generateComplianceReport(participants, attendance);
          break;

        default:
          throw new Error('Invalid report type');
      }

      setPreviewData(reportData);
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!previewData) {
      setError('Please generate a preview first');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}-report-${timestamp}`;

    try {
      switch (exportFormat) {
        case 'csv':
          const csv = generateCSV(previewData);
          downloadCSV(csv, `${filename}.csv`);
          break;

        case 'excel':
          // Note: Would require xlsx library for true Excel export
          const csvForExcel = generateCSV(previewData);
          downloadCSV(csvForExcel, `${filename}.csv`);
          setError('Excel export coming soon. Downloaded as CSV instead.');
          break;

        case 'pdf':
          generatePDFReport(
            previewData.sheetName,
            previewData,
            {
              generatedBy: user?.name || 'Admin',
              dateRange:
                reportType === 'participants' || reportType === 'compliance'
                  ? 'All time'
                  : `${startDate} to ${endDate}`,
              organizationName: 'YETOMO Platform',
            }
          );
          break;

        default:
          throw new Error('Invalid export format');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export report');
    }
  };

  return (
    <div className="space-y-32 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          M&E Reports
        </h1>
        <p className="text-text-secondary">
          Generate and export monitoring & evaluation reports
        </p>
      </div>

      {/* Report Type Selection */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-text-primary mb-24">
          Select Report Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-24 rounded-glass text-left transition-all ${
                reportType === type.id
                  ? 'bg-accent-blue/20 border-2 border-accent-blue'
                  : 'glass-card-secondary hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-16">
                <div
                  className={`p-12 rounded-glass ${
                    reportType === type.id
                      ? 'bg-accent-blue/30 text-accent-blue'
                      : 'bg-white/10 text-text-secondary'
                  }`}
                >
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text-primary mb-4">
                    {type.name}
                  </h3>
                  <p className="text-sm text-text-secondary">{type.description}</p>
                </div>
                {reportType === type.id && (
                  <svg
                    className="w-6 h-6 text-accent-blue flex-shrink-0"
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
                )}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Date Range Selection (if applicable) */}
      {(reportType === 'attendance' || reportType === 'tasks') && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-24">
            Date Range
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-8">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-16 py-12 rounded-glass bg-white/5 border border-white/10 text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-8">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-16 py-12 rounded-glass bg-white/5 border border-white/10 text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Export Format Selection */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-text-primary mb-24">
          Export Format
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <button
            onClick={() => setExportFormat('csv')}
            className={`p-24 rounded-glass text-center transition-all ${
              exportFormat === 'csv'
                ? 'bg-accent-blue/20 border-2 border-accent-blue'
                : 'glass-card-secondary hover:bg-white/10'
            }`}
          >
            <svg
              className={`w-12 h-12 mx-auto mb-12 ${
                exportFormat === 'csv' ? 'text-accent-blue' : 'text-text-secondary'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-semibold text-text-primary">CSV</span>
            <p className="text-xs text-text-tertiary mt-4">Excel compatible</p>
          </button>

          <button
            onClick={() => setExportFormat('excel')}
            className={`p-24 rounded-glass text-center transition-all ${
              exportFormat === 'excel'
                ? 'bg-accent-blue/20 border-2 border-accent-blue'
                : 'glass-card-secondary hover:bg-white/10'
            }`}
          >
            <svg
              className={`w-12 h-12 mx-auto mb-12 ${
                exportFormat === 'excel' ? 'text-accent-blue' : 'text-text-secondary'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold text-text-primary">Excel</span>
            <p className="text-xs text-text-tertiary mt-4">Multi-sheet workbook</p>
          </button>

          <button
            onClick={() => setExportFormat('pdf')}
            className={`p-24 rounded-glass text-center transition-all ${
              exportFormat === 'pdf'
                ? 'bg-accent-blue/20 border-2 border-accent-blue'
                : 'glass-card-secondary hover:bg-white/10'
            }`}
          >
            <svg
              className={`w-12 h-12 mx-auto mb-12 ${
                exportFormat === 'pdf' ? 'text-accent-blue' : 'text-text-secondary'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold text-text-primary">PDF</span>
            <p className="text-xs text-text-tertiary mt-4">Print-ready format</p>
          </button>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-16">
        <Button
          onClick={handleGeneratePreview}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-8"></div>
              Generating...
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Generate Preview
            </>
          )}
        </Button>

        <Button
          onClick={handleExport}
          variant="secondary"
          disabled={!previewData || isGenerating}
          className="flex-1"
        >
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export Report
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-16 border border-status-warning/20">
          <div className="flex gap-12">
            <svg
              className="w-5 h-5 text-status-warning flex-shrink-0"
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
            <p className="text-sm text-status-warning">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <GlassCard>
          <div className="flex items-center justify-between mb-24">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Report Preview
              </h2>
              <p className="text-sm text-text-secondary mt-4">
                {previewData.rows.length} records found
              </p>
            </div>
            <Badge variant="success">Ready to Export</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {previewData.headers.map((header, index) => (
                    <th
                      key={index}
                      className="text-left text-sm font-medium text-text-secondary py-12 px-16 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="py-12 px-16 text-sm text-text-secondary whitespace-nowrap"
                      >
                        {cell !== null && cell !== undefined ? String(cell) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {previewData.rows.length > 10 && (
              <p className="text-sm text-text-tertiary text-center py-16">
                Showing first 10 of {previewData.rows.length} records
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ReportsPage;
