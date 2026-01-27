import { useState, useEffect } from 'react';
import { GlassCard as Card } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Plus, Shield, Package, AlertTriangle } from 'lucide-react';
import { createPPEItem, issuePPE, returnPPE, type PPEItem } from '@/services/operations/workSchedules';
import { db } from '@/utils/db';
import { useAuthStore } from '@/store/useAuthStore';

export function PPEManagementPage() {
  const { user } = useAuthStore();
  const [ppeItems, setPPEItems] = useState<PPEItem[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'helmet',
    brand: '',
    serialNumber: '',
    condition: 'new' as 'new' | 'good' | 'fair' | 'poor' | 'damaged',
    siteId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const participantsData = await db.participants.toArray();
    setParticipants(participantsData);
    const sitesData = await db.sites.toArray();
    setSites(sitesData);
    loadPPE();
  };

  const loadPPE = () => {
    const items: PPEItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('ppe_')) {
        const item = JSON.parse(localStorage.getItem(key)!);
        items.push(item);
      }
    }
    setPPEItems(items);
  };

  const handleAddPPE = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPPEItem(formData);
    setShowAddForm(false);
    setFormData({
      type: 'helmet',
      brand: '',
      serialNumber: '',
      condition: 'new',
      siteId: '',
    });
    loadPPE();
  };

  const handleIssue = async (ppeId: string, participantId: string) => {
    if (!user) return;
    await issuePPE(participantId, ppeId, user.id);
    setShowIssueForm(null);
    loadPPE();
  };

  const handleReturn = async (ppeId: string) => {
    await returnPPE(ppeId);
    loadPPE();
  };

  const availableItems = ppeItems.filter(item => item.status === 'available');
  const issuedItems = ppeItems.filter(item => item.status === 'issued');
  const maintenanceItems = ppeItems.filter(item => item.status === 'maintenance');

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-24 font-bold">PPE Management</h1>
          <p className="text-gray-600 mt-4">Manage Personal Protective Equipment inventory</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-16 h-16 mr-8" />
          Add PPE Item
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-16">
        <Card className="p-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-24 font-bold">{ppeItems.length}</p>
            </div>
            <Package className="w-32 h-32 text-gray-400" />
          </div>
        </Card>

        <Card className="p-16 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Available</p>
              <p className="text-24 font-bold text-green-900">{availableItems.length}</p>
            </div>
            <Shield className="w-32 h-32 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Issued</p>
              <p className="text-24 font-bold text-blue-900">{issuedItems.length}</p>
            </div>
            <Shield className="w-32 h-32 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-16 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Maintenance</p>
              <p className="text-24 font-bold text-orange-900">{maintenanceItems.length}</p>
            </div>
            <AlertTriangle className="w-32 h-32 text-orange-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Add PPE Form */}
      {showAddForm && (
        <Card className="p-24">
          <h3 className="font-medium mb-16">Add New PPE Item</h3>
          <form onSubmit={handleAddPPE} className="space-y-16">
            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="block text-sm font-medium mb-8">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                >
                  <option value="helmet">Helmet</option>
                  <option value="gloves">Gloves</option>
                  <option value="boots">Safety Boots</option>
                  <option value="vest">Safety Vest</option>
                  <option value="goggles">Safety Goggles</option>
                  <option value="earprotection">Ear Protection</option>
                  <option value="mask">Face Mask</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-8">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-12 py-8 border rounded-md"
                  placeholder="Optional"
                />
              </div>

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
            </div>

            <div className="flex space-x-12">
              <Button type="submit" className="flex-1">Add Item</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* PPE Inventory */}
      <Card className="p-24">
        <h3 className="font-medium mb-16">PPE Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-12 py-8 text-left">Type</th>
                <th className="px-12 py-8 text-left">Brand</th>
                <th className="px-12 py-8 text-left">Serial Number</th>
                <th className="px-12 py-8 text-left">Condition</th>
                <th className="px-12 py-8 text-left">Status</th>
                <th className="px-12 py-8 text-left">Issued To</th>
                <th className="px-12 py-8 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ppeItems.map((item) => {
                const issuedParticipant = item.issuedTo
                  ? participants.find(p => p.id === item.issuedTo)
                  : null;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-12 py-12 capitalize">{item.type}</td>
                    <td className="px-12 py-12">{item.brand}</td>
                    <td className="px-12 py-12 font-mono text-xs">{item.serialNumber || '-'}</td>
                    <td className="px-12 py-12">
                      <span className={`inline-flex px-8 py-4 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-12 py-12 capitalize">{item.status}</td>
                    <td className="px-12 py-12">
                      {issuedParticipant ? issuedParticipant.fullName : '-'}
                    </td>
                    <td className="px-12 py-12">
                      {item.status === 'available' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowIssueForm(item.id)}
                        >
                          Issue
                        </Button>
                      )}
                      {item.status === 'issued' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReturn(item.id)}
                        >
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue PPE Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-24 max-w-md w-full">
            <h3 className="font-medium mb-16">Issue PPE Item</h3>
            <div className="space-y-16">
              <div>
                <label className="block text-sm font-medium mb-8">Select Participant</label>
                <select
                  className="w-full px-12 py-8 border rounded-md"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleIssue(showIssueForm, e.target.value);
                    }
                  }}
                >
                  <option value="">Choose participant...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} - {p.idNumber}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowIssueForm(null)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
export default PPEManagementPage;
