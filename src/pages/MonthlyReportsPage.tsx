import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText } from 'lucide-react';
import { generateMonthlyAttendanceSummary, type MonthlyAttendanceSummary } from '@/services/reporting/advancedReports';
import { db } from '@/utils/db';

export function MonthlyReportsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadParticipants();
    const now = new Date();
    const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(monthStr);
  }, []);

  const loadParticipants = async () => {
    const data = await db.participants.toArray();
    setParticipants(data);
  };

  const handleGenerateReport = async () => {
    if (!selectedParticipant || !selectedMonth) return;

    setLoading(true);
    try {
      const report = await generateMonthlyAttendanceSummary(selectedParticipant, selectedMonth);
      setSummary(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-24">
      <div>
        <h1 className="text-24 font-bold">Monthly Attendance Reports</h1>
        <p className="text-gray-600 mt-4">Generate detailed monthly attendance summaries</p>
      </div>

      <Card className="p-24">
        <div className="space-y-16">
          <div>
            <label className="block text-sm font-medium mb-8">Participant</label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full px-12 py-8 border rounded-md"
            >
              <option value="">Select a participant</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} - {p.idNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-8">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-12 py-8 border rounded-md"
            />
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={!selectedParticipant || !selectedMonth || loading}
            className="w-full"
          >
            <FileText className="w-16 h-16 mr-8" />
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </Card>

      {summary && (
        <Card className="p-24">
          <div className="space-y-20">
            <div className="flex items-center justify-between border-b pb-16">
              <div>
                <h3 className="font-medium text-lg">Monthly Attendance Summary</h3>
                <p className="text-sm text-gray-600 mt-4">
                  {summary.participantName} - {summary.month}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Download className="w-16 h-16 mr-8" />
                Download PDF
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-16">
              <div className="bg-gray-50 rounded-lg p-16">
                <p className="text-sm text-gray-600 mb-4">Attendance Rate</p>
                <p className="text-24 font-bold text-green-600">{summary.attendanceRate.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-16">
                <p className="text-sm text-gray-600 mb-4">Days Present</p>
                <p className="text-24 font-bold">{summary.daysPresent} / {summary.totalDays}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-16">
                <p className="text-sm text-gray-600 mb-4">Total Hours</p>
                <p className="text-24 font-bold">{summary.totalHoursWorked.toFixed(1)}h</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-24 gap-y-12 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Days Absent:</span>
                <span className="font-medium">{summary.daysAbsent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late Arrivals:</span>
                <span className="font-medium">{summary.lateArrivals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Early Departures:</span>
                <span className="font-medium">{summary.earlyDepartures}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Hours/Day:</span>
                <span className="font-medium">
                  {summary.daysPresent > 0 ? (summary.totalHoursWorked / summary.daysPresent).toFixed(1) : 0}h
                </span>
              </div>
            </div>

            <div className="border-t pt-16">
              <p className="text-sm font-medium mb-8">Overall Performance</p>
              <div className="flex items-center space-x-12">
                <div className="flex-1 bg-gray-200 rounded-full h-8">
                  <div
                    className={'h-8 rounded-full ' + (
                      summary.attendanceRate >= 90 ? 'bg-green-600' :
                      summary.attendanceRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                    )}
                    style={{ width: summary.attendanceRate + '%' }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {summary.attendanceRate >= 90 ? 'Excellent' :
                   summary.attendanceRate >= 75 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
