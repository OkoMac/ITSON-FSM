import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MessageCircle, CheckCircle, Clock, XCircle, RefreshCw, Send } from 'lucide-react';
import { whatsappBot, type WhatsAppSession, type WhatsAppMessage } from '@/services/integrations/whatsappBot';

export function WhatsAppOnboardingPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [botConfigured, setBotConfigured] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadSessions();
    // Check if bot is configured
    checkBotConfiguration();
  }, []);

  const checkBotConfiguration = () => {
    // In production, check if WhatsApp API credentials are configured
    // For now, we'll initialize with mock provider
    whatsappBot.initialize({
      apiKey: 'mock_api_key',
      apiSecret: 'mock_secret',
      phoneNumberId: 'mock_phone_id',
      webhookUrl: 'https://mock-webhook.example.com',
      provider: 'mock',
    });
    setBotConfigured(true);
  };

  const loadSessions = () => {
    const allSessions = whatsappBot.getAllSessions();
    setSessions(allSessions.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ));
  };

  const handleTestMessage = async () => {
    if (!testPhoneNumber || !testMessage) return;

    const message: WhatsAppMessage = {
      id: crypto.randomUUID(),
      from: testPhoneNumber,
      to: 'bot',
      body: testMessage,
      timestamp: new Date().toISOString(),
      status: 'received',
    };

    await whatsappBot.handleIncomingMessage(message);
    setTestMessage('');
    loadSessions();

    // Refresh selected session if it's the one we just messaged
    if (selectedSession?.phoneNumber === testPhoneNumber) {
      const updated = whatsappBot.getSession(testPhoneNumber);
      if (updated) setSelectedSession(updated);
    }
  };

  const getStateColor = (state: WhatsAppSession['state']) => {
    switch (state) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'AWAITING_DOCUMENT': return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_CONFIRMATION': return 'bg-purple-100 text-purple-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateIcon = (state: WhatsAppSession['state']) => {
    switch (state) {
      case 'VERIFIED': return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-16 h-16 text-blue-600" />;
      case 'AWAITING_DOCUMENT': return <Clock className="w-16 h-16 text-yellow-600" />;
      case 'AWAITING_CONFIRMATION': return <Clock className="w-16 h-16 text-purple-600" />;
      case 'FAILED': return <XCircle className="w-16 h-16 text-red-600" />;
      default: return <MessageCircle className="w-16 h-16 text-gray-600" />;
    }
  };

  const stats = {
    total: sessions.length,
    inProgress: sessions.filter(s => s.state === 'IN_PROGRESS' || s.state === 'AWAITING_DOCUMENT' || s.state === 'AWAITING_CONFIRMATION').length,
    verified: sessions.filter(s => s.state === 'VERIFIED').length,
    failed: sessions.filter(s => s.state === 'FAILED').length,
  };

  return (
    <div className="content-wrapper">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">WhatsApp Onboarding</h1>
          <p className="text-gray-600 mt-4">Monitor and manage WhatsApp-based onboarding sessions</p>
        </div>
        <Button onClick={loadSessions}>
          <RefreshCw className="w-16 h-16 mr-8" />
          Refresh
        </Button>
      </div>

      {/* Configuration Status */}
      {!botConfigured && (
        <Card className="p-24 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-12">
            <MessageCircle className="w-24 h-24 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-8">WhatsApp Bot Not Configured</h3>
              <p className="text-sm text-yellow-700 mb-12">
                Configure your WhatsApp Business API credentials to enable WhatsApp onboarding.
              </p>
              <Button variant="secondary" onClick={checkBotConfiguration}>
                Configure Bot
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid-4">
        <Card className="p-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-4">Total Sessions</p>
              <p className="heading-1">{stats.total}</p>
            </div>
            <MessageCircle className="w-24 h-24 text-blue-600" />
          </div>
        </Card>

        <Card className="p-16 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-4">In Progress</p>
              <p className="text-24 font-bold text-blue-900">{stats.inProgress}</p>
            </div>
            <Clock className="w-24 h-24 text-blue-600" />
          </div>
        </Card>

        <Card className="p-16 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-4">Verified</p>
              <p className="text-24 font-bold text-green-900">{stats.verified}</p>
            </div>
            <CheckCircle className="w-24 h-24 text-green-600" />
          </div>
        </Card>

        <Card className="p-16 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 mb-4">Failed</p>
              <p className="text-24 font-bold text-red-900">{stats.failed}</p>
            </div>
            <XCircle className="w-24 h-24 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Test Mode */}
      {botConfigured && (
        <Card className="card-content">
          <div className="flex items-center justify-between mb-16">
            <h3 className="font-medium">Test Mode</h3>
            <label className="flex items-center space-x-8">
              <span className="text-sm text-gray-600">Enable Testing</span>
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="rounded"
              />
            </label>
          </div>

          {testMode && (
            <div className="space-y-16">
              <div className="grid grid-cols-2 gap-16">
                <div>
                  <label className="block text-sm font-medium mb-8">Phone Number</label>
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+27821234567"
                    className="w-full px-12 py-8 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-8">Message</label>
                  <div className="flex space-x-8">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Type message (e.g., START)"
                      className="flex-1 px-12 py-8 border rounded-md"
                      onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                    />
                    <Button onClick={handleTestMessage}>
                      <Send className="w-16 h-16" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Test the WhatsApp bot by simulating incoming messages. Try: START, CONFIRM, DONE, etc.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Sessions Table */}
        <Card className="card-content">
          <h3 className="font-medium mb-16">Active Sessions</h3>
          <div className="space-y-12">
            {sessions.length === 0 ? (
              <div className="text-center py-32">
                <MessageCircle className="w-48 h-48 text-gray-400 mx-auto mb-16" />
                <p className="text-gray-600">No WhatsApp sessions yet</p>
                <p className="text-sm text-gray-500 mt-4">
                  Users can start onboarding by sending "START" to your WhatsApp bot
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-16 rounded-lg border cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center space-x-12">
                      {getStateIcon(session.state)}
                      <div>
                        <p className="font-medium">{session.phoneNumber}</p>
                        {session.data.fullName && (
                          <p className="text-sm text-gray-600">{session.data.fullName}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-8 py-4 rounded-full text-xs font-medium ${getStateColor(session.state)}`}>
                      {session.state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Step {session.currentStep}/6</span>
                    <span>Responses: {session.responseCount}/6</span>
                    <span>{new Date(session.lastMessageAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Session Details */}
        <Card className="card-content">
          <h3 className="font-medium mb-16">Session Details</h3>
          {selectedSession ? (
            <div className="space-y-16">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-4">Phone Number</label>
                <p className="text-sm">{selectedSession.phoneNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-4">State</label>
                <span className={`inline-flex px-8 py-4 rounded-full text-xs font-medium ${getStateColor(selectedSession.state)}`}>
                  {selectedSession.state}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-4">Progress</label>
                <div className="flex items-center space-x-8">
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-600 h-8 rounded-full transition-all"
                      style={{ width: `${(selectedSession.currentStep / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{selectedSession.currentStep}/6</span>
                </div>
              </div>

              {selectedSession.data.fullName && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">Full Name</label>
                  <p className="text-sm">{selectedSession.data.fullName}</p>
                </div>
              )}

              {selectedSession.data.saIdNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">SA ID Number</label>
                  <p className="text-sm font-mono">{selectedSession.data.saIdNumber}</p>
                </div>
              )}

              {selectedSession.data.popiaConsent && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">POPIA Consent</label>
                  <span className="inline-flex px-8 py-4 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Consent Given
                  </span>
                </div>
              )}

              {selectedSession.data.documents && Object.keys(selectedSession.data.documents).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">Documents</label>
                  <div className="space-y-4">
                    {Object.keys(selectedSession.data.documents).map((docType) => (
                      <div key={docType} className="flex items-center space-x-8 text-sm">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                        <span className="capitalize">{docType.replace(/-/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.data.bankAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">Bank Details</label>
                  <div className="text-sm space-y-4">
                    <p>Account: {selectedSession.data.bankAccount}</p>
                    <p>Branch: {selectedSession.data.branchCode}</p>
                  </div>
                </div>
              )}

              {selectedSession.data.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-4">Address</label>
                  <p className="text-sm">{selectedSession.data.address}</p>
                </div>
              )}

              <div className="pt-16 border-t">
                <div className="text-xs text-gray-500 space-y-4">
                  <p>Created: {new Date(selectedSession.createdAt).toLocaleString()}</p>
                  <p>Last Message: {new Date(selectedSession.lastMessageAt).toLocaleString()}</p>
                  <p>Session ID: {selectedSession.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-32 text-gray-500">
              Select a session to view details
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default WhatsAppOnboardingPage;
