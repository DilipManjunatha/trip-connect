/**
 * Layout — accepts layout ID (SYSTEM | BOARD | FOCUS) per spec §3.3, §5.1–5.3, §4.3.
 * Structure: header, optional sidebar, main (and optional context panel).
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  TagIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  MapIcon,
  DocumentTextIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';
import { LAYOUTS, ROUTES, getLayoutIdForPath, MOBILE_NAV_ITEMS, type UXLayoutID } from '../ux';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, adminOnly: false },
  { name: 'Contacts', href: '/contacts', icon: UserGroupIcon, adminOnly: true },
  { name: 'Tags', href: '/tags', icon: TagIcon, adminOnly: true },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon, adminOnly: true },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon, adminOnly: false },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, adminOnly: false },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, adminOnly: false },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, adminOnly: false },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
];

const MOBILE_BAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  people: UserGroupIcon,
  trips: MapIcon,
  notes: DocumentTextIcon,
  calendar: CalendarIcon,
  more: EllipsisHorizontalIcon,
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface LayoutProps {
  children: React.ReactNode;
  /** Layout variant per spec §4.3. Default: derived from current path. */
  layoutId?: UXLayoutID;
}

function LayoutContent({ children, layoutIdProp }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const layoutId: UXLayoutID = layoutIdProp ?? getLayoutIdForPath(location.pathname);
  const spec = LAYOUTS[layoutId];
  const showSidebarDesktop = spec.sidebar;
  const showContextPanel = spec.contextPanel;
  const minimalHeader = layoutId === 'FOCUS';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar: on SYSTEM visible on desktop; on BOARD/FOCUS drawer only (overlay when open) */}
      <div
        className={classNames(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          showSidebarDesktop && 'md:translate-x-0 md:static md:shadow-sm md:flex-shrink-0'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">TripConnect</h1>
          <button
            onClick={closeMobileMenu}
            className="md:hidden p-2 text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation
              .filter((item) => !item.adminOnly || isAdmin(user))
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName[0]}
                  {user?.lastName[0]}
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
          </div>
        </div>
      </div>

      {/* Main content area (+ optional context panel for SYSTEM/BOARD) */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header: full (SYSTEM/BOARD) or minimal (FOCUS) */}
        <div
          className={classNames(
            'bg-white shadow-sm border-b border-gray-200 flex items-center justify-between shrink-0',
            minimalHeader ? 'px-3 py-2' : 'px-4 py-3 md:px-6'
          )}
        >
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={classNames(
              'p-2 text-gray-600 hover:text-gray-900',
              showSidebarDesktop && 'md:hidden'
            )}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1
            className={classNames(
              'font-bold text-primary-600 truncate max-w-[60vw] md:max-w-none text-center',
              minimalHeader ? 'text-base' : 'text-lg'
            )}
          >
            TripConnect
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <main
            className={classNames(
              'flex-1 relative overflow-y-auto focus:outline-none min-w-0',
              showContextPanel && 'lg:border-r border-gray-200',
              'pb-20 md:pb-0'
            )}
          >
            <div
              className={classNames(
                'py-6',
                layoutId === 'BOARD' || layoutId === 'FOCUS'
                  ? 'max-w-none px-4 sm:px-6'
                  : 'max-w-7xl mx-auto px-4 sm:px-6 md:px-8'
              )}
            >
              {children}
            </div>
          </main>
          {showContextPanel && (
            <aside
              className="hidden lg:block w-0 xl:w-80 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto"
              aria-label="Context panel"
            />
          )}
        </div>
      </div>

      {/* Mobile bottom bar — spec §4.2, §8.4 (below md only) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200"
        aria-label="Primary navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex items-stretch justify-around min-h-[56px]">
          {MOBILE_NAV_ITEMS.filter((item) => !('adminOnly' in item && item.adminOnly) || isAdmin(user)).map((item) => {
            const Icon = MOBILE_BAR_ICONS[item.id];
            const href = 'href' in item ? item.href : '';
            const isActive =
              href &&
              (location.pathname === href ||
                (href === ROUTES.GROUPS && location.pathname.startsWith(ROUTES.GROUPS + '/')));
            const isMore = 'openDrawer' in item && item.openDrawer;

            if (isMore) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                  aria-label="More menu"
                >
                  {Icon && <Icon className="h-6 w-6 shrink-0" aria-hidden />}
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={href || '#'}
                className={classNames(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] min-w-[44px]',
                  isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon className="h-6 w-6 shrink-0" aria-hidden />}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const Layout: React.FC<LayoutProps> = (props) => <LayoutContent {...props} />;

export default Layout;
