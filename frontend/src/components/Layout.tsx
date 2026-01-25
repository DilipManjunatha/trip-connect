import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';
import ProductTour from './ProductTour';
import { useProductTour } from '../hooks/useProductTour';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, adminOnly: false },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon, adminOnly: true },
  { name: 'Tags', href: '/tags', icon: TagIcon, adminOnly: true },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon, adminOnly: true },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon, adminOnly: false },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, adminOnly: false },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { run, stepIndex, setStepIndex, completeTour, stopTour, resetTour } = useProductTour();

  // #region agent log
  React.useEffect(() => {
    console.log('[DEBUG Layout.tsx:35] Layout mounted', {hasUser:!!user,user:user,role:user?.role,pathname:location.pathname});
    fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Layout.tsx:35',message:'Layout mounted',data:{hasUser:!!user,user:user,role:user?.role,pathname:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,C,D'})}).catch(()=>{});
  }, [user, location.pathname]);
  // #endregion

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
            {navigation
              .filter((item) => {
                const shouldShow = !item.adminOnly || isAdmin(user);
                // #region agent log
                console.log('[DEBUG Layout.tsx:52] nav filter', {itemName:item.name,adminOnly:item.adminOnly,isAdminResult:isAdmin(user),shouldShow,userRole:user?.role});
                fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Layout.tsx:52',message:'nav filter',data:{itemName:item.name,adminOnly:item.adminOnly,isAdminResult:isAdmin(user),shouldShow,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,C'})}).catch(()=>{});
                // #endregion
                return shouldShow;
              })
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    data-tour={`${item.name.toLowerCase()}-nav`}
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
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
            <button
              onClick={resetTour}
              className="ml-2 flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
              title="Restart Tour"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
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
      
      {/* Product Tour */}
      <ProductTour
        run={run}
        stepIndex={stepIndex}
        setStepIndex={setStepIndex}
        onComplete={completeTour}
        onStop={stopTour}
      />
    </div>
  );
};

export default Layout;