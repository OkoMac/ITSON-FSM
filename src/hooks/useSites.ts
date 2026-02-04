import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Site } from '@/types';

interface UseSitesResult {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSite: (siteData: Partial<Site>) => Promise<Site>;
  updateSite: (id: string, siteData: Partial<Site>) => Promise<Site>;
  deleteSite: (id: string) => Promise<void>;
}

export const useSites = (filters?: { status?: string }): UseSitesResult => {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getSites(filters);

      // Map backend response to frontend Site type
      const mappedSites: Site[] = response.data.sites.map((site: any) => ({
        id: site.id,
        name: site.name,
        address: site.address,
        coordinates: {
          lat: site.latitude,
          lng: site.longitude,
        },
        hostPartner: site.contact_person || '',
        siteType: 'factory', // Default, can be extended
        supervisorName: site.contact_person || '',
        supervisorPhone: site.contact_phone || '',
        supervisorEmail: site.contact_email || '',
        requiredPPE: site.metadata?.required_ppe || [],
        safetyProtocols: site.metadata?.safety_protocols || '',
        emergencyContacts: site.metadata?.emergency_contacts || [],
        participantIds: [], // TODO: Fetch from participants endpoint
        maxCapacity: site.metadata?.max_capacity || 50,
        status: site.status as 'active' | 'inactive' | 'maintenance',
        createdAt: site.created_at,
        updatedAt: site.updated_at,
      }));

      setSites(mappedSites);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sites');
      console.error('Error fetching sites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createSite = async (siteData: Partial<Site>): Promise<Site> => {
    try {
      const response = await api.createSite({
        name: siteData.name!,
        address: siteData.address!,
        latitude: siteData.coordinates?.lat || 0,
        longitude: siteData.coordinates?.lng || 0,
        contact_person: siteData.supervisorName || '',
        contact_phone: siteData.supervisorPhone || '',
        contact_email: siteData.supervisorEmail || '',
        status: siteData.status || 'active',
        metadata: {
          required_ppe: siteData.requiredPPE || [],
          safety_protocols: siteData.safetyProtocols || '',
          emergency_contacts: siteData.emergencyContacts || [],
          max_capacity: siteData.maxCapacity || 50,
        },
      });

      const newSite = response.data.site;
      await fetchSites(); // Refresh the list
      return newSite;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create site');
    }
  };

  const updateSite = async (id: string, siteData: Partial<Site>): Promise<Site> => {
    try {
      const response = await api.updateSite(id, {
        name: siteData.name,
        address: siteData.address,
        latitude: siteData.coordinates?.lat,
        longitude: siteData.coordinates?.lng,
        contact_person: siteData.supervisorName,
        contact_phone: siteData.supervisorPhone,
        contact_email: siteData.supervisorEmail,
        status: siteData.status,
        metadata: {
          required_ppe: siteData.requiredPPE,
          safety_protocols: siteData.safetyProtocols,
          emergency_contacts: siteData.emergencyContacts,
          max_capacity: siteData.maxCapacity,
        },
      });

      const updatedSite = response.data.site;
      await fetchSites(); // Refresh the list
      return updatedSite;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update site');
    }
  };

  const deleteSite = async (id: string): Promise<void> => {
    try {
      await api.deleteSite(id);
      await fetchSites(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete site');
    }
  };

  useEffect(() => {
    fetchSites();
  }, [JSON.stringify(filters)]);

  return {
    sites,
    isLoading,
    error,
    refetch: fetchSites,
    createSite,
    updateSite,
    deleteSite,
  };
};
