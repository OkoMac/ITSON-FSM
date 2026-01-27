import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Smartphone, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { registerDevice, updateDeviceStatus, reportDeviceLost, getDevice, type Device } from '@/services/monitoring/biometricMonitoring';
import { db } from '@/utils/db';
import { useAuth } from '@/contexts/AuthContext';

export function DeviceManagementPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: '',
    manufacturer: '',
    siteId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sitesData = await db.sites.toArray();
    setSites(sitesData);
    loadDevices();
  };

  const loadDevices = () => {
    const items: Device[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('device_')) {
        const item = JSON.parse(localStorage.getItem(key)!);
        items.push(item);
      }
    }
    setDevices(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerDevice({
      ...formData,
      assignedTo: '',
    });
    setShowAddForm(false);
    setFormData({
      serialNumber: '',
      model: '',
      manufacturer: '',
      siteId: '',
    });
    loadDevices();
  };

  const handleStatusChange = async (deviceId: string, status: 'active' | 'inactive' | 'maintenance' | 'lost' | 'decommissioned') => {
    if (status === 'lost' && user) {
      await reportDeviceLost(deviceId, user.id);
    } else {
      await updateDeviceStatus(deviceId, { status });
    }
    loadDevices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'decommissioned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeDevices = devices.filter(d => d.status === 'active').length;
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance').length;
  const lostDevices = devices.filter(d => d.status === 'lost').length;

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">Device Management (MDM)</h1>
          <p className="text-gray-600 mt-4">Manage biometric devices and mobile hardware</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Smartphone className="w-16 h-16 mr-8" />
          Register Device
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-16">
        <Card className="p-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Devices</p>
              <p className="text-24 font-bold">{devices.length}</p>
            </div>
            <Smartphone className="w-32 h-32 text-gray-400" />
          </div>
        </Card>

        <Card className="p-16 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Active</p>
              <p className="text-24 font-bold text-green-900">{activeDevices}</p>
            </div>
            <CheckCircle className="w-32 h-32 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Maintenance</p>
              <p className="text-24 font-bold text-yellow-900">{maintenanceDevices}</p>
            </div>
            <AlertTriangle className="w-32 h-32 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Lost/Missing</p>
              <p className="text-24 font-bold text-red-900">{lostDevices}</p>
            </div>
            <AlertTriangle className="w-32 h-32 text-red-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Add Device Form */}
      {showAddForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Register New Device</h3>
          <form onSubmit={handleSubmit} className="space-y-16">
            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="block text-sm font-medium mb-8">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  placeholder="e.g., Samsung Galaxy Tab A7"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Assigned Site</label>
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
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Register Device</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Device Inventory */}
      <Card className="p-24">
        <h3 className="font-medium mb-16">Device Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-12 py-8 text-left">Serial Number</th>
                <th className="px-12 py-8 text-left">Model</th>
                <th className="px-12 py-8 text-left">Manufacturer</th>
                <th className="px-12 py-8 text-left">Site</th>
                <th className="px-12 py-8 text-left">Status</th>
                <th className="px-12 py-8 text-left">Registered</th>
                <th className="px-12 py-8 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {devices.map((device) => {
                const site = sites.find(s => s.id === device.siteId);

                return (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-12 py-12 font-mono text-xs">{device.serialNumber}</td>
                    <td className="px-12 py-12">{device.model}</td>
                    <td className="px-12 py-12">{device.manufacturer}</td>
                    <td className="px-12 py-12">
                      <div className="flex items-center space-x-4">
                        <MapPin className="w-12 h-12 text-gray-500" />
                        <span>{site?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-12 py-12">
                      <span className={`inline-flex px-8 py-4 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-12 py-12 text-xs text-gray-600">
                      {new Date(device.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-12 py-12">
                      <select
                        value={device.status}
                        onChange={(e) => handleStatusChange(device.id, e.target.value as any)}
                        className="text-xs px-8 py-4 border rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="lost">Lost</option>
                        <option value="decommissioned">Decommissioned</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {devices.length === 0 && (
            <p className="text-center text-gray-500 py-32">No devices registered</p>
          )}
        </div>
      </Card>
    </div>
  );
}
