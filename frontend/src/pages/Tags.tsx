import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import EmptyState from '../components/EmptyState';
import InfoTooltip from '../components/InfoTooltip';

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
        <button
          onClick={() => handleOpenModal()}
          data-tour="create-tag"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Tag
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <button
                    onClick={() => handleOpenModal(tag)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    disabled={(tag._count?.contacts || 0) > 0}
                    className={`flex-1 inline-flex justify-center items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md ${
                      (tag._count?.contacts || 0) > 0
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    }`}
                    title={(tag._count?.contacts || 0) > 0 ? 'Remove tag from all contacts before deleting' : 'Delete tag'}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<TagIcon className="h-16 w-16" />}
            title="No tags yet"
            description="Tags help you organize contacts into categories. When you create a tag and assign it to contacts, a Smart List is automatically created!"
            actionButton={{
              label: "Create Your First Tag",
              onClick: () => handleOpenModal()
            }}
            examples={[
              "Language: Spanish - for Spanish speakers",
              "Skill: Photography - for photographers",
              "Status: VIP - for important contacts"
            ]}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTag ? 'Edit Tag' : 'Create New Tag'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Examples Section */}
              {!editingTag && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">💡 Common tag patterns:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">Language:</span> Spanish, English, French
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Skill:</span> Photography, Cooking
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Status:</span> VIP, Active, Pending
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Relationship:</span> Family, Friend
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag Name *
                    <InfoTooltip content="Categories to organize contacts (e.g., Language, Skill, Status, Relationship)" />
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Language, Skill, Status"
                  />
                </div>
                
                {/* Progressive disclosure for value field */}
                {showValueField ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value (Optional)
                      <InfoTooltip content="Optional specific value (e.g., Spanish for Language tag, Photography for Skill tag)" />
                    </label>
                    <input
                      type="text"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Spanish, Photography, VIP"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowValueField(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add value (optional)
                  </button>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color
                    <InfoTooltip content="Choose a color to visually identify this tag and its associated list" />
                  </label>
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
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
                
                {/* Info Box about automatic list creation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">What happens after creation?</h3>
                      <p className="mt-1 text-sm text-blue-700">
                        When you assign this tag to contacts, a Smart List will be automatically created. The list will update automatically as you add or remove this tag from contacts.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTag ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;
