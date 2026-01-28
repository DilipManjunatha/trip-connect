import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, ClockIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, FormField } from '../components/ui';

interface Itinerary {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const Itinerary: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<Itinerary | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    cost: '',
    notes: '',
  });

  useEffect(() => {
    if (!groupId) {
      toast.error('No group selected');
      navigate('/groups');
      return;
    }
    fetchItineraries();
  }, [groupId]);

  const fetchItineraries = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get(`/groups/${groupId}/itineraries`);
      const itinerariesData = response.data?.data?.itineraries || response.data?.itineraries || response.data;
      setItineraries(Array.isArray(itinerariesData) ? itinerariesData : []);
    } catch (error: any) {
      console.error('Fetch itineraries error:', error);
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch itineraries');
      }
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (itinerary?: Itinerary) => {
    if (itinerary) {
      setEditingItinerary(itinerary);
      setFormData({
        title: itinerary.title,
        description: itinerary.description || '',
        location: itinerary.location || '',
        startTime: itinerary.startTime ? new Date(itinerary.startTime).toISOString().slice(0, 16) : '',
        endTime: itinerary.endTime ? new Date(itinerary.endTime).toISOString().slice(0, 16) : '',
        cost: itinerary.cost?.toString() || '',
        notes: itinerary.notes || '',
      });
    } else {
      setEditingItinerary(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        cost: '',
        notes: '',
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
        location: formData.location || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingItinerary) {
        await api.put(`/groups/${groupId}/itineraries/${editingItinerary.id}`, payload);
        toast.success('Itinerary item updated successfully');
      } else {
        await api.post(`/groups/${groupId}/itineraries`, payload);
        toast.success('Itinerary item created successfully');
      }
      handleCloseModal();
      fetchItineraries();
    } catch (error: any) {
      console.error('Itinerary submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save itinerary item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary item?')) return;
    if (!groupId) return;

    try {
      await api.delete(`/groups/${groupId}/itineraries/${id}`);
      toast.success('Itinerary item deleted successfully');
      fetchItineraries();
    } catch (error) {
      toast.error('Failed to delete itinerary item');
    }
  };

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
          fetchItineraries();
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Itinerary</h1>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Add Activity
        </Button>
      </div>

      {/* Itinerary Items */}
      {itineraries.length > 0 ? (
        <div className="space-y-4">
          {itineraries.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-600 mt-2">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleOpenModal(item)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {item.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span>{item.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <span>
                    {new Date(item.startTime).toLocaleString()}
                    {item.endTime && ` - ${new Date(item.endTime).toLocaleTimeString()}`}
                  </span>
                </div>
                {item.cost && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    <span>${item.cost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 italic">Note: {item.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-lg mt-4">No itinerary items yet</p>
          <Button
            onClick={() => handleOpenModal()}
            variant="ghost"
            className="mt-4"
          >
            Add your first activity
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        onAfterClose={() => {
          setEditingItinerary(null);
          setFormData({
            title: '',
            description: '',
            location: '',
            startTime: '',
            endTime: '',
            cost: '',
            notes: '',
          });
        }}
        title={editingItinerary ? 'Edit Itinerary Item' : 'Add New Activity'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title *" required>
            <Input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Visit Eiffel Tower"
            />
          </FormField>
          <FormField label="Location">
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Champ de Mars, Paris"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Start Time *" required>
              <Input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </FormField>
            <FormField label="End Time">
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Cost">
            <Input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Activity details..."
            />
          </FormField>
          <FormField label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Additional notes..."
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
              {editingItinerary ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Itinerary;
