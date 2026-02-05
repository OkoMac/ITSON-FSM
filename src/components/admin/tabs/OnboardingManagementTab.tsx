/**
 * Onboarding Management Tab
 * Send invites and manage allowed contacts for onboarding
 */
import { useState } from 'react';
import { GlassCard, Button, Input } from '@/components/ui';

interface AllowedContact {
  id: string;
  email: string;
  phone: string;
  name: string;
  method: 'app' | 'whatsapp' | 'both';
  status: 'pending' | 'invited' | 'completed';
  invitedAt?: string;
}

export function OnboardingManagementTab() {
  const [allowedContacts, setAllowedContacts] = useState<AllowedContact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    method: 'both' as AllowedContact['method'],
  });

  const handleAddContact = () => {
    const newContact: AllowedContact = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
    };
    setAllowedContacts([...allowedContacts, newContact]);
    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', method: 'both' });
    alert('Contact added to allowed list!');
  };

  const handleBulkAdd = () => {
    const emails = bulkEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    const phones = bulkPhones.split(/[,\n]/).map(p => p.trim()).filter(p => p);

    const newContacts: AllowedContact[] = [];

    emails.forEach((email, index) => {
      newContacts.push({
        id: Date.now().toString() + index,
        name: `Contact ${index + 1}`,
        email,
        phone: phones[index] || '',
        method: 'app',
        status: 'pending',
      });
    });

    phones.forEach((phone, index) => {
      if (!emails[index]) {
        newContacts.push({
          id: Date.now().toString() + 'p' + index,
          name: `WhatsApp Contact ${index + 1}`,
          email: '',
          phone,
          method: 'whatsapp',
          status: 'pending',
        });
      }
    });

    setAllowedContacts([...allowedContacts, ...newContacts]);
    setShowBulkModal(false);
    setBulkEmails('');
    setBulkPhones('');
    alert(`Added ${newContacts.length} contacts to allowed list!`);
  };

  const handleSendInvite = (contactId: string) => {
    const contact = allowedContacts.find(c => c.id === contactId);
    if (!contact) return;

    const inviteLink = `${window.location.origin}/onboarding?invite=${contactId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(inviteLink);

    // Update status
    setAllowedContacts(allowedContacts.map(c =>
      c.id === contactId
        ? { ...c, status: 'invited' as const, invitedAt: new Date().toISOString() }
        : c
    ));

    alert(`Invite link copied to clipboard!\n\n${inviteLink}\n\nShare this link with: ${contact.name || contact.email || contact.phone}`);
  };

  const handleSendAllInvites = () => {
    const pendingContacts = allowedContacts.filter(c => c.status === 'pending');

    if (pendingContacts.length === 0) {
      alert('No pending contacts to invite');
      return;
    }

    if (!confirm(`Send invites to ${pendingContacts.length} contacts?`)) return;

    const now = new Date().toISOString();
    setAllowedContacts(allowedContacts.map(c =>
      c.status === 'pending'
        ? { ...c, status: 'invited' as const, invitedAt: now }
        : c
    ));

    const inviteLinks = pendingContacts.map(c =>
      `${c.name || c.email || c.phone}: ${window.location.origin}/onboarding?invite=${c.id}`
    ).join('\n\n');

    alert(`Invites sent to ${pendingContacts.length} contacts!\n\nInvite links (copy and send):\n\n${inviteLinks}`);
  };

  const handleDeleteContact = (id: string) => {
    if (!confirm('Remove this contact from allowed list?')) return;
    setAllowedContacts(allowedContacts.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-24">
      <div className="flex justify-between items-center flex-wrap gap-12">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Onboarding Management</h2>
          <p className="text-text-secondary text-sm mt-4">Manage allowed contacts and send onboarding invites</p>
        </div>
        <div className="flex gap-12">
          <Button onClick={() => setShowBulkModal(true)} variant="secondary">
            📋 Bulk Add
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary">
            ➕ Add Contact
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <GlassCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary mb-4">
              {allowedContacts.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-text-secondary">Pending Invites</div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-blue mb-4">
              {allowedContacts.filter(c => c.status === 'invited').length}
            </div>
            <div className="text-sm text-text-secondary">Invited</div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-status-success mb-4">
              {allowedContacts.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-text-secondary">Completed</div>
          </div>
        </GlassCard>
      </div>

      {allowedContacts.filter(c => c.status === 'pending').length > 0 && (
        <Button onClick={handleSendAllInvites} variant="primary" size="sm">
          📧 Send All Pending Invites ({allowedContacts.filter(c => c.status === 'pending').length})
        </Button>
      )}

      {/* Contacts List */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Name</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Email</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Phone</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Method</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Status</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allowedContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-16 px-16 text-text-primary">{contact.name}</td>
                  <td className="py-16 px-16 text-text-secondary">{contact.email || '-'}</td>
                  <td className="py-16 px-16 text-text-secondary font-sf-mono">{contact.phone || '-'}</td>
                  <td className="py-16 px-16">
                    <span className="px-8 py-4 rounded-full text-xs bg-white/10">
                      {contact.method}
                    </span>
                  </td>
                  <td className="py-16 px-16">
                    <span className={`px-8 py-4 rounded-full text-xs ${
                      contact.status === 'completed' ? 'bg-status-success/20 text-status-success' :
                      contact.status === 'invited' ? 'bg-accent-blue/20 text-accent-blue' :
                      'bg-white/10 text-text-secondary'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="py-16 px-16">
                    <div className="flex gap-8">
                      {contact.status === 'pending' && (
                        <Button onClick={() => handleSendInvite(contact.id)} variant="primary" size="sm">
                          Send Invite
                        </Button>
                      )}
                      {contact.status === 'invited' && (
                        <Button onClick={() => handleSendInvite(contact.id)} variant="secondary" size="sm">
                          Resend
                        </Button>
                      )}
                      <Button onClick={() => handleDeleteContact(contact.id)} variant="secondary" className="bg-status-error/20 hover:bg-status-error/30 text-status-error border-status-error/30" size="sm">
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allowedContacts.length === 0 && (
            <div className="py-64 text-center text-text-secondary">
              No contacts yet. Add contacts to start sending invites.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add Single Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-lg w-full">
            <div className="space-y-24">
              <h2 className="text-2xl font-bold text-text-primary">Add Allowed Contact</h2>
              <Input label="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
              <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+27821234567" />
              <div className="form-group">
                <label className="form-label">Onboarding Method</label>
                <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value as AllowedContact['method']})} className="input-field">
                  <option value="app">App Only</option>
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="both">Both (Recommended)</option>
                </select>
              </div>
              <div className="flex gap-12">
                <Button onClick={() => setShowAddModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleAddContact} variant="primary" className="flex-1" disabled={!formData.email && !formData.phone}>Add Contact</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-24">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-8">Bulk Add Contacts</h2>
                <p className="text-text-secondary text-sm">Enter multiple emails and phone numbers (comma or newline separated)</p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Addresses (one per line or comma-separated)</label>
                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  className="input-field font-sf-mono"
                  rows={6}
                  placeholder="john@example.com&#10;jane@example.com&#10;worker1@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Numbers (one per line or comma-separated)</label>
                <textarea
                  value={bulkPhones}
                  onChange={(e) => setBulkPhones(e.target.value)}
                  className="input-field font-sf-mono"
                  rows={6}
                  placeholder="+27821234567&#10;+27821234568&#10;+27821234569"
                />
              </div>

              <div className="flex gap-12">
                <Button onClick={() => setShowBulkModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleBulkAdd} variant="primary" className="flex-1" disabled={!bulkEmails && !bulkPhones}>
                  Add {(bulkEmails.split(/[,\n]/).filter(e => e.trim()).length + bulkPhones.split(/[,\n]/).filter(p => p.trim()).length)} Contacts
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
