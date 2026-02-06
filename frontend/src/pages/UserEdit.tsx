import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, FormField, Input, Select } from '../components/ui';
import { userService } from '../services';
import { ROUTES } from '../ux';

const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await userService.getById(id);
      const user = response.data ?? response;
      setFormData({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        username: user.username ?? '',
        role: user.role ?? 'USER',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load user');
      navigate(ROUTES.USERS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await userService.update(id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
      });
      await userService.updateRole(id, formData.role);
      toast.success('User updated successfully');
      navigate(ROUTES.USERS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="First Name">
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </FormField>
        <FormField label="Last Name">
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </FormField>
        <FormField label="Username">
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </FormField>
        <FormField label="Role">
          <Select
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as 'USER' | 'ADMIN' })}
            options={[
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
        </FormField>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.USERS)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;
