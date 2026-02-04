import React, { lazy, Suspense } from 'react';
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
import TicketCardView from './pages/TicketCardView';
import TripChat from './pages/TripChat';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';

const Calendar = lazy(() => import('./pages/Calendar'));

/** Legacy /expenses and /itinerary: redirect to nested path if groupId in search, else to trip list (Task 1.6). */
function LegacyTripRedirect({ toPath }: { toPath: (groupId: string) => string }) {
  const [search] = useSearchParams();
  const groupId = search.get(GROUP_ID_QUERY);
  if (groupId) return <Navigate to={toPath(groupId)} replace />;
  return <Navigate to={ROUTES.GROUPS} replace />;
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
          <Route path="tickets/card/:ticketId" element={<TicketCardView />} />
          <Route path="chat" element={<TripChat />} />
        </Route>
      </Route>
      <Route
        path={ROUTES.MESSAGES}
        element={<Navigate to={ROUTES.GROUPS} replace />}
      />
      <Route
        path={ROUTES.EXPENSES}
        element={<LegacyTripRedirect toPath={groupExpenses} />}
      />
      <Route
        path={ROUTES.ITINERARY}
        element={<LegacyTripRedirect toPath={groupItinerary} />}
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
      <Route
        path={ROUTES.NOTES}
        element={
          <ProtectedRoute>
            <Layout>
              <Notes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path={`${ROUTES.NOTES}/:id`}
        element={
          <ProtectedRoute>
            <Layout>
              <NoteDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CALENDAR}
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
                    <p className="text-gray-500 text-sm">Loading calendar…</p>
                  </div>
                }
              >
                <Calendar />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;