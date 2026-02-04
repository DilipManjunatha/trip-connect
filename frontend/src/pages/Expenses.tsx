import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, TrashIcon, CurrencyDollarIcon, CalendarIcon, TagIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { useAuth } from '../context/AuthContext';
import { useTripFromRoute } from '../context/TripContext';
import { Button, Input, Modal, FormField, Select } from '../components/ui';
import type { GroupMember } from '../types';

/** Category order for list-by-category (spec §6.3). */
const CATEGORY_ORDER = ['Transportation', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Other'] as const;

function getMemberDisplayName(m: GroupMember): string {
  if (m.user) return [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email || 'User';
  if (m.contact) return [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ') || m.contact.email || 'Contact';
  return 'Unknown';
}

interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  paidBy?: string;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  date: string;
  createdAt: string;
  updatedAt: string;
}

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: idFromParams } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { groupId: groupIdFromContext, trip } = useTripFromRoute();
  const groupId = idFromParams ?? groupIdFromContext ?? searchParams.get('groupId');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'Other',
    paidBy: '',
    splitType: 'EQUAL' as 'EQUAL' | 'CUSTOM' | 'PERCENTAGE',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!groupId) {
      toast.error('No group selected');
      navigate('/groups');
      return;
    }
    fetchExpenses();
  }, [groupId]);

  const fetchExpenses = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get(`/groups/${groupId}/expenses`);
      const expensesData = response.data?.data?.expenses || response.data?.expenses || response.data;
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error: any) {
      console.error('Fetch expenses error:', error);
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch expenses');
      }
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        description: expense.description || '',
        amount: expense.amount.toString(),
        category: expense.category,
        paidBy: expense.paidBy || '',
        splitType: expense.splitType,
        date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: '',
        description: '',
        amount: '',
        category: 'Other',
        paidBy: '',
        splitType: 'EQUAL',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;

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

      if (editingExpense) {
        await api.put(`/groups/${groupId}/expenses/${editingExpense.id}`, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.post(`/groups/${groupId}/expenses`, payload);
        toast.success('Expense created successfully');
      }
      handleCloseModal();
      fetchExpenses();
    } catch (error: any) {
      console.error('Expense submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    if (!groupId) return;

    try {
      await api.delete(`/groups/${groupId}/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  /** Group expenses by category for list-by-category (spec §6.3). */
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const cat = e.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(e);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const ordered: { category: string; expenses: Expense[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) ordered.push({ category: cat, expenses: map.get(cat)! });
    }
    map.forEach((arr, cat) => {
      if (!CATEGORY_ORDER.includes(cat as any)) ordered.push({ category: cat, expenses: arr });
    });
    return ordered;
  }, [expenses]);

  const members = trip?.members ?? [];
  const memberCount = members.length || 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          fetchExpenses();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expenses</h1>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Add Expense
        </Button>
      </div>

      {/* Total Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
            <p className="text-4xl font-bold mt-1">${totalExpenses.toFixed(2)}</p>
          </div>
          <CurrencyDollarIcon className="h-16 w-16 text-blue-300 opacity-50" />
        </div>
        <p className="text-blue-100 text-sm mt-4">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded</p>
      </div>

      {/* List by category (spec §6.3): each row title, amount, payer, date */}
      {expenses.length > 0 ? (
        <div className="space-y-8">
          {expensesByCategory.map(({ category, expenses: catExpenses }) => (
            <section key={category} className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-gray-500" />
                {category}
              </h2>
              <ul className="divide-y divide-gray-200">
                {catExpenses.map((expense) => (
                  <li key={expense.id}>
                    <button
                      type="button"
                      onClick={() => setDetailExpense(expense)}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition min-h-[44px]"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 block truncate">{expense.title}</span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-sm text-gray-500">
                          <span className="font-semibold text-green-600">${expense.amount.toFixed(2)}</span>
                          {expense.paidBy && <span>Paid by {expense.paidBy}</span>}
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(expense.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 self-end sm:self-center">
                        {expense.splitType}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-lg mt-4">No expenses recorded yet</p>
          <Button
            onClick={() => handleOpenModal()}
            variant="ghost"
            className="mt-4"
          >
            Add your first expense
          </Button>
        </div>
      )}

      {/* Detail modal: full expense + split breakdown (spec §6.3) */}
      <Modal
        open={!!detailExpense}
        onClose={() => setDetailExpense(null)}
        title={detailExpense?.title ?? 'Expense'}
        size="md"
      >
        {detailExpense && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              {detailExpense.description && (
                <p className="text-gray-600">{detailExpense.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="font-semibold text-green-600 text-base">${detailExpense.amount.toFixed(2)}</span>
                <span className="flex items-center gap-1">
                  <TagIcon className="h-4 w-4" />
                  {detailExpense.category}
                </span>
                {detailExpense.paidBy && (
                  <span>Paid by {detailExpense.paidBy}</span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(detailExpense.date).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{detailExpense.splitType}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <UserGroupIcon className="h-4 w-4" />
                Split breakdown
              </h3>
              {detailExpense.splitType === 'EQUAL' && memberCount > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Each of {memberCount} member{memberCount !== 1 ? 's' : ''} owes{' '}
                    <strong>${(detailExpense.amount / memberCount).toFixed(2)}</strong>
                    {detailExpense.paidBy ? ` to ${detailExpense.paidBy}` : ''}.
                  </p>
                  <ul className="space-y-2">
                    {members.map((m) => {
                      const name = getMemberDisplayName(m);
                      const share = detailExpense.amount / memberCount;
                      return (
                        <li
                          key={m.id}
                          className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-900">{name}</span>
                          <span className="flex items-center gap-2 text-gray-600">
                            <span className="font-medium text-green-600">${share.toFixed(2)}</span>
                            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-amber-600 font-medium">Unsettled</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : detailExpense.splitType === 'EQUAL' ? (
                <p className="text-sm text-gray-500">
                  Share per person: ${(detailExpense.amount / memberCount).toFixed(2)}
                  {detailExpense.paidBy ? ` to ${detailExpense.paidBy}` : ''}. Settlement status: Unsettled.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  {detailExpense.splitType} split. Per-person breakdown not stored. Settlement status: Unsettled.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenModal(detailExpense);
                  setDetailExpense(null);
                }}
                leftIcon={<PencilSquareIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Delete this expense?')) {
                    handleDelete(detailExpense.id);
                    setDetailExpense(null);
                  }
                }}
                leftIcon={<TrashIcon className="h-4 w-4" />}
              >
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDetailExpense(null)} className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        onAfterClose={() => {
          setEditingExpense(null);
          setFormData({
            title: '',
            description: '',
            amount: '',
            category: 'Other',
            paidBy: '',
            splitType: 'EQUAL',
            date: new Date().toISOString().split('T')[0],
          });
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title *" required>
            <Input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Hotel Accommodation"
            />
          </FormField>
          <FormField label="Amount *" required>
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
            <Input
              type="text"
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              placeholder="Who paid for this?"
            />
          </FormField>
          <FormField label="Split Type">
            <Select
              value={formData.splitType}
              onChange={(value) => setFormData({ ...formData, splitType: value as any })}
              options={[
                { value: 'EQUAL', label: 'Equal' },
                { value: 'CUSTOM', label: 'Custom' },
                { value: 'PERCENTAGE', label: 'Percentage' },
              ]}
            />
          </FormField>
          <FormField label="Date *" required>
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
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {editingExpense ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
