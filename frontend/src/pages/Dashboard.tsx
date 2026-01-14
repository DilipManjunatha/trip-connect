import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Contacts', value: '0', icon: UserGroupIcon, color: 'bg-blue-500' },
    { name: 'Active Tags', value: '0', icon: TagIcon, color: 'bg-green-500' },
    { name: 'Smart Lists', value: '0', icon: ListBulletIcon, color: 'bg-yellow-500' },
    { name: 'Trip Groups', value: '0', icon: UserGroupIcon, color: 'bg-purple-500' },
  ];

  const recentActivities = [
    { id: 1, type: 'contact', message: 'Welcome to TripConnect!', time: 'Just now' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your contacts, create trip groups, and stay organized.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
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

            <button className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
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

            <button className="relative rounded-lg p-6 bg-white border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900">Create Group</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Start planning a new trip group
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;