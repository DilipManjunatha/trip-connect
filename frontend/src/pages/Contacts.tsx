import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Contact, Tag } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { Button, Input, Modal, FormField } from '../components/ui';

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tagIds: [] as string[],
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      const tagsData = response.data?.data?.tags || response.data?.tags || response.data;
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/contacts');
      console.log('Contacts API response:', response.data);
      const contactsData = response.data?.data?.contacts || response.data?.contacts || response.data;
      console.log('Extracted contacts data:', contactsData);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error: any) {
      console.error('Fetch contacts error:', error);
      // Don't show toast for network errors or 403 errors - let DelightfulError handle network errors
      // 403 errors are handled silently by AdminRoute redirect
      if (error.response?.status === 403) {
        // Silently handle access denied - AdminRoute will redirect
        return;
      }
      if (!error.isNetworkError) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError('NETWORK_ERROR');
      }
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        notes: contact.notes || '',
        tagIds: contact.tags ? contact.tags.map((t: any) => t.id || t.tagId) : [],
      });
    } else {
      setEditingContact(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        tagIds: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      tagIds: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
      };
      console.log('Submitting contact payload:', payload);
      
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, payload);
        toast.success('Contact updated successfully');
      } else {
        await api.post('/contacts', payload);
        toast.success('Contact created successfully');
      }
      handleCloseModal();
      fetchContacts();
    } catch (error: any) {
      console.error('Submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted successfully');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error === 'NETWORK_ERROR') {
    return <DelightfulError onRetry={() => {
      setError(null);
      fetchContacts();
    }} />;
  }

  if (error) {
    return <div className="text-center py-12">
      <p className="text-red-600 text-lg font-semibold">{error}</p>
      <Button
        onClick={() => {
          setError(null);
          fetchContacts();
        }}
        className="mt-4"
      >
        Retry
      </Button>
    </div>;
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#06B6D4', // cyan-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#EC4899'  // pink-500
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contacts</h1>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Add Contact
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <Input
          type="text"
          placeholder="Search contacts by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none"
        />
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                {/* Avatar - always show either image or initials */}
                <div className="flex items-center mb-4">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.firstName} className="w-16 h-16 rounded-full" />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
                      style={{ backgroundColor: getAvatarColor(`${contact.firstName} ${contact.lastName}`) }}
                    >
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.email && (
                  <p className="text-sm text-gray-500 mt-1">{contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-sm text-gray-500">{contact.phone}</p>
                )}
                {contact.address && (
                  <p className="text-sm text-gray-500 mt-2">{contact.address}</p>
                )}
                {contact.notes && (
                  <p className="text-sm text-gray-600 mt-3 italic">{contact.notes}</p>
                )}
                
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {contact.tags.map((contactTag: any) => {
                      const tag = contactTag.tag || contactTag; // Handle both nested structure and direct tag object
                      return (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${tag.color}20`, // 20% opacity
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                          {tag.value && `: ${tag.value}`}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => handleOpenModal(contact)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leftIcon={<PencilSquareIcon className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(contact.id)}
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No contacts found</p>
            <Button
              onClick={() => handleOpenModal()}
              variant="ghost"
              className="mt-4"
            >
              Create your first contact
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={
          editingContact ? (
            <div className="flex items-center gap-3">
              {editingContact.avatar ? (
                <img src={editingContact.avatar} alt={editingContact.firstName} className="w-12 h-12 rounded-full" />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
                  style={{ backgroundColor: getAvatarColor(`${editingContact.firstName} ${editingContact.lastName}`) }}
                >
                  {editingContact.firstName[0]}{editingContact.lastName[0]}
                </div>
              )}
              <span>Edit Contact</span>
            </div>
          ) : (
            'Add New Contact'
          )
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name *" required>
              <Input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name *" required>
              <Input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Email">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </FormField>
          <FormField label="Phone">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>
          <FormField label="Address">
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </FormField>
          <FormField label="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = formData.tagIds.includes(tag.id);
                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newTagIds = isSelected
                        ? formData.tagIds.filter((id) => id !== tag.id)
                        : [...formData.tagIds, tag.id];
                      setFormData({ ...formData, tagIds: newTagIds });
                    }}
                    className={isSelected ? '' : ''}
                    style={
                      isSelected
                        ? { 
                            backgroundColor: `${tag.color}20`, 
                            color: tag.color,
                            borderColor: tag.color,
                          }
                        : {}
                    }
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {tag.name}
                  </Button>
                );
              })}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500 italic">No tags available.</p>
              )}
            </div>
          </FormField>
          <FormField label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
              {editingContact ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Contacts;
