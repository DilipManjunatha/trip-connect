import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Contact } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { contactEdit, contactNew } from '../ux';
import { ActionSheet, Button, CreateFAB, GroupedList, LargeTitleHeader, ListRow, SearchField } from '../components/ui';

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

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

  const openActionsFor = (contact: Contact) => {
    setSelectedContact(contact);
    setShowActions(true);
  };

  const closeActions = () => {
    setShowActions(false);
    // keep selectedContact for a moment; not necessary to clear immediately
  };

  return (
    <div className="space-y-4">
      <LargeTitleHeader
        title="Contacts"
        action={
          <span className="hidden md:inline-block">
            <Button onClick={() => navigate(contactNew())} leftIcon={<PlusIcon className="h-5 w-5" />}>
              Add
            </Button>
          </span>
        }
      />
      <CreateFAB label="Add contact" onClick={() => navigate(contactNew())} />

      <SearchField
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by name or email"
      />

      {filteredContacts.length > 0 ? (
        <GroupedList>
          {filteredContacts.map((contact, idx) => {
            const fullName = `${contact.firstName} ${contact.lastName}`.trim();
            const subtitle = contact.email || contact.phone || '';
            const tagCount = contact.tags?.length || 0;
            return (
              <div key={contact.id}>
                <ListRow
                  title={fullName}
                  subtitle={subtitle}
                  leading={
                    contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.firstName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: getAvatarColor(fullName) }}
                        aria-hidden="true"
                      >
                        {contact.firstName?.[0]}
                        {contact.lastName?.[0]}
                      </div>
                    )
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      {tagCount > 0 ? (
                        <span className="text-xs text-gray-500">{tagCount} tags</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openActionsFor(contact);
                        }}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Actions for ${fullName}`}
                      >
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  }
                  onClick={() => navigate(contactEdit(contact.id))}
                  showChevron={false}
                />
                {idx !== filteredContacts.length - 1 ? (
                  <div className="mx-4 h-px bg-gray-100" />
                ) : null}
              </div>
            );
          })}
        </GroupedList>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base">No contacts found</p>
          <Button onClick={() => navigate(contactNew())} variant="ghost" className="mt-4">
            Create your first contact
          </Button>
        </div>
      )}

      <ActionSheet
        open={showActions}
        onClose={closeActions}
        title={selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : 'Actions'}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedContact) return;
              closeActions();
              navigate(contactEdit(selectedContact.id));
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
              if (!selectedContact) return;
              const id = selectedContact.id;
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

export default Contacts;
