/**
 * User Management Tab
 * Add, edit, delete, and manage all users in the system
 */

import { useState, useEffect } from 'react';
import { GlassCard, Button, Badge, Input } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'supervisor' | 'worker';
  status: 'active' | 'inactive';
  createdAt: string;
}

export function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'worker' as User['role'],
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // In demo mode, use mock users
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'System Admin',
          email: 'admin@itsonfsm.com',
          phone: '+27821234567',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Project Manager',
          email: 'manager@itsonfsm.com',
          phone: '+27821234568',
          role: 'manager',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Site Supervisor',
          email: 'supervisor@itsonfsm.com',
          phone: '+27821234569',
          role: 'supervisor',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setUsers([...users, newUser]);
      setIsAddModalOpen(false);
      resetForm();

      alert('User added successfully! (Demo Mode)');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const updatedUsers = users.map(u =>
        u.id === editingUser.id
          ? { ...editingUser, ...formData }
          : u
      );

      setUsers(updatedUsers);
      setEditingUser(null);
      resetForm();

      alert('User updated successfully! (Demo Mode)');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully! (Demo Mode)');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } as User
          : u
      ));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'worker',
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role,
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-24">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-16 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Search Users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, email, or phone..."
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
          <svg className="w-5 h-5 mr-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New User
        </Button>
      </div>

      {/* Users Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Name</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Email</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Phone</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Role</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Status</th>
                <th className="text-left py-12 px-16 text-sm text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-16 px-16">
                    <div className="font-medium text-text-primary">{user.name}</div>
                  </td>
                  <td className="py-16 px-16 text-text-secondary">{user.email}</td>
                  <td className="py-16 px-16 text-text-secondary font-sf-mono">{user.phone}</td>
                  <td className="py-16 px-16">
                    <Badge variant={
                      user.role === 'admin' ? 'error' :
                      user.role === 'manager' ? 'warning' :
                      user.role === 'supervisor' ? 'info' :
                      'default'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-16 px-16">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className="flex items-center gap-8"
                    >
                      <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                        {user.status}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-16 px-16">
                    <div className="flex items-center gap-8">
                      <Button
                        onClick={() => openEditModal(user)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="secondary" className="bg-status-error/20 hover:bg-status-error/30 text-status-error border-status-error/30"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-64 text-center text-text-secondary">
              No users found
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add/Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-16">
          <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-24">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-16">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27821234567"
                  required
                />

                {!editingUser && (
                  <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                  />
                )}

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="input-field"
                    required
                  >
                    <option value="worker">Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-12">
                <Button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingUser ? handleEditUser : handleAddUser}
                  variant="primary"
                  className="flex-1"
                  disabled={!formData.name || !formData.email || !formData.phone || (!editingUser && !formData.password)}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
