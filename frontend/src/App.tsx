import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Placeholder components for now
const Contacts = () => <div className="p-8 text-center text-gray-600">Contacts page coming soon...</div>;
const Tags = () => <div className="p-8 text-center text-gray-600">Tags page coming soon...</div>;
const Lists = () => <div className="p-8 text-center text-gray-600">Lists page coming soon...</div>;
const Groups = () => <div className="p-8 text-center text-gray-600">Groups page coming soon...</div>;
const Messages = () => <div className="p-8 text-center text-gray-600">Messages page coming soon...</div>;

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout>
              <Contacts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            <Layout>
              <Tags />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lists"
        element={
          <ProtectedRoute>
            <Layout>
              <Lists />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <Layout>
              <Groups />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;