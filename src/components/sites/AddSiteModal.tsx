import React, { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import type { Site } from '@/types';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (site: Partial<Site>) => void;
  editingSite?: Site | null;
}

const SITE_TYPES = ['office', 'factory', 'field', 'warehouse'] as const;

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSite,
}) => {
  const [formData, setFormData] = useState({
    name: editingSite?.name || '',
    address: editingSite?.address || '',
    siteType: editingSite?.siteType || 'office' as const,
    hostPartner: editingSite?.hostPartner || '',
    supervisorName: editingSite?.supervisorName || '',
    supervisorPhone: editingSite?.supervisorPhone || '',
    supervisorEmail: editingSite?.supervisorEmail || '',
    maxCapacity: editingSite?.maxCapacity || 30,
    safetyProtocols: editingSite?.safetyProtocols || '',
    requiredPPE: editingSite?.requiredPPE?.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Site name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.hostPartner) newErrors.hostPartner = 'Host partner is required';
    if (!formData.supervisorName) newErrors.supervisorName = 'Supervisor name is required';
    if (!formData.supervisorPhone) newErrors.supervisorPhone = 'Phone is required';
    if (!formData.supervisorEmail) newErrors.supervisorEmail = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data
    const siteData: Partial<Site> = {
      ...editingSite,
      name: formData.name,
      address: formData.address,
      siteType: formData.siteType,
      hostPartner: formData.hostPartner,
      supervisorName: formData.supervisorName,
      supervisorPhone: formData.supervisorPhone,
      supervisorEmail: formData.supervisorEmail,
      maxCapacity: formData.maxCapacity,
      safetyProtocols: formData.safetyProtocols,
      requiredPPE: formData.requiredPPE.split(',').map(s => s.trim()).filter(Boolean),
      status: editingSite?.status || 'active',
      participantIds: editingSite?.participantIds || [],
      emergencyContacts: editingSite?.emergencyContacts || [],
      coordinates: editingSite?.coordinates || { lat: 0, lng: 0 },
    };

    onSubmit(siteData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      siteType: 'office',
      hostPartner: '',
      supervisorName: '',
      supervisorPhone: '',
      supervisorEmail: '',
      maxCapacity: 30,
      safetyProtocols: '',
      requiredPPE: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingSite ? 'Edit Site' : 'Add New Site'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-24">
        {/* Basic Information */}
        <div className="space-y-16">
          <h3 className="text-base font-semibold text-text-primary">
            Basic Information
          </h3>

          <Input
            label="Site Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-8">
              <label className="text-sm font-medium text-text-primary">
                Site Type <span className="text-status-error">*</span>
              </label>
              <select
                value={formData.siteType}
                onChange={(e) => setFormData({ ...formData, siteType: e.target.value as any })}
                className="input-field"
              >
                {SITE_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-glass-black-light">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Max Capacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
              helperText="Maximum number of participants"
            />
          </div>

          <Input
            label="Host Partner"
            value={formData.hostPartner}
            onChange={(e) => setFormData({ ...formData, hostPartner: e.target.value })}
            error={errors.hostPartner}
            required
          />
        </div>

        {/* Supervisor Information */}
        <div className="space-y-16 pt-24 border-t border-white/10">
          <h3 className="text-base font-semibold text-text-primary">
            Supervisor Details
          </h3>

          <Input
            label="Supervisor Name"
            value={formData.supervisorName}
            onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
            error={errors.supervisorName}
            required
          />

          <div className="grid grid-cols-2 gap-16">
            <Input
              label="Phone Number"
              type="tel"
              value={formData.supervisorPhone}
              onChange={(e) => setFormData({ ...formData, supervisorPhone: e.target.value })}
              error={errors.supervisorPhone}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.supervisorEmail}
              onChange={(e) => setFormData({ ...formData, supervisorEmail: e.target.value })}
              error={errors.supervisorEmail}
              required
            />
          </div>
        </div>

        {/* Safety */}
        <div className="space-y-16 pt-24 border-t border-white/10">
          <h3 className="text-base font-semibold text-text-primary">
            Safety & Compliance
          </h3>

          <div className="space-y-8">
            <label className="text-sm font-medium text-text-primary">
              Required PPE
            </label>
            <input
              type="text"
              value={formData.requiredPPE}
              onChange={(e) => setFormData({ ...formData, requiredPPE: e.target.value })}
              placeholder="e.g., Hard hat, Safety boots, Gloves"
              className="input-field"
            />
            <p className="text-xs text-text-tertiary">
              Separate items with commas
            </p>
          </div>

          <div className="space-y-8">
            <label className="text-sm font-medium text-text-primary">
              Safety Protocols
            </label>
            <textarea
              value={formData.safetyProtocols}
              onChange={(e) => setFormData({ ...formData, safetyProtocols: e.target.value })}
              rows={4}
              placeholder="Describe safety procedures and protocols..."
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-12 pt-16">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editingSite ? 'Update Site' : 'Create Site'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
