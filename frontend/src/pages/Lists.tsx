import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { List, Contact, Tag } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, CheckIcon, QueueListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import EmptyState from '../components/EmptyState';
import InfoTooltip from '../components/InfoTooltip';

const Lists: React.FC = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isAutomatic: false,
    tagId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showExplainer, setShowExplainer] = useState(() => {
    const dismissed = localStorage.getItem('smartListExplainerDismissed');
    return !dismissed;
  });
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const [listsRes, contactsRes, tagsRes] = await Promise.all([
        api.get('/lists'),
        api.get('/contacts'),
        api.get('/tags'),
      ]);
      const listsData = listsRes.data?.data?.lists || listsRes.data?.lists || listsRes.data;
      const contactsData = contactsRes.data?.data?.contacts || contactsRes.data?.contacts || contactsRes.data;
      const tagsData = tagsRes.data?.data?.tags || tagsRes.data?.tags || tagsRes.data;
      console.log('Lists, Contacts, Tags data:', { listsData, contactsData, tagsData });
      setLists(Array.isArray(listsData) ? listsData : []);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Fetch data error:', error);
      // Don't show toast for 403 errors - AdminRoute will redirect
      if (error.response?.status === 403) {
        return;
      }
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      }
      setLists([]);
      setContacts([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (list?: List) => {
    if (list) {
      setEditingList(list);
      setFormData({
        name: list.name,
        description: list.description || '',
        isAutomatic: list.isAutomatic,
        tagId: list.tagId || '',
      });
      setShowDescription(!!list.description);
    } else {
      setEditingList(null);
      setFormData({
        name: '',
        description: '',
        isAutomatic: false,
        tagId: '',
      });
      setShowDescription(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingList(null);
    setFormData({
      name: '',
      description: '',
      isAutomatic: false,
      tagId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting list payload:', formData);
      
      if (editingList) {
        await api.put(`/lists/${editingList.id}`, formData);
        toast.success('List updated successfully');
      } else {
        await api.post('/lists', formData);
        toast.success('List created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('List submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save list');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      await api.delete(`/lists/${id}`);
      toast.success('List deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (networkError) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      fetchData();
    }} />;
  }

  const selectedList = lists.find(l => l.id === selectedListId);
  const listContacts = selectedList?.members?.map(m => m.contact).filter(Boolean) as Contact[] || [];
  
  const handleDismissExplainer = () => {
    setShowExplainer(false);
    localStorage.setItem('smartListExplainerDismissed', 'true');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Smart Lists</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New List
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Smart List Explainer Banner */}
      {showExplainer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-900">About Smart Lists</h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                Smart Lists automatically update when you add or remove tags from contacts. 
                Create a tag → Assign it to contacts → The list updates automatically!
              </p>
              <div className="flex items-center text-xs text-blue-700 bg-white/50 rounded px-2 py-1 inline-block">
                <span className="font-semibold mr-1">Contact</span>
                <span className="mr-1">+</span>
                <span className="font-semibold mr-1">Tag</span>
                <span className="mr-1">→</span>
                <span className="font-semibold">Auto-added to List</span>
              </div>
            </div>
            <button
              onClick={handleDismissExplainer}
              className="ml-4 text-blue-400 hover:text-blue-600 transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Sidebar */}
        <div className="space-y-2">
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <div
                key={list.id}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedListId === list.id
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedListId(list.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    <p className="text-sm text-gray-500">{list._count?.members || 0} contacts</p>
                    {list.isAutomatic && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Automatic
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(list);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<QueueListIcon className="h-16 w-16" />}
              title="No lists yet"
              description="Lists are automatically created when you create tags and assign them to contacts. Start by creating some tags!"
              actionButton={{
                label: "Go to Tags",
                onClick: () => window.location.href = '/tags'
              }}
              examples={[
                "Create a 'Language: Spanish' tag",
                "Assign it to contacts who speak Spanish",
                "A Smart List is automatically created!"
              ]}
            />
          )}
        </div>

        {/* List Details */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedList.name}</h2>
                {selectedList.description && (
                  <p className="text-gray-600 mt-2">{selectedList.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedList.isAutomatic && (
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      🔄 Automatic List
                    </span>
                  )}
                  {selectedList.tag && (
                    <span className="text-xs px-3 py-1 rounded-full flex items-center" style={{ backgroundColor: selectedList.tag.color + '20', color: selectedList.tag.color }}>
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      {selectedList.tag.name}{selectedList.tag.value ? `: ${selectedList.tag.value}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* About this list section */}
              {selectedList.isAutomatic && selectedList.tag && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">About this Smart List</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>• This list is synced with the <span className="font-semibold">{selectedList.tag.name}{selectedList.tag.value ? `: ${selectedList.tag.value}` : ''}</span> tag</p>
                      <p>• Members are automatically added when you assign this tag to contacts</p>
                      <p>• Remove the tag from a contact to remove them from this list</p>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center text-xs">
                          <span className="font-medium">Contact</span>
                          <svg className="h-4 w-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="font-medium">Tag</span>
                          <svg className="h-4 w-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="font-medium">Auto-added to List</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Members</h3>
                  <button
                    onClick={() => handleDelete(selectedList.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete List
                  </button>
                </div>

                {listContacts.length > 0 ? (
                  <div className="space-y-2">
                    {listContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          )}
                        </div>
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No contacts in this list</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Select a list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingList ? 'Edit List' : 'Create New List'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    List Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., VIP Contacts, Family"
                  />
                </div>
                
                {/* Progressive disclosure for description */}
                {showDescription ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add description (optional)
                  </button>
                )}
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAutomatic}
                      onChange={(e) => setFormData({ ...formData, isAutomatic: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Automatic List</span>
                    <InfoTooltip content="Creates a list that automatically includes all contacts with the selected tag" />
                  </label>
                  <p className="text-xs text-gray-500 ml-6">Automatically add contacts with selected tag</p>
                </div>
                {formData.isAutomatic && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Tag
                    </label>
                    <select
                      value={formData.tagId}
                      onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a tag...</option>
                      {tags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                    {editingList ? 'Update' : 'Create'}
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

export default Lists;
