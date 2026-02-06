/**
 * Site/Location Management Tab
 */
import { useState } from 'react';
import { GlassCard, Button, Input, Badge } from '@/components/ui';

interface Site {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  status: 'active' | 'inactive';
}

export function SiteManagementTab() {
  const [sites, setSites] = useState<Site[]>([
    { id: '1', name: 'Downtown Office', address: '123 Main St', contactPerson: 'John Doe', contactPhone: '+27821234567', status: 'active' },
    { id: '2', name: 'Warehouse Facility', address: '456 Industrial Ave', contactPerson: 'Jane Smith', contactPhone: '+27821234568', status: 'active' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', address: '', contactPerson: '', contactPhone: '',
  });

  const handleAddSite = () => {
    const newSite: Site = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
    };
    setSites([...sites, newSite]);
    setShowModal(false);
    setFormData({ name: '', address: '', contactPerson: '', contactPhone: '' });
    alert('Site added successfully!');
  };

  const handleDeleteSite = (id: string) => {
    if (!confirm('Delete this site?')) return;
    setSites(sites.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Site & Location Management</h2>
        <Button onClick={() => setShowModal(true)} variant="primary">
          <svg className="w-5 h-5 mr-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </Button>
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        {sites.map((site) => (
          <GlassCard key={site.id}>
            <div className="space-y-12">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-text-primary">{site.name}</h3>
                <Badge variant={site.status === 'active' ? 'success' : 'default'}>
                  {site.status}
                </Badge>
              </div>
              <div className="space-y-8 text-sm text-text-secondary">
                <div className="flex items-center gap-8">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{site.address}</span>
                </div>
                <div className="flex items-center gap-8">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{site.contactPerson}</span>
                </div>
                <div className="flex items-center gap-8">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{site.contactPhone}</span>
                </div>
              </div>
              <Button onClick={() => handleDeleteSite(site.id)} variant="secondary" className="bg-status-error/20 hover:bg-status-error/30 text-status-error border-status-error/30" size="sm">Delete</Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-lg w-full">
            <div className="space-y-24">
              <h2 className="text-2xl font-bold text-text-primary">Add New Site</h2>
              <Input label="Site Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Downtown Office" />
              <Input label="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Main Street" />
              <Input label="Contact Person" value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} placeholder="John Doe" />
              <Input label="Contact Phone" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} placeholder="+27821234567" />
              <div className="flex gap-12">
                <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleAddSite} variant="primary" className="flex-1" disabled={!formData.name || !formData.address}>Add Site</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
