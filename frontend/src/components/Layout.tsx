import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon },
  { name: 'Tags', href: '/tags', icon: TagIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0 w-64 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">TripConnect</h1>
        </div>
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-primary-50 border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* User section */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName[0]}{user?.lastName[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;