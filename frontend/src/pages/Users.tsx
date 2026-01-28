import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import { User } from '../types';
import toast from 'react-hot-toast';
import {
  EllipsisHorizontalIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import DelightfulError from '../components/DelightfulError';
import { ActionSheet, Button, FormField, GroupedList, LargeTitleHeader, ListRow, Modal, SearchField, Select, Input } from '../components/ui';

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (err: any) {
      if (err.isNetworkError) {
        setError(new Error('Unable to connect to server'));
      } else {
        setError(err);
        toast.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userService.getStats();
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update basic info
      await userService.update(editingUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        username: editForm.username,
      });

      // Update role if changed
      if (editForm.role !== editingUser.role) {
        await userService.updateRole(editingUser.id, editForm.role);
      }

      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userService.delete(userToDelete.id);
      toast.success('User deleted successfully');
      setShowDeleteSheet(false);
      setUserToDelete(null);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    
    try {
      await userService.updateRole(user.id, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  const openActionsFor = (u: User) => {
    setSelectedUser(u);
    setShowActions(true);
  };

  if (error) {
    return (
      <DelightfulError
        title="Couldn’t load users"
        message={error.message || 'Something went wrong while loading users.'}
        onRetry={fetchUsers}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LargeTitleHeader
        title="Users"
        subtitle="Manage user accounts and role-based access control"
      />

      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search users" />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Admins</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.adminUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Regular Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.regularUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-purple-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Recent (30d)</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.recentUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {/* Mobile: iOS-style grouped list */}
      <div className="block md:hidden">
        <GroupedList>
          {filteredUsers.map((u, idx) => (
            <div key={u.id}>
              <ListRow
                title={`${u.firstName} ${u.lastName}${u.id === currentUser?.id ? ' (You)' : ''}`}
                subtitle={`${u.email} • @${u.username} • ${u.role}`}
                leading={
                  u.avatar ? (
                    <img className="h-10 w-10 rounded-full object-cover" src={u.avatar} alt="" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </span>
                    </div>
                  )
                }
                trailing={
                  u.id !== currentUser?.id ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openActionsFor(u);
                      }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Actions for ${u.firstName} ${u.lastName}`}
                    >
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  ) : null
                }
                onClick={() => handleEditUser(u)}
                showChevron={false}
              />
              {idx !== filteredUsers.length - 1 ? <div className="mx-4 h-px bg-gray-100" /> : null}
            </div>
          ))}
        </GroupedList>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Activity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'ADMIN' ? (
                        <span className="flex items-center">
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          User
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {user._count && (
                        <>
                          <div>{user._count.contacts} contacts</div>
                          <div>{user._count.tripGroups} groups</div>
                          <div>{user._count.messages} messages</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <Button
                            onClick={() => handleToggleRole(user)}
                            variant="ghost"
                            size="sm"
                            className={
                              user.role === 'ADMIN'
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }
                            title={
                              user.role === 'ADMIN'
                                ? 'Demote to User'
                                : 'Promote to Admin'
                            }
                          >
                            {user.role === 'ADMIN' ? (
                              <UserIcon className="h-5 w-5" />
                            ) : (
                              <ShieldCheckIcon className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleEditUser(user)}
                            variant="ghost"
                            size="sm"
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteSheet(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                      {user.id === currentUser?.id && (
                        <span className="text-gray-400 text-xs">(You)</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
        }}
        onAfterClose={() => setEditingUser(null)}
        title="Edit User"
        size="md"
      >
        <div className="space-y-4">
          <FormField label="First Name">
            <Input
              type="text"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              type="text"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
          </FormField>
          <FormField label="Username">
            <Input
              type="text"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={editForm.role}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  role: value as 'USER' | 'ADMIN',
                })
              }
              options={[
                { value: 'USER', label: 'User' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
            />
          </FormField>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
              }}
              className="flex-1"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateUser}
              className="flex-1"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <ActionSheet open={showActions} onClose={() => setShowActions(false)} title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Actions'}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!selectedUser) return;
              setShowActions(false);
              handleToggleRole(selectedUser);
            }}
            className="w-full rounded-xl bg-white py-3 text-[17px] font-medium text-gray-900 active:bg-gray-50"
          >
            <span className="inline-flex items-center gap-2">
              {selectedUser?.role === 'ADMIN' ? (
                <UserIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
              )}
              {selectedUser?.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedUser) return;
              setShowActions(false);
              handleEditUser(selectedUser);
            }}
            className="w-full rounded-xl bg-white py-3 text-[17px] font-medium text-gray-900 active:bg-gray-50"
          >
            <span className="inline-flex items-center gap-2">
              <PencilIcon className="h-5 w-5 text-gray-500" />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedUser) return;
              setShowActions(false);
              setUserToDelete(selectedUser);
              setShowDeleteSheet(true);
            }}
            className="w-full rounded-xl bg-white py-3 text-[17px] font-semibold text-error-600 active:bg-gray-50"
          >
            <span className="inline-flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-error-500" />
              Delete
            </span>
          </button>
        </div>
      </ActionSheet>

      <ActionSheet open={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete user?">
        <div className="px-3 py-2 text-sm text-gray-600">
          This action cannot be undone. It may delete associated data including contacts, groups, and messages.
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleDeleteUser}
            className="w-full rounded-xl bg-white py-3 text-[17px] font-semibold text-error-600 active:bg-gray-50"
          >
            Confirm Delete
          </button>
        </div>
      </ActionSheet>
    </div>
  );
};

export default Users;
