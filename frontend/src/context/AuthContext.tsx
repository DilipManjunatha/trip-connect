import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services';

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
      // #region agent log
      console.log('[DEBUG AuthContext.tsx:88] loadUser START', {hasToken:!!localStorage.getItem('token')});
      fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:88',message:'loadUser START',data:{hasToken:!!localStorage.getItem('token')},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authService.me();
          // #region agent log
          console.log('[DEBUG AuthContext.tsx:96] authService.me response', {success:response?.success,hasData:!!response?.data,userData:response?.data});
          fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:96',message:'authService.me response',data:{success:response?.success,hasData:!!response?.data,userData:response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B'})}).catch(()=>{});
          // #endregion
          if (response.success && response.data) {
            // Always use fresh user data from server, ignore cached localStorage data
            const freshUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(freshUser)); // Update localStorage with fresh data
            // #region agent log
            console.log('[DEBUG AuthContext.tsx:102] AUTH_SUCCESS dispatch', {user:freshUser,role:freshUser?.role});
            fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:102',message:'AUTH_SUCCESS dispatch',data:{user:freshUser,role:freshUser?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,C'})}).catch(()=>{});
            // #endregion
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: freshUser, token },
            });
          } else {
            // #region agent log
            console.log('[DEBUG AuthContext.tsx:108] loadUser FAILED - no success/data', {response});
            fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:108',message:'loadUser FAILED - no success/data',data:{response},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error: unknown) {
          const err = error as { isNetworkError?: boolean; response?: { status: number } };
          // #region agent log
          console.error('[DEBUG AuthContext.tsx:115] loadUser ERROR', {error:err?.toString(),message:(err as Error)?.message});
          fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:115',message:'loadUser ERROR',data:{error:err?.toString(),message:(err as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          const isUnauthorized = err?.response?.status === 401 || err?.response?.status === 403;
          const noResponse = !err?.response; // network error, offline, or timeout
          if (isUnauthorized) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
            dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
          } else if (noResponse && token) {
            // Offline or network failure: keep using cached user so app stays usable offline
            try {
              const cached = localStorage.getItem('user');
              if (cached) {
                const user = JSON.parse(cached) as User;
                dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
              } else {
                localStorage.removeItem('token');
                dispatch({ type: 'LOGOUT' });
              }
            } catch {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
            dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
          }
        }
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(email, password);
      // #region agent log
      console.log('[DEBUG AuthContext.tsx:124] login response', {success:response?.success,hasData:!!response?.data,user:response?.data?.user,role:response?.data?.user?.role});
      fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:124',message:'login response',data:{success:response?.success,hasData:!!response?.data,user:response?.data?.user,role:response?.data?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // #region agent log
        console.log('[DEBUG AuthContext.tsx:131] login SUCCESS dispatch', {user,role:user?.role,token:!!token});
        fetch('http://127.0.0.1:7242/ingest/fe4a1550-1fce-479e-9704-18d14bef03f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:131',message:'login SUCCESS dispatch',data:{user,role:user?.role,token:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
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
      const response = await authService.register(data);
      
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