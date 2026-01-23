import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        setUser(JSON.parse(userData));
        await socketService.connect();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      await socketService.connect();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      const response = await apiService.register(data);
      
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      await socketService.connect();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      socketService.disconnect();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await apiService.getProfile();
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
