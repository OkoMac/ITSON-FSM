import React, { useState, useMemo } from 'react';
import { GlassCard, Button, Input, Badge } from '@/components/ui';
import { SiteCard } from '@/components/sites/SiteCard';
import { AddSiteModal } from '@/components/sites/AddSiteModal';
import type { Site } from '@/types';
import heroBuilding from '@/assets/images/hero-building.svg';

const SitesPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');

  // Mock sites data - replace with actual data from IndexedDB/API
  const [sites, setSites] = useState<Site[]>([
    {
      id: '1',
      name: 'Main Factory Site',
      address: '123 Industrial Road, Johannesburg, 2001',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      hostPartner: 'ABC Manufacturing',
      siteType: 'factory',
      supervisorName: 'John Supervisor',
      supervisorPhone: '+27 11 123 4567',
      supervisorEmail: 'john@abc.com',
      requiredPPE: ['Hard hat', 'Safety boots', 'Gloves'],
      safetyProtocols: 'All workers must sign in at reception. Hard hats required in all areas.',
      emergencyContacts: [
        { name: 'Emergency Services', role: 'Medical', phone: '10177' },
        { name: 'Site Manager', role: 'Management', phone: '+27 11 123 4568' },
      ],
      participantIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12'],
      maxCapacity: 30,
      status: 'active',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
    },
    {
      id: '2',
      name: 'City Office Hub',
      address: '456 Business Street, Sandton, 2196',
      coordinates: { lat: -26.1076, lng: 28.0567 },
      hostPartner: 'XYZ Enterprises',
      siteType: 'office',
      supervisorName: 'Sarah Manager',
      supervisorPhone: '+27 11 234 5678',
      supervisorEmail: 'sarah@xyz.com',
      requiredPPE: [],
      safetyProtocols: 'Standard office safety procedures apply.',
      emergencyContacts: [
        { name: 'Building Security', role: 'Security', phone: '+27 11 234 5679' },
      ],
      participantIds: ['p13', 'p14', 'p15', 'p16', 'p17'],
      maxCapacity: 20,
      status: 'active',
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T09:00:00Z',
    },
    {
      id: '3',
      name: 'Warehouse District',
      address: '789 Logistics Ave, Midrand, 1685',
      coordinates: { lat: -25.9892, lng: 28.1290 },
      hostPartner: 'LogiCo Solutions',
      siteType: 'warehouse',
      supervisorName: 'Mike Warehouse',
      supervisorPhone: '+27 11 345 6789',
      supervisorEmail: 'mike@logico.com',
      requiredPPE: ['Safety vest', 'Steel-toe boots'],
      safetyProtocols: 'Forklift awareness required. Stay in designated walkways.',
      emergencyContacts: [],
      participantIds: ['p18', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24', 'p25'],
      maxCapacity: 25,
      status: 'maintenance',
      createdAt: '2024-02-01T07:00:00Z',
      updatedAt: '2024-02-01T07:00:00Z',
    },
  ]);

  // Filter and search sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.hostPartner.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || site.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [sites, searchQuery, filterStatus]);

  const handleAddSite = (siteData: Partial<Site>) => {
    const newSite: Site = {
      ...siteData as Site,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSites([...sites, newSite]);
  };

  const handleEditSite = (siteData: Partial<Site>) => {
    setSites(
      sites.map((site) =>
        site.id === editingSite?.id
          ? { ...site, ...siteData, updatedAt: new Date().toISOString() }
          : site
      )
    );
    setEditingSite(null);
  };

  const handleViewSite = (site: Site) => {
    setSelectedSite(site);
  };

  const stats = {
    total: sites.length,
    active: sites.filter((s) => s.status === 'active').length,
    participants: sites.reduce((sum, s) => sum + (s.participantIds?.length || 0), 0),
    capacity: sites.reduce((sum, s) => sum + s.maxCapacity, 0),
  };

  if (selectedSite) {
    // Site detail view
    return (
      <div className="space-y-32 animate-fade-in">
        <div className="flex items-center gap-16">
          <button
            onClick={() => setSelectedSite(null)}
            className="p-8 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{selectedSite.name}</h1>
            <p className="text-text-secondary">{selectedSite.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <GlassCard>
            <div className="text-center">
              <p className="text-sm text-text-tertiary mb-8">Participants</p>
              <p className="text-4xl font-bold text-text-primary font-sf-mono">
                {selectedSite.participantIds?.length || 0}
              </p>
              <p className="text-sm text-text-secondary mt-4">
                / {selectedSite.maxCapacity} capacity
              </p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <p className="text-sm text-text-tertiary mb-8">Status</p>
              <Badge
                variant={
                  selectedSite.status === 'active'
                    ? 'success'
                    : selectedSite.status === 'maintenance'
                    ? 'warning'
                    : 'default'
                }
                size="lg"
              >
                {selectedSite.status}
              </Badge>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center">
              <p className="text-sm text-text-tertiary mb-8">Type</p>
              <p className="text-lg font-semibold text-text-primary capitalize">
                {selectedSite.siteType}
              </p>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-24">
            Site Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
            <div>
              <p className="text-sm text-text-tertiary mb-4">Host Partner</p>
              <p className="text-base text-text-primary">{selectedSite.hostPartner}</p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-4">Supervisor</p>
              <p className="text-base text-text-primary">{selectedSite.supervisorName}</p>
              <p className="text-sm text-text-secondary">{selectedSite.supervisorPhone}</p>
              <p className="text-sm text-text-secondary">{selectedSite.supervisorEmail}</p>
            </div>
          </div>
        </GlassCard>

        {selectedSite.requiredPPE && selectedSite.requiredPPE.length > 0 && (
          <GlassCard>
            <h2 className="text-xl font-semibold text-text-primary mb-16">
              Required PPE
            </h2>
            <div className="flex flex-wrap gap-8">
              {selectedSite.requiredPPE.map((item, idx) => (
                <Badge key={idx} variant="info">
                  {item}
                </Badge>
              ))}
            </div>
          </GlassCard>
        )}

        {selectedSite.safetyProtocols && (
          <GlassCard>
            <h2 className="text-xl font-semibold text-text-primary mb-16">
              Safety Protocols
            </h2>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {selectedSite.safetyProtocols}
            </p>
          </GlassCard>
        )}

        <div className="flex gap-12">
          <Button
            variant="secondary"
            onClick={() => {
              setEditingSite(selectedSite);
              setSelectedSite(null);
            }}
          >
            Edit Site
          </Button>
          <Button variant="ghost" onClick={() => setSelectedSite(null)}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-32 animate-fade-in">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          backgroundImage: `url(${heroBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '240px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/85 to-primary-dark/70" />
        <div className="relative z-10 p-32 md:p-40 flex flex-col md:flex-row md:items-end justify-between gap-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">Site Management</h1>
            <p className="text-lg text-white/80">Manage all programme sites and facilities</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Site
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
        <GlassCard>
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-4">Total Sites</p>
            <p className="text-3xl font-bold text-text-primary font-sf-mono">{stats.total}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-4">Active</p>
            <p className="text-3xl font-bold text-status-success font-sf-mono">{stats.active}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-4">Participants</p>
            <p className="text-3xl font-bold text-text-primary font-sf-mono">{stats.participants}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-4">Total Capacity</p>
            <p className="text-3xl font-bold text-text-primary font-sf-mono">{stats.capacity}</p>
          </div>
        </GlassCard>
      </div>

      {/* Search and Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-16">
          <div className="flex-1">
            <Input
              label="Search sites"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
          </div>
          <div className="flex gap-8">
            {(['all', 'active', 'inactive', 'maintenance'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-16 py-12 rounded-glass text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-accent-blue text-white'
                    : 'glass-button text-text-secondary hover:text-text-primary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Sites Grid */}
      {filteredSites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onView={handleViewSite}
              onEdit={(site) => {
                setEditingSite(site);
              }}
            />
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-32">
            <svg
              className="w-16 h-16 mx-auto mb-16 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-text-secondary">No sites found</p>
            <Button className="mt-16" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Site
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Add/Edit Modal */}
      <AddSiteModal
        isOpen={isAddModalOpen || !!editingSite}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSite(null);
        }}
        onSubmit={editingSite ? handleEditSite : handleAddSite}
        editingSite={editingSite}
      />
    </div>
  );
};

export default SitesPage;
