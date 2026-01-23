import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            // Always use fresh user data from server, ignore cached localStorage data
            const freshUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(freshUser)); // Update localStorage with fresh data
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: freshUser, token },
            });
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
        }
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Login failed' });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
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
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(data);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Registration failed' });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};