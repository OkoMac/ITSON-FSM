import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { createIncidentReport, type IncidentReport } from '@/services/operations/workSchedules';
import { db } from '@/utils/db';
import { useAuth } from '@/contexts/AuthContext';

export function IncidentReportPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    siteId: '',
    participantId: '',
    type: 'accident' as 'accident' | 'near-miss' | 'property-damage' | 'safety-violation',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
    immediateAction: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [participantsData, sitesData] = await Promise.all([
      db.participants.toArray(),
      db.sites.toArray(),
    ]);
    setParticipants(participantsData);
    setSites(sitesData);
    loadIncidents();
  };

  const loadIncidents = () => {
    const items: IncidentReport[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('incident_')) {
        const item = JSON.parse(localStorage.getItem(key)!);
        items.push(item);
      }
    }
    items.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    setIncidents(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await createIncidentReport({
      ...formData,
      reportedBy: user.id,
    });

    setFormData({
      siteId: '',
      participantId: '',
      type: 'accident',
      severity: 'medium',
      description: '',
      immediateAction: '',
    });

    loadIncidents();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <AlertTriangle className="w-16 h-16 text-red-600" />;
      case 'near-miss': return <AlertTriangle className="w-16 h-16 text-orange-600" />;
      case 'property-damage': return <AlertTriangle className="w-16 h-16 text-yellow-600" />;
      case 'safety-violation': return <AlertTriangle className="w-16 h-16 text-purple-600" />;
      default: return <AlertTriangle className="w-16 h-16 text-gray-600" />;
    }
  };

  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
  const pendingIncidents = incidents.filter(i => i.status === 'open').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div>
        <h1 className="text-24 font-bold">Incident Reports</h1>
        <p className="text-gray-600 mt-4">Report and track workplace incidents</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-16">
        <Card className="p-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-24 font-bold">{incidents.length}</p>
            </div>
            <AlertTriangle className="w-32 h-32 text-gray-400" />
          </div>
        </Card>

        <Card className="p-16 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Critical</p>
              <p className="text-24 font-bold text-red-900">{criticalIncidents}</p>
            </div>
            <AlertTriangle className="w-32 h-32 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Pending</p>
              <p className="text-24 font-bold text-orange-900">{pendingIncidents}</p>
            </div>
            <Clock className="w-32 h-32 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Resolved</p>
              <p className="text-24 font-bold text-green-900">{resolvedIncidents}</p>
            </div>
            <CheckCircle className="w-32 h-32 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Report Form */}
      <Card className="p-24">
        <h3 className="font-medium mb-16">Report New Incident</h3>
        <form onSubmit={handleSubmit} className="space-y-16">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <label className="block text-sm font-medium mb-8">Site</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
                required
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Participant Involved</label>
              <select
                value={formData.participantId}
                onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                className="w-full px-12 py-8 border rounded-md"
              >
                <option value="">None / Not applicable</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Incident Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-12 py-8 border rounded-md"
                required
              >
                <option value="accident">Accident</option>
                <option value="near-miss">Near Miss</option>
                <option value="property-damage">Property Damage</option>
                <option value="safety-violation">Safety Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-8">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-12 py-8 border rounded-md"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-8">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-12 py-8 border rounded-md"
              rows={4}
              placeholder="Describe what happened..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-8">Immediate Action Taken</label>
            <textarea
              value={formData.immediateAction}
              onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
              className="w-full px-12 py-8 border rounded-md"
              rows={3}
              placeholder="What actions were taken immediately?"
              required
            />
          </div>

          <Button type="submit" className="w-full">Submit Incident Report</Button>
        </form>
      </Card>

      {/* Incidents List */}
      <Card className="p-24">
        <h3 className="font-medium mb-16">Recent Incidents</h3>
        <div className="space-y-12">
          {incidents.map((incident) => {
            const site = sites.find(s => s.id === incident.siteId);
            const participant = incident.participantId
              ? participants.find(p => p.id === incident.participantId)
              : null;

            return (
              <div key={incident.id} className="border rounded-lg p-16 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-12">
                  <div className="flex items-start space-x-12">
                    {getTypeIcon(incident.type)}
                    <div>
                      <div className="flex items-center space-x-8">
                        <p className="font-medium capitalize">{incident.type.replace('-', ' ')}</p>
                        <span className={`px-8 py-4 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">{site?.name}</p>
                      {participant && (
                        <p className="text-sm text-gray-600">Involved: {participant.fullName}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(incident.reportedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm mb-8">{incident.description}</p>

                {incident.immediateAction && (
                  <div className="bg-blue-50 rounded-md p-12 mt-12">
                    <p className="text-xs font-medium text-blue-900 mb-4">Immediate Action</p>
                    <p className="text-sm text-blue-800">{incident.immediateAction}</p>
                  </div>
                )}
              </div>
            );
          })}

          {incidents.length === 0 && (
            <p className="text-center text-gray-500 py-32">No incidents reported</p>
          )}
        </div>
      </Card>
    </div>
  );
}
export default IncidentReportPage;
