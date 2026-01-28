import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactsAPI, tagsAPI, listsAPI, groupsAPI } from '../services';
import { socketService } from '../services/socket';
import { isAdmin } from '../utils/roles';
import {
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import DelightfulError from '../components/DelightfulError';

interface Activity {
  id: string;
  type: 'contact' | 'tag' | 'list' | 'group';
  message: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contactCount, setContactCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);
  const [listCount, setListCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([
    { id: '0', type: 'contact', message: 'Welcome to TripConnect!', time: 'Just now' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const userIsAdmin = isAdmin(user);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setNetworkError(false);
        
        // Only fetch admin data if user is admin
        const promises: Promise<any>[] = [groupsAPI.getGroups()];
        
        if (userIsAdmin) {
          promises.push(
            contactsAPI.getContacts(),
            tagsAPI.getTags(),
            listsAPI.getLists()
          );
        }
        
        const results = await Promise.all(promises);
        const groupsRes = results[0];
        setGroupCount(groupsRes.data?.groups?.length || 0);
        
        if (userIsAdmin) {
          const contactsRes = results[1];
          const tagsRes = results[2];
          const listsRes = results[3];
          setContactCount(contactsRes.data?.contacts?.length || 0);
          setTagCount(tagsRes.data?.tags?.length || 0);
          setListCount(listsRes.data?.lists?.length || 0);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        // Don't treat 403 errors as network errors
        if (error.isNetworkError || (error.response?.status !== 403 && error.response?.status !== 401)) {
          setNetworkError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userIsAdmin]);

  // Connect to socket and set up listeners
  useEffect(() => {
    socketService.connect();

    const unsubscribes: (() => void)[] = [];

    // Admin-only listeners
    if (userIsAdmin) {
      const unsubscribeNewContact = socketService.on('newContact', (contact) => {
        setContactCount((prev) => prev + 1);
        setRecentActivities((prev) => [
          {
            id: contact.id,
            type: 'contact',
            message: `New contact: ${contact.firstName} ${contact.lastName}`,
            time: 'Just now',
          },
          ...prev.slice(0, 9),
        ]);
      });

      const unsubscribeDeleteContact = socketService.on('contactDeleted', () => {
        setContactCount((prev) => Math.max(0, prev - 1));
      });

      const unsubscribeNewTag = socketService.on('newTag', (tag) => {
        setTagCount((prev) => prev + 1);
        setRecentActivities((prev) => [
          {
            id: tag.id,
            type: 'tag',
            message: `New tag: ${tag.name}`,
            time: 'Just now',
          },
          ...prev.slice(0, 9),
        ]);
      });

      const unsubscribeDeleteTag = socketService.on('tagDeleted', () => {
        setTagCount((prev) => Math.max(0, prev - 1));
      });

      const unsubscribeNewList = socketService.on('newList', (list) => {
        setListCount((prev) => prev + 1);
        setRecentActivities((prev) => [
          {
            id: list.id,
            type: 'list',
            message: `New list: ${list.name}`,
            time: 'Just now',
          },
          ...prev.slice(0, 9),
        ]);
      });

      const unsubscribeDeleteList = socketService.on('listDeleted', () => {
        setListCount((prev) => Math.max(0, prev - 1));
      });

      unsubscribes.push(
        unsubscribeNewContact,
        unsubscribeDeleteContact,
        unsubscribeNewTag,
        unsubscribeDeleteTag,
        unsubscribeNewList,
        unsubscribeDeleteList
      );
    }

    // All users can listen to group events
    const unsubscribeNewGroup = socketService.on('newGroup', (group) => {
      setGroupCount((prev) => prev + 1);
      setRecentActivities((prev) => [
        {
          id: group.id,
          type: 'group',
          message: `New trip group: ${group.name}`,
          time: 'Just now',
        },
        ...prev.slice(0, 9),
      ]);
    });

    const unsubscribeDeleteGroup = socketService.on('groupDeleted', () => {
      setGroupCount((prev) => Math.max(0, prev - 1));
    });

    unsubscribes.push(unsubscribeNewGroup, unsubscribeDeleteGroup);

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [userIsAdmin]);

  const stats = userIsAdmin
    ? [
        { name: 'Total Contacts', value: contactCount.toString(), icon: UserGroupIcon, color: 'bg-blue-500' },
        { name: 'Active Tags', value: tagCount.toString(), icon: TagIcon, color: 'bg-green-500' },
        { name: 'Smart Lists', value: listCount.toString(), icon: ListBulletIcon, color: 'bg-yellow-500' },
        { name: 'Trip Groups', value: groupCount.toString(), icon: UserGroupIcon, color: 'bg-purple-500' },
      ]
    : [
        { name: 'My Trip Groups', value: groupCount.toString(), icon: UserGroupIcon, color: 'bg-purple-500' },
      ];

  if (networkError && !isLoading) {
    return <DelightfulError onRetry={() => {
      setNetworkError(false);
      setIsLoading(true);
      // Re-fetch data
      const fetchData = async () => {
        try {
          const promises: Promise<any>[] = [groupsAPI.getGroups()];
          
          if (userIsAdmin) {
            promises.push(
              contactsAPI.getContacts(),
              tagsAPI.getTags(),
              listsAPI.getLists()
            );
          }
          
          const results = await Promise.all(promises);
          const groupsRes = results[0];
          setGroupCount(groupsRes.data?.groups?.length || 0);
          
          if (userIsAdmin) {
            const contactsRes = results[1];
            const tagsRes = results[2];
            const listsRes = results[3];
            setContactCount(contactsRes.data?.contacts?.length || 0);
            setTagCount(tagsRes.data?.tags?.length || 0);
            setListCount(listsRes.data?.lists?.length || 0);
          }
        } catch (error: any) {
          if (error.isNetworkError || (error.response?.status !== 403 && error.response?.status !== 401)) {
            setNetworkError(true);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {userIsAdmin
                  ? 'Manage your contacts, create trip groups, and stay organized.'
                  : 'View your trip groups, messages, and stay connected with your travel companions.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 gap-5 ${userIsAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-1 lg:grid-cols-1 max-w-md'}`}>
        {stats.map((stat) => (
          <div key={stat.name} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
            <dt>
              <div className={`absolute ${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No recent activities</p>
          ) : (
            <div className="mt-6 flow-root">
              <ul className="-mb-8">
                {recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{activity.message}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{activity.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userIsAdmin && (
              <>
                <button
                  onClick={() => navigate('/contacts')}
                  className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">Add Contact</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Add a new contact to your network
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/tags')}
                  className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                      <TagIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">Create Tag</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Create a new tag to organize contacts
                    </p>
                  </div>
                </button>
              </>
            )}

            <button
              onClick={() => navigate('/groups')}
              className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900">
                  {userIsAdmin ? 'Create Group' : 'View Groups'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {userIsAdmin
                    ? 'Start planning a new trip group'
                    : 'View and manage your trip groups'}
                </p>
              </div>
            </button>

            {!userIsAdmin && (
              <>
                <button
                  onClick={() => navigate('/messages')}
                  className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                      <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">View Messages</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Check messages from your trip groups
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;