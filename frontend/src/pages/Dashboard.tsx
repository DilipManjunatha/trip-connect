import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactsAPI, tagsAPI, listsAPI, groupsAPI } from '../services';
import { socketService } from '../services/socket';
import { isAdmin } from '../utils/roles';
import { formatDistanceToNow } from 'date-fns';
import {
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import DelightfulError from '../components/DelightfulError';

interface Activity {
  id: string;
  type: 'contact' | 'tag' | 'list' | 'group';
  message: string;
  time: string;
  timestamp: number; // For sorting
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'contact': return UserGroupIcon;
    case 'tag': return TagIcon;
    case 'list': return ListBulletIcon;
    case 'group': return MapIcon;
    default: return ChatBubbleLeftRightIcon;
  }
}

function getActivityIconBg(type: Activity['type']): string {
  switch (type) {
    case 'contact': return 'bg-blue-500';
    case 'tag': return 'bg-green-500';
    case 'list': return 'bg-yellow-500';
    case 'group': return 'bg-purple-500';
    default: return 'bg-primary-500';
  }
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contactCount, setContactCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);
  const [listCount, setListCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const userIsAdmin = isAdmin(user);

  // Helper to format time
  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Generate activities from fetched data
  const generateActivitiesFromData = useCallback((
    contacts: any[],
    tags: any[],
    lists: any[],
    groups: any[]
  ) => {
    const activities: Activity[] = [];

    // Add recent contacts
    if (contacts && contacts.length > 0) {
      const recentContacts = [...contacts]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 3);
      recentContacts.forEach((contact) => {
        const timestamp = new Date(contact.createdAt || contact.updatedAt || new Date()).getTime();
        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
        activities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          message: `${name} added`,
          time: formatTime(contact.createdAt || contact.updatedAt || new Date().toISOString()),
          timestamp,
        });
      });
    }

    // Add recent tags
    if (tags && tags.length > 0) {
      const recentTags = [...tags]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 2);
      recentTags.forEach((tag) => {
        const timestamp = new Date(tag.createdAt || tag.updatedAt || new Date()).getTime();
        activities.push({
          id: `tag-${tag.id}`,
          type: 'tag',
          message: `Tag “${tag.name}” created`,
          time: formatTime(tag.createdAt || tag.updatedAt || new Date().toISOString()),
          timestamp,
        });
      });
    }

    // Add recent lists
    if (lists && lists.length > 0) {
      const recentLists = [...lists]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 2);
      recentLists.forEach((list) => {
        const timestamp = new Date(list.createdAt || list.updatedAt || new Date()).getTime();
        activities.push({
          id: `list-${list.id}`,
          type: 'list',
          message: `List “${list.name}” created`,
          time: formatTime(list.createdAt || list.updatedAt || new Date().toISOString()),
          timestamp,
        });
      });
    }

    // Add recent groups
    if (groups && groups.length > 0) {
      const recentGroups = [...groups]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
        .slice(0, 3);
      recentGroups.forEach((group) => {
        const timestamp = new Date(group.createdAt || group.updatedAt || new Date()).getTime();
        const label = group.destination ? `${group.name} → ${group.destination}` : group.name;
        activities.push({
          id: `group-${group.id}`,
          type: 'group',
          message: `Trip “${label}” created`,
          time: formatTime(group.createdAt || group.updatedAt || new Date().toISOString()),
          timestamp,
        });
      });
    }

    // Sort all activities by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, []);

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
        const groupsData = groupsRes.data?.groups || groupsRes.data || [];
        setGroupCount(Array.isArray(groupsData) ? groupsData.length : 0);
        
        let contactsData: any[] = [];
        let tagsData: any[] = [];
        let listsData: any[] = [];
        
        if (userIsAdmin) {
          const contactsRes = results[1];
          const tagsRes = results[2];
          const listsRes = results[3];
          contactsData = contactsRes.data?.contacts || contactsRes.data?.data?.contacts || contactsRes.data || [];
          tagsData = tagsRes.data?.tags || tagsRes.data?.data?.tags || tagsRes.data || [];
          listsData = listsRes.data?.lists || listsRes.data?.data?.lists || listsRes.data || [];
          
          setContactCount(Array.isArray(contactsData) ? contactsData.length : 0);
          setTagCount(Array.isArray(tagsData) ? tagsData.length : 0);
          setListCount(Array.isArray(listsData) ? listsData.length : 0);
        }

        // Generate activities from fetched data
        const activities = generateActivitiesFromData(
          Array.isArray(contactsData) ? contactsData : [],
          Array.isArray(tagsData) ? tagsData : [],
          Array.isArray(listsData) ? listsData : [],
          Array.isArray(groupsData) ? groupsData : []
        );
        setRecentActivities(activities);
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
  }, [userIsAdmin, generateActivitiesFromData]);

  // Connect to socket and set up listeners
  useEffect(() => {
    socketService.connect();

    const unsubscribes: (() => void)[] = [];

    // Admin-only listeners
    if (userIsAdmin) {
      const unsubscribeNewContact = socketService.on('newContact', (contact) => {
        setContactCount((prev) => prev + 1);
        setRecentActivities((prev) => {
          const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
          const newActivity = {
            id: `contact-${contact.id}`,
            type: 'contact' as const,
            message: `${name} added`,
            time: 'Just now',
            timestamp: Date.now(),
          };
          return [newActivity, ...prev.filter(a => a.id !== `contact-${contact.id}`)]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        });
      });

      const unsubscribeDeleteContact = socketService.on('contactDeleted', () => {
        setContactCount((prev) => Math.max(0, prev - 1));
      });

      const unsubscribeNewTag = socketService.on('newTag', (tag) => {
        setTagCount((prev) => prev + 1);
        setRecentActivities((prev) => {
          const newActivity = {
            id: `tag-${tag.id}`,
            type: 'tag' as const,
            message: `Tag “${tag.name}” created`,
            time: 'Just now',
            timestamp: Date.now(),
          };
          return [newActivity, ...prev.filter(a => a.id !== `tag-${tag.id}`)]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        });
      });

      const unsubscribeDeleteTag = socketService.on('tagDeleted', () => {
        setTagCount((prev) => Math.max(0, prev - 1));
      });

      const unsubscribeNewList = socketService.on('newList', (list) => {
        setListCount((prev) => prev + 1);
        setRecentActivities((prev) => {
          const newActivity = {
            id: `list-${list.id}`,
            type: 'list' as const,
            message: `List “${list.name}” created`,
            time: 'Just now',
            timestamp: Date.now(),
          };
          return [newActivity, ...prev.filter(a => a.id !== `list-${list.id}`)]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        });
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
      setRecentActivities((prev) => {
        const label = group.destination ? `${group.name} → ${group.destination}` : group.name;
        const newActivity = {
          id: `group-${group.id}`,
          type: 'group' as const,
          message: `Trip “${label}” created`,
          time: 'Just now',
          timestamp: Date.now(),
        };
        return [newActivity, ...prev.filter(a => a.id !== `group-${group.id}`)]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
      });
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
        { name: 'Contacts', value: contactCount.toString(), icon: UserGroupIcon, color: 'bg-blue-500', href: '/contacts' },
        { name: 'Tags', value: tagCount.toString(), icon: TagIcon, color: 'bg-green-500', href: '/tags' },
        { name: 'Lists', value: listCount.toString(), icon: ListBulletIcon, color: 'bg-yellow-500', href: '/lists' },
        { name: 'Trip groups', value: groupCount.toString(), icon: MapIcon, color: 'bg-purple-500', href: '/groups' },
      ]
    : [
        { name: 'My trip groups', value: groupCount.toString(), icon: MapIcon, color: 'bg-purple-500', href: '/groups' },
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
          const groupsData = groupsRes.data?.groups || groupsRes.data || [];
          setGroupCount(Array.isArray(groupsData) ? groupsData.length : 0);
          
          let contactsData: any[] = [];
          let tagsData: any[] = [];
          let listsData: any[] = [];
          
          if (userIsAdmin) {
            const contactsRes = results[1];
            const tagsRes = results[2];
            const listsRes = results[3];
            contactsData = contactsRes.data?.contacts || contactsRes.data?.data?.contacts || contactsRes.data || [];
            tagsData = tagsRes.data?.tags || tagsRes.data?.data?.tags || tagsRes.data || [];
            listsData = listsRes.data?.lists || listsRes.data?.data?.lists || listsRes.data || [];
            
            setContactCount(Array.isArray(contactsData) ? contactsData.length : 0);
            setTagCount(Array.isArray(tagsData) ? tagsData.length : 0);
            setListCount(Array.isArray(listsData) ? listsData.length : 0);
          }

          // Regenerate activities from fetched data
          const activities = generateActivitiesFromData(
            Array.isArray(contactsData) ? contactsData : [],
            Array.isArray(tagsData) ? tagsData : [],
            Array.isArray(listsData) ? listsData : [],
            Array.isArray(groupsData) ? groupsData : []
          );
          setRecentActivities(activities);
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
    <div className="space-y-4">
      {/* Welcome Section - Compact */}
      <div className="px-1">
        <h1 className="text-[28px] leading-8 font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {userIsAdmin
            ? 'Manage your contacts, create trip groups, and stay organized.'
            : 'View your trip groups, messages, and stay connected with your travel companions.'}
        </p>
      </div>

      {/* Quick Actions - Moved to top, compact on mobile */}
      <div className="bg-white rounded-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-600 uppercase tracking-wide">Quick Actions</h3>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {userIsAdmin && (
              <>
                <button
                  onClick={() => navigate('/contacts')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 active:bg-blue-100 transition-colors min-h-[100px]"
                >
                  <div className="rounded-lg bg-blue-600 p-2.5 mb-2">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Contact</span>
                </button>

                <button
                  onClick={() => navigate('/tags')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 active:bg-green-100 transition-colors min-h-[100px]"
                >
                  <div className="rounded-lg bg-green-600 p-2.5 mb-2">
                    <TagIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Tag</span>
                </button>
              </>
            )}

            <button
              onClick={() => navigate('/groups')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 active:bg-purple-100 transition-colors min-h-[100px]"
            >
              <div className="rounded-lg bg-purple-600 p-2.5 mb-2">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {userIsAdmin ? 'Create Group' : 'View Groups'}
              </span>
            </button>

            {!userIsAdmin && (
              <button
                onClick={() => navigate('/messages')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-indigo-50 active:bg-indigo-100 transition-colors min-h-[100px]"
              >
                <div className="rounded-lg bg-indigo-600 p-2.5 mb-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Messages</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* At a glance - Key counts, clickable to the relevant section */}
      <div className="bg-white rounded-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-600 uppercase tracking-wide">At a glance</h3>
          <p className="text-xs text-gray-500 mt-0.5">Key counts · tap a card to go there</p>
        </div>
        <div className="p-2">
          <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible">
            {stats.map((stat) => (
              <Link
                key={stat.name}
                to={stat.href}
                className="flex-shrink-0 flex items-center gap-3 p-3 rounded-xl bg-gray-50 min-w-[140px] md:min-w-0 md:flex-col md:items-center md:bg-transparent md:p-0 hover:bg-gray-100 md:hover:bg-gray-50 transition-colors no-underline"
              >
                <div className={`${stat.color} rounded-lg p-2 md:p-3`}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 md:flex-none md:text-center md:mt-2">
                  <p className="text-xs md:text-sm font-medium text-gray-500 truncate md:whitespace-normal">{stat.name}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity - Collapsible or compact */}
      <div className="bg-white rounded-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-600 uppercase tracking-wide">Recent Activity</h3>
        </div>
        <div className="px-4 py-3">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getActivityIconBg(activity.type)}`}>
                      <Icon className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;