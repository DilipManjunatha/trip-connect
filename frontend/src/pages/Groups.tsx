import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TripGroup, GroupMember, Contact } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserGroupIcon, MapPinIcon, CalendarIcon, CurrencyDollarIcon, UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';
import { useNavigate } from 'react-router-dom';

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Trip Groups</h1>
        {isAdmin(user) && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Trip Group
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search trip groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/expenses?groupId=${group.id}`);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                  >
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Expenses
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/itinerary?groupId=${group.id}`);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Itinerary
                  </button>
                </div>

                {isAdmin(user) && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMembersModal(group);
                      }}
                      className="inline-flex justify-center items-center px-2 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                      title="Manage Members"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(group);
                      }}
                      className="inline-flex justify-center items-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(group.id);
                      }}
                      className="inline-flex justify-center items-center px-2 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No trip groups found</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first trip
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingGroup ? 'Edit Trip Group' : 'Create New Trip Group'}
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
                    Trip Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Summer Vacation 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Paris, France"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
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
                    placeholder="Trip details..."
                  />
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
                    {editingGroup ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage Members</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedGroup.name}</p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Members */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Current Members ({selectedGroup.members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedGroup.members?.map((member) => {
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
                            <button
                              onClick={() => handleRemoveMember(selectedGroup.id, member.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
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
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contacts
                    .filter((contact) => {
                      const alreadyMember = selectedGroup.members?.some(
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
                    const alreadyMember = selectedGroup.members?.some((m) => m.contactId === c.id);
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

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowMembersModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedContacts.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedContacts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
