import { User } from '../types';

/**
 * Check if user has admin role
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN';
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdmin(user);
};
