import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import EmptyState from '../components/EmptyState';
import { Button, Input, Modal, FormField } from '../components/ui';

const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    color: '#3B82F6',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showValueField, setShowValueField] = useState(false);

  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7',
    '#EC4899', '#F43F5E'
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get('/tags');
      console.log('Tags API response:', response.data);
      const tagsData = response.data?.data?.tags || response.data?.tags || response.data;
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Fetch tags error:', error);
      // Don't show toast for 403 errors - AdminRoute will redirect
      if (error.response?.status === 403) {
        return;
      }
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch tags');
      }
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        value: tag.value || '',
        color: tag.color,
        description: tag.description || '',
      });
      setShowValueField(!!tag.value); // Show value field if editing and has value
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        value: '',
        color: '#3B82F6',
        description: '',
      });
      setShowValueField(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setShowValueField(false);
    setFormData({
      name: '',
      value: '',
      color: '#3B82F6',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting tag payload:', formData);
      
      if (editingTag) {
        await api.put(`/tags/${editingTag.id}`, formData);
        toast.success('Tag updated successfully');
      } else {
        await api.post('/tags', formData);
        toast.success('Tag created successfully');
      }
      handleCloseModal();
      fetchTags();
    } catch (error: any) {
      console.error('Tag submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save tag');
    }
  };

  const handleDelete = async (id: string) => {
    const tag = tags.find(t => t.id === id);
    const contactCount = tag?._count?.contacts || 0;
    
    let confirmMessage = 'Are you sure you want to delete this tag?';
    if (contactCount > 0) {
      confirmMessage = `This tag is assigned to ${contactCount} contact(s). You must remove it from all contacts before deleting. Do you want to continue?`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await api.delete(`/tags/${id}`);
      toast.success('Tag deleted successfully');
      fetchTags();
    } catch (error: any) {
      console.error('Delete tag error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete tag';
      toast.error(errorMessage);
    }
  };

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (networkError) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      fetchTags();
    }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tags</h1>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          New Tag
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <Input
          type="text"
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none"
        />
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <div key={tag.id} className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{tag.name}</h3>
                    {tag.value && (
                      <p className="text-sm text-gray-500">{tag.value}</p>
                    )}
                  </div>
                </div>
                {tag.description && (
                  <p className="text-sm text-gray-600 mb-4">{tag.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{tag._count?.contacts || 0} contacts</span>
                  <span>{tag._count?.lists || 0} lists</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenModal(tag)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<PencilSquareIcon className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(tag.id)}
                    disabled={(tag._count?.contacts || 0) > 0}
                    variant={(tag._count?.contacts || 0) > 0 ? 'ghost' : 'danger'}
                    size="sm"
                    className="flex-1"
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                    title={(tag._count?.contacts || 0) > 0 ? 'Remove tag from all contacts before deleting' : 'Delete tag'}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<TagIcon className="h-16 w-16" />}
            title="No tags yet"
            description="Create tags to categorize your contacts."
            actionButton={{
              label: "Create Your First Tag",
              onClick: () => handleOpenModal()
            }}
          />
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tag Name *" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tag name"
            />
          </FormField>
          
          {/* Progressive disclosure for value field */}
          {showValueField ? (
            <FormField label="Value (Optional)">
              <Input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Optional value"
              />
            </FormField>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowValueField(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add value (optional)
            </Button>
          )}
          
          <FormField label="Color">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full aspect-square rounded-lg transition ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </FormField>
          
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Optional description"
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
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tags;
