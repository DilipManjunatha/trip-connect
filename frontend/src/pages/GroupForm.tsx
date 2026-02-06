import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { TripGroup } from '../types';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, FormField, Input, Select } from '../components/ui';
import { ROUTES, group } from '../ux';

const GroupForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'PLANNING' as TripGroup['status'],
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchGroup();
    }
  }, [id, isEdit]);

  const fetchGroup = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/groups/${id}`);
      const g: TripGroup = response.data?.data?.group || response.data?.group || response.data;
      setFormData({
        name: g.name,
        description: g.description || '',
        destination: g.destination || '',
        startDate: g.startDate ? g.startDate.split('T')[0] : '',
        endDate: g.endDate ? g.endDate.split('T')[0] : '',
        budget: g.budget?.toString() || '',
        status: g.status,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load trip');
      navigate(ROUTES.GROUPS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        destination: formData.destination || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status,
      };
      if (isEdit && id) {
        await api.put(`/groups/${id}`, payload);
        toast.success('Trip updated successfully');
        navigate(group(id));
      } else {
        const response = await api.post('/groups', payload);
        const created = response.data?.data?.group || response.data?.group || response.data;
        toast.success('Trip created successfully');
        navigate(created?.id ? group(created.id) : ROUTES.GROUPS);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const backHref = isEdit && id ? group(id) : ROUTES.GROUPS;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-2 -mt-1"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to trips
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Trip' : 'New Trip'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Trip Name" required>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Summer Vacation 2024"
          />
        </FormField>
        <FormField label="Destination">
          <Input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="e.g., Paris, France"
          />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Start Date">
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>
          <FormField label="End Date">
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Budget">
          <Input
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Status">
          <Select
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as TripGroup['status'] })}
            options={[
              { value: 'PLANNING', label: 'Planning' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Trip details..."
          />
        </FormField>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(id ? group(id) : ROUTES.GROUPS)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
