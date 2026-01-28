import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, CurrencyDollarIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, FormField, Select } from '../components/ui';

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
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
        <div>
          <Button
            onClick={() => navigate('/groups')}
            variant="ghost"
            size="sm"
            className="mb-2"
          >
            ← Back to Groups
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expenses</h1>
        </div>
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

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{expense.title}</h3>
                    {expense.description && (
                      <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-green-600 ml-4">
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{expense.category}</span>
                  </div>
                  {expense.paidBy && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Paid by:</span>
                      <span>{expense.paidBy}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {expense.splitType}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenModal(expense)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-900 min-h-[44px] min-w-[44px]"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(expense.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900 min-h-[44px] min-w-[44px]"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Split
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500">{expense.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <TagIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {expense.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.paidBy || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {expense.splitType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        onClick={() => handleOpenModal(expense)}
                        variant="ghost"
                        size="sm"
                        className="mr-3 text-blue-600 hover:text-blue-900"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(expense.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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

      {/* Modal */}
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
