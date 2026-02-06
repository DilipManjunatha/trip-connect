import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { List, Contact, Tag } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, QueueListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import EmptyState from '../components/EmptyState';
import { useIsMobile } from '../hooks/useMediaQuery';
import { ActionSheet, BottomSheet, Button, CreateFAB, FormField, GroupedList, LargeTitleHeader, ListRow, Modal, SearchField, Select, Input } from '../components/ui';

const Lists: React.FC = () => {
  const isMobile = useIsMobile();
  const [lists, setLists] = useState<List[]>([]);
  const [_contacts, setContacts] = useState<Contact[]>([]);
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
  const [showDescription, setShowDescription] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  const openActionsFor = (listId: string) => {
    setSelectedListId(listId);
    setShowActions(true);
  };

  const closeActions = () => setShowActions(false);

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

  return (
    <div className="space-y-4">
      <LargeTitleHeader
        title="Smart Lists"
        action={
          <span className="hidden md:inline-block">
            <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5" />}>
              New
            </Button>
          </span>
        }
      />
      <CreateFAB label="Add list" onClick={() => handleOpenModal()} />

      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search lists" />

      {/* Mobile: iOS-style list + details below */}
      <div className="lg:hidden space-y-4">
        {filteredLists.length > 0 ? (
          <GroupedList>
            {filteredLists.map((list, idx) => (
              <div key={list.id}>
                <ListRow
                  title={list.name}
                  subtitle={`${list._count?.members || 0} contacts${list.isAutomatic ? ' • Automatic' : ''}`}
                  leading={<QueueListIcon className="h-6 w-6 text-gray-400" />}
                  trailing={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openActionsFor(list.id);
                      }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Actions for ${list.name}`}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  }
                  onClick={() => setSelectedListId(list.id)}
                  showChevron={false}
                />
                {idx !== filteredLists.length - 1 ? (
                  <div className="mx-4 h-px bg-gray-100" />
                ) : null}
              </div>
            ))}
          </GroupedList>
        ) : (
          <EmptyState
            icon={<QueueListIcon className="h-16 w-16" />}
            title="No lists yet"
            description="Create a list to organize your contacts."
            actionButton={{
              label: "Create List",
              onClick: () => handleOpenModal()
            }}
          />
        )}

        {selectedList ? (
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[22px] leading-7 font-bold text-gray-900">{selectedList.name}</h2>
                {selectedList.description ? (
                  <p className="text-sm text-gray-600 mt-1">{selectedList.description}</p>
                ) : null}
              </div>
              <Button onClick={() => handleDelete(selectedList.id)} variant="danger" size="sm">
                Delete
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Members</h3>
              {listContacts.length > 0 ? (
                <div className="space-y-2">
                  {listContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.email ? (
                          <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                        ) : null}
                      </div>
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No contacts in this list</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 text-center">
            <p className="text-gray-500">Select a list to view details</p>
          </div>
        )}
      </div>

      {/* Desktop: keep existing 2-pane layout */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Lists Sidebar */}
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
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(list);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<QueueListIcon className="h-16 w-16" />}
              title="No lists yet"
              description="Create a list to organize your contacts."
              actionButton={{
                label: "Create List",
                onClick: () => handleOpenModal()
              }}
            />
          )}
        </div>

        {/* List Details */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{selectedList.name}</h2>
                {selectedList.description && (
                  <p className="text-gray-600 mt-2">{selectedList.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedList.isAutomatic && (
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Automatic
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

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Members</h3>
                  <Button
                    onClick={() => handleDelete(selectedList.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete List
                  </Button>
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
            <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
              <p className="text-gray-500 text-base md:text-lg">Select a list to view details</p>
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        <BottomSheet
          open={showModal}
          onClose={handleCloseModal}
          onAfterClose={() => {
            setEditingList(null);
            setFormData({
              name: '',
              description: '',
              isAutomatic: false,
              tagId: '',
            });
            setShowDescription(false);
          }}
          title={editingList ? 'Edit List' : 'Create New List'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="List Name" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., VIP Contacts, Family"
            />
          </FormField>
          {showDescription ? (
            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Optional description"
              />
            </FormField>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowDescription(true)}>
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add description (optional)
            </Button>
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
            </label>
          </div>
          {formData.isAutomatic && (
            <FormField label="Select Tag">
              <Select
                value={formData.tagId}
                onChange={(value) => setFormData({ ...formData, tagId: value })}
                options={[
                  { value: '', label: 'Choose a tag...' },
                  ...tags.map(tag => ({ value: tag.id, label: tag.name }))
                ]}
                placeholder="Choose a tag..."
              />
            </FormField>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingList ? 'Update' : 'Create'}</Button>
          </div>
        </form>
        </BottomSheet>
      ) : (
        <Modal
          open={showModal}
          onClose={handleCloseModal}
          onAfterClose={() => {
            setEditingList(null);
            setFormData({
              name: '',
              description: '',
              isAutomatic: false,
              tagId: '',
            });
            setShowDescription(false);
          }}
          title={editingList ? 'Edit List' : 'Create New List'}
          size="md"
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="List Name" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., VIP Contacts, Family"
            />
          </FormField>
          
          {/* Progressive disclosure for description */}
          {showDescription ? (
            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Optional description"
              />
            </FormField>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDescription(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add description (optional)
            </Button>
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
            </label>
          </div>
          {formData.isAutomatic && (
            <FormField label="Select Tag">
              <Select
                value={formData.tagId}
                onChange={(value) => setFormData({ ...formData, tagId: value })}
                options={[
                  { value: '', label: 'Choose a tag...' },
                  ...tags.map(tag => ({ value: tag.id, label: tag.name }))
                ]}
                placeholder="Choose a tag..."
              />
            </FormField>
          )}
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
              {editingList ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
        </Modal>
      )}

      <ActionSheet open={showActions} onClose={closeActions} title={selectedList ? selectedList.name : 'Actions'}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedList) return;
              closeActions();
              handleOpenModal(selectedList);
            }}
            className="w-full min-h-touch rounded-xl bg-white py-3 text-[17px] font-medium text-gray-900 active:bg-gray-50 flex items-center"
          >
            <span className="inline-flex items-center gap-2">
              <PencilSquareIcon className="h-5 w-5 text-gray-500" />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedList) return;
              const id = selectedList.id;
              closeActions();
              handleDelete(id);
            }}
            className="w-full min-h-touch rounded-xl bg-white py-3 text-[17px] font-semibold text-error-600 active:bg-gray-50 flex items-center"
          >
            <span className="inline-flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-error-500" />
              Delete
            </span>
          </button>
        </div>
      </ActionSheet>
    </div>
  );
};

export default Lists;
