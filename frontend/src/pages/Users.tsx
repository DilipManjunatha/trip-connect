import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import { User } from '../types';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import DelightfulError from '../components/DelightfulError';
import { Button, Input, Modal, FormField, Select } from '../components/ui';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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
      setShowDeleteModal(false);
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

  if (error) {
    return <DelightfulError error={error} onRetry={fetchUsers} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage user accounts and role-based access control
        </p>
      </div>

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
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center flex-1">
                <div className="flex-shrink-0 h-12 w-12">
                  {user.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={user.avatar}
                      alt=""
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-base">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-gray-400">(You)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">@{user.username}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex items-center">
                <span
                  className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role === 'ADMIN' ? (
                    <span className="flex items-center">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      User
                    </span>
                  )}
                </span>
              </div>
              {user._count && (
                <div className="text-gray-600 space-y-1">
                  <div>{user._count.contacts} contacts • {user._count.tripGroups} groups • {user._count.messages} messages</div>
                </div>
              )}
              <div className="text-gray-500 text-xs">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            {user.id !== currentUser?.id && (
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Button
                  onClick={() => handleToggleRole(user)}
                  variant="ghost"
                  size="sm"
                  className={
                    user.role === 'ADMIN'
                      ? 'text-yellow-600 hover:text-yellow-900 flex-1 min-h-[44px]'
                      : 'text-green-600 hover:text-green-900 flex-1 min-h-[44px]'
                  }
                  title={
                    user.role === 'ADMIN'
                      ? 'Demote to User'
                      : 'Promote to Admin'
                  }
                >
                  {user.role === 'ADMIN' ? (
                    <>
                      <UserIcon className="h-5 w-5 mr-1" />
                      <span className="hidden sm:inline">Demote</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="h-5 w-5 mr-1" />
                      <span className="hidden sm:inline">Promote</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleEditUser(user)}
                  variant="ghost"
                  size="sm"
                  className="text-primary-600 hover:text-primary-900 flex-1 min-h-[44px]"
                  title="Edit User"
                >
                  <PencilIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  onClick={() => {
                    setUserToDelete(user);
                    setShowDeleteModal(true);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-900 flex-1 min-h-[44px]"
                  title="Delete User"
                >
                  <TrashIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            )}
          </div>
        ))}
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
              {users.map((user) => (
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
                              setShowDeleteModal(true);
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
          setEditingUser(null);
        }}
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
                setEditingUser(null);
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <span>Delete User</span>
          </div>
        }
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{' '}
            <strong>
              {userToDelete?.firstName} {userToDelete?.lastName}
            </strong>
            ? This action cannot be undone and will delete all associated
            data including contacts, groups, and messages.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setUserToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
