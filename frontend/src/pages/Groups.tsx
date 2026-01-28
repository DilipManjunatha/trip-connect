import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TripGroup, GroupMember, Contact } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserGroupIcon, MapPinIcon, CalendarIcon, CurrencyDollarIcon, UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, FormField, Select } from '../components/ui';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  ONGOING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const Groups: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TripGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<TripGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'PLANNING',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchContacts();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const response = await api.get('/groups');
      console.log('Groups API response:', response.data);
      const groupsData = response.data?.data?.groups || response.data?.groups || response.data;
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error: any) {
      console.error('Fetch groups error:', error);
      if (error.isNetworkError) {
        setNetworkError(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch groups');
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contacts');
      const contactsData = response.data?.data?.contacts || response.data?.contacts || response.data;
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleOpenModal = (group?: TripGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        destination: group.destination || '',
        startDate: group.startDate ? group.startDate.split('T')[0] : '',
        endDate: group.endDate ? group.endDate.split('T')[0] : '',
        budget: group.budget?.toString() || '',
        status: group.status,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'PLANNING',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      budget: '',
      status: 'PLANNING',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        destination: formData.destination || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status,
      };
      console.log('Submitting group payload:', payload);

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, payload);
        toast.success('Trip group updated successfully');
      } else {
        await api.post('/groups', payload);
        toast.success('Trip group created successfully');
      }
      handleCloseModal();
      fetchGroups();
    } catch (error: any) {
      console.error('Group submit error:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Trip group deleted successfully');
      fetchGroups();
      setSelectedGroup(null);
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleOpenMembersModal = (group: TripGroup) => {
    setSelectedGroup(group);
    setSelectedContacts([]);
    setMemberSearchTerm('');
    setShowMembersModal(true);
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    try {
      await api.post(`/groups/${selectedGroup.id}/members`, {
        contactIds: selectedContacts,
      });
      toast.success('Members added successfully');
      setShowMembersModal(false);
      setSelectedContacts([]);
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (!confirm('Remove this member from the group?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      toast.success('Member removed successfully');
      fetchGroups();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (networkError) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      fetchGroups();
    }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Trip Groups</h1>
        {isAdmin(user) && (
          <Button
            onClick={() => handleOpenModal()}
            leftIcon={<PlusIcon className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            New Trip Group
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <Input
          type="text"
          placeholder="Search trip groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none"
        />
      </div>

      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer overflow-hidden ${
                selectedGroup?.id === group.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedGroup(group)}
            >
              {group.coverImage && (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${group.coverImage})` }}
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{group.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColors[group.status]}`}>
                    {group.status}
                  </span>
                </div>

                {group.destination && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPinIcon className="h-4 w-4" />
                    {group.destination}
                  </div>
                )}

                {group.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(group.startDate).toLocaleDateString()}
                    {group.endDate && ` - ${new Date(group.endDate).toLocaleDateString()}`}
                  </div>
                )}

                {group.budget && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Budget: ${group.budget.toFixed(2)}
                  </div>
                )}

                {group.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    {group._count?.members || 0} members
                  </div>
                  <span>{group._count?.expenses || 0} expenses</span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/expenses?groupId=${group.id}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 bg-blue-50 hover:bg-blue-100"
                    leftIcon={<CurrencyDollarIcon className="h-4 w-4" />}
                  >
                    Expenses
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/itinerary?groupId=${group.id}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-purple-700 bg-purple-50 hover:bg-purple-100"
                    leftIcon={<ClockIcon className="h-4 w-4" />}
                  >
                    Itinerary
                  </Button>
                </div>

                {isAdmin(user) && (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMembersModal(group);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      title="Manage Members"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(group);
                      }}
                      variant="outline"
                      size="sm"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(group.id);
                      }}
                      variant="danger"
                      size="sm"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No trip groups found</p>
          <Button
            onClick={() => handleOpenModal()}
            variant="ghost"
            className="mt-4"
          >
            Create your first trip
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingGroup ? 'Edit Trip Group' : 'Create New Trip Group'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Trip Name *" required>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Vacation 2024"
            />
          </FormField>
          <FormField label="Destination">
            <Input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g., Paris, France"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Budget">
            <Input
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'PLANNING', label: 'Planning' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'ONGOING', label: 'Ongoing' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Trip details..."
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
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Members Management Modal */}
      <Modal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={
          <div>
            <div className="text-xl font-bold text-gray-900">Manage Members</div>
            <p className="text-sm text-gray-600 mt-1">{selectedGroup?.name}</p>
          </div>
        }
        size="lg"
      >

            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Members */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Current Members ({selectedGroup?.members?.length || 0})
                </h3>
            <div className="space-y-2">
              {selectedGroup?.members?.map((member) => {
                    const name = member.contact
                      ? `${member.contact.firstName} ${member.contact.lastName}`
                      : member.user
                      ? `${member.user.firstName} ${member.user.lastName}`
                      : 'Unknown';
                    const initials = name.split(' ').map(n => n[0]).join('');

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.isConfirmed && (
                            <span className="text-green-600 text-sm">✓ Confirmed</span>
                          )}
                          {member.role !== 'ORGANIZER' && (
                            <Button
                              onClick={() => handleRemoveMember(selectedGroup!.id, member.id)}
                              variant="danger"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

          {/* Add Members */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Members</h3>
            <Input
              type="text"
              placeholder="Search contacts..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contacts
                .filter((contact) => {
                  const alreadyMember = selectedGroup?.members?.some(
                    (m) => m.contactId === contact.id
                  );
                  const matchesSearch =
                    contact.firstName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                    contact.lastName.toLowerCase().includes(memberSearchTerm.toLowerCase());
                  return !alreadyMember && matchesSearch;
                })
                .map((contact) => {
                      const initials = `${contact.firstName[0]}${contact.lastName[0]}`;
                      const isSelected = selectedContacts.includes(contact.id);

                      return (
                        <div
                          key={contact.id}
                          onClick={() => toggleContactSelection(contact.id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.email && (
                                <p className="text-sm text-gray-600">{contact.email}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-blue-600 font-semibold">✓ Selected</span>
                          )}
                        </div>
                      );
                    })}
              {contacts.filter((c) => {
                const alreadyMember = selectedGroup?.members?.some((m) => m.contactId === c.id);
                const matchesSearch =
                  c.firstName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                  c.lastName.toLowerCase().includes(memberSearchTerm.toLowerCase());
                return !alreadyMember && matchesSearch;
              }).length === 0 && (
                <p className="text-center text-gray-500 py-4">No contacts available to add</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={() => setShowMembersModal(false)}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={selectedContacts.length === 0}
            className="flex-1"
          >
            Add Selected ({selectedContacts.length})
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Groups;
