import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Button, FormField, Input, Select } from '../components/ui';
import { groupExpenses } from '../ux';
import { useTripFromRoute } from '../context/TripContext';
import type { GroupMember } from '../types';

type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';

function getMemberDisplayName(m: GroupMember): string {
  if (m.user) return [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email || 'User';
  if (m.contact) return [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ') || m.contact.email || 'Contact';
  return 'Unknown';
}

const ExpenseForm: React.FC = () => {
  const { id: groupId, expId } = useParams<{ id: string; expId: string }>();
  const navigate = useNavigate();
  const { trip } = useTripFromRoute();
  const isEdit = Boolean(expId);

  const paidByOptions = useMemo(() => {
    const empty = { value: '', label: 'Not specified' };
    const members = trip?.members ?? [];
    const fromMembers = members.map((m) => {
      const name = getMemberDisplayName(m);
      return { value: name, label: name };
    });
    const seen = new Set<string>();
    const unique = fromMembers.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
    return [empty, ...unique];
  }, [trip?.members]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'Other',
    paidBy: '',
    splitType: 'EQUAL' as SplitType,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isEdit && groupId && expId) {
      fetchExpense();
    }
  }, [groupId, expId, isEdit]);

  const fetchExpense = async () => {
    if (!groupId || !expId) return;
    try {
      setLoading(true);
      const response = await api.get(`/groups/${groupId}/expenses/${expId}`);
      const expense = response.data?.data?.expense || response.data?.expense || response.data;
      setFormData({
        title: expense.title,
        description: expense.description || '',
        amount: expense.amount.toString(),
        category: expense.category,
        paidBy: expense.paidBy || '',
        splitType: expense.splitType,
        date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load expense');
      navigate(groupId ? groupExpenses(groupId) : '/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paidBy: formData.paidBy || undefined,
        splitType: formData.splitType,
        date: formData.date,
      };
      if (isEdit && expId) {
        await api.put(`/groups/${groupId}/expenses/${expId}`, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.post(`/groups/${groupId}/expenses`, payload);
        toast.success('Expense created successfully');
      }
      navigate(groupExpenses(groupId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  if (!groupId) {
    navigate('/groups');
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Expense' : 'New Expense'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Title" required>
          <Input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Hotel Accommodation"
          />
        </FormField>
        <FormField label="Amount" required>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Category">
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'Accommodation', label: 'Accommodation' },
              { value: 'Transportation', label: 'Transportation' },
              { value: 'Food', label: 'Food' },
              { value: 'Activities', label: 'Activities' },
              { value: 'Shopping', label: 'Shopping' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </FormField>
        <FormField label="Paid By">
          <Select
            value={formData.paidBy}
            onChange={(value) => setFormData({ ...formData, paidBy: value })}
            options={paidByOptions}
            placeholder="Who paid for this?"
          />
        </FormField>
        <FormField label="Split Type">
          <Select
            value={formData.splitType}
            onChange={(value) => setFormData({ ...formData, splitType: value as SplitType })}
            options={[
              { value: 'EQUAL', label: 'Equal' },
              { value: 'CUSTOM', label: 'Custom' },
              { value: 'PERCENTAGE', label: 'Percentage' },
            ]}
          />
        </FormField>
        <FormField label="Date" required>
          <Input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Additional details..."
          />
        </FormField>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(groupExpenses(groupId))}
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

export default ExpenseForm;
