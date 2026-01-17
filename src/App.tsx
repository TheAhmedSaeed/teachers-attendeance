import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { ConfigPage } from './pages/ConfigPage';
import { AbsencePage } from './pages/AbsencePage';
import { AbsenceListPage } from './pages/AbsenceListPage';
import { TardinessPage } from './pages/TardinessPage';
import { TardinessListPage } from './pages/TardinessListPage';
import { AbsenceReportPage } from './pages/AbsenceReportPage';
import { TardinessReportPage } from './pages/TardinessReportPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { TeacherDetailsPage } from './pages/TeacherDetailsPage';
import { UsersPage } from './pages/UsersPage';
import { Loader2 } from 'lucide-react';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// App Routes Component (needs to be inside AuthProvider)
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <MainPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/config"
        element={
          <ProtectedRoute>
            <Layout>
              <ConfigPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/absence"
        element={
          <ProtectedRoute>
            <Layout>
              <AbsencePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/absence-list"
        element={
          <ProtectedRoute>
            <Layout>
              <AbsenceListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tardiness"
        element={
          <ProtectedRoute>
            <Layout>
              <TardinessPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tardiness-list"
        element={
          <ProtectedRoute>
            <Layout>
              <TardinessListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/absence-report"
        element={
          <ProtectedRoute>
            <Layout>
              <AbsenceReportPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tardiness-report"
        element={
          <ProtectedRoute>
            <Layout>
              <TardinessReportPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <Layout>
              <StatisticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/:teacherId"
        element={
          <ProtectedRoute>
            <Layout>
              <TeacherDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UsersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
