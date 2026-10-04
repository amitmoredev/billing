import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import RedirectIfAuthed from './components/auth/RedirectIfAuthed.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BillsPage from './pages/BillsPage.jsx';
import BillDetailPage from './pages/BillDetailPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import { ADMIN_CONSOLE } from './constants/permission.constants.js';
import { ADMIN_NAV, APP_NAV } from './constants/navigation.constants.js';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route index element={<LandingPage />} />
      <Route element={<RedirectIfAuthed />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* Dashboard */}
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout nav={APP_NAV} />}>
          <Route path="bills" element={<BillsPage />} />
          <Route path="bills/:id" element={<BillDetailPage />} />
        </Route>
      </Route>

      {/* Admin console — reached by URL only, never linked from the app. */}
      <Route path="admin">
        <Route
          element={<RedirectIfAuthed to="/admin/users" permission={ADMIN_CONSOLE.permission} />}
        >
          <Route path="login" element={<AdminLoginPage />} />
        </Route>

        <Route
          element={<RequireAuth loginPath="/admin/login" permission={ADMIN_CONSOLE.permission} />}
        >
          <Route element={<DashboardLayout nav={ADMIN_NAV} />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
