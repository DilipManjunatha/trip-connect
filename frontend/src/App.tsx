import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import { GROUP_ID_QUERY, ROUTES, groupExpenses, groupItinerary } from './ux';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Tags from './pages/Tags';
import Lists from './pages/Lists';
import Groups from './pages/Groups';
import Messages from './pages/Messages';
import Expenses from './pages/Expenses';
import Itinerary from './pages/Itinerary';
import Users from './pages/Users';
import TripShell from './components/TripShell';
import TripOverview from './pages/TripOverview';
import TripKanban from './pages/TripKanban';
import TripTickets from './pages/TripTickets';
import TripChat from './pages/TripChat';

/** Redirects to nested trip path when groupId is in search (backward compat §3.1). */
function RedirectIfGroupId({
  redirectTo,
  children,
}: {
  redirectTo: (groupId: string) => string;
  children: React.ReactNode;
}) {
  const [search] = useSearchParams();
  const groupId = search.get(GROUP_ID_QUERY);
  if (groupId) {
    return <Navigate to={redirectTo(groupId)} replace />;
  }
  return <>{children}</>;
}

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
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      
      {/* Protected routes */}
      <Route
        path={ROUTES.HOME}
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CONTACTS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Contacts />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TAGS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Tags />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.LISTS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Lists />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      {/* Nested trip routes (spec §3.1, §5.4) */}
      <Route path={ROUTES.GROUPS}>
        <Route
          index
          element={
            <ProtectedRoute>
              <Layout>
                <Groups />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path=":id"
          element={
            <ProtectedRoute>
              <Layout>
                <TripShell />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<TripOverview />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="itinerary" element={<Itinerary />} />
          <Route path="kanban" element={<TripKanban />} />
          <Route path="tickets" element={<TripTickets />} />
          <Route path="chat" element={<TripChat />} />
        </Route>
      </Route>
      <Route
        path={ROUTES.MESSAGES}
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EXPENSES}
        element={
          <RedirectIfGroupId redirectTo={groupExpenses}>
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          </RedirectIfGroupId>
        }
      />
      <Route
        path={ROUTES.ITINERARY}
        element={
          <RedirectIfGroupId redirectTo={groupItinerary}>
            <ProtectedRoute>
              <Layout>
                <Itinerary />
              </Layout>
            </ProtectedRoute>
          </RedirectIfGroupId>
        }
      />
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Users />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;