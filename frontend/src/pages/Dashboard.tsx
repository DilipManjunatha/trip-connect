import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services';
import { isAdmin } from '../utils/roles';
import {
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import DelightfulError from '../components/DelightfulError';

const navItemStyles = {
  trips: { iconBg: 'bg-primary-100', iconColor: 'text-primary-600', hover: 'hover:bg-primary-50' },
  contacts: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', hover: 'hover:bg-blue-50/60' },
  tags: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', hover: 'hover:bg-emerald-50/60' },
  lists: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', hover: 'hover:bg-amber-50/60' },
  messages: { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', hover: 'hover:bg-indigo-50/60' },
} as const;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [groupCount, setGroupCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setNetworkError(false);
        const res = await groupsAPI.getGroups();
        const data = res.data?.groups || res.data || [];
        setGroupCount(Array.isArray(data) ? data.length : 0);
      } catch (error: any) {
        if (error.isNetworkError || (error.response?.status !== 403 && error.response?.status !== 401)) {
          setNetworkError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const navItems = userIsAdmin
    ? [
        { name: 'Trips', href: '/groups', icon: MapIcon, styleKey: 'trips' as const },
        { name: 'Contacts', href: '/contacts', icon: UserGroupIcon, styleKey: 'contacts' as const },
        { name: 'Tags', href: '/tags', icon: TagIcon, styleKey: 'tags' as const },
        { name: 'Smart Lists', href: '/lists', icon: ListBulletIcon, styleKey: 'lists' as const },
      ]
    : [
        { name: 'Trips', href: '/groups', icon: MapIcon, styleKey: 'trips' as const },
        { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, styleKey: 'messages' as const },
      ];

  const handleRetry = () => {
    setNetworkError(false);
    setIsLoading(true);
    groupsAPI.getGroups()
      .then((res) => {
        const data = res.data?.groups || res.data || [];
        setGroupCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((e: any) => {
        if (e.isNetworkError || (e.response?.status !== 403 && e.response?.status !== 401)) setNetworkError(true);
      })
      .finally(() => setIsLoading(false));
  };

  if (networkError && !isLoading) {
    return <DelightfulError onRetry={handleRetry} />;
  }

  return (
    <main className="min-h-[60vh] flex flex-col" aria-label="Home">
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Greeting */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Hi, {user?.firstName ?? 'there'}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {userIsAdmin
              ? 'Jump to trips, contacts, or lists below.'
              : 'Open your trips or messages to get started.'}
          </p>
        </header>

        {/* Navigation grid */}
        <section aria-label="Quick navigation" className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[72px] sm:h-[80px] rounded-2xl bg-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {navItems.map((item) => {
                const style = navItemStyles[item.styleKey];
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center gap-4 p-4 sm:p-5 rounded-2xl
                      bg-white border border-gray-200/80
                      transition-colors duration-200 ease-out
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                      active:scale-[0.98]
                      min-h-[72px] sm:min-h-[80px]
                      ${style.hover}
                      no-underline text-gray-900
                    `}
                    aria-label={`Go to ${item.name}`}
                  >
                    <span
                      className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${style.iconBg} ${style.iconColor}`}
                      aria-hidden
                    >
                      <item.icon className="w-6 h-6 sm:w-6 sm:h-6" strokeWidth={1.75} />
                    </span>
                    <span className="font-medium text-gray-900 truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Trip count / empty hint */}
          {!isLoading && (
            <p className="mt-8 text-center">
              {groupCount > 0 ? (
                <span className="text-sm text-gray-500">
                  {groupCount} trip{groupCount !== 1 ? 's' : ''} in your list
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  <Link to="/groups" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
                    Create a trip
                  </Link>
                  {' to get started'}
                </span>
              )}
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
