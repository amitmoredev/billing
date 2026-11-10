import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import RedirectIfAuthed from './components/auth/RedirectIfAuthed.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SitesPage from './pages/SitesPage.jsx';
import SiteDetailPage from './pages/SiteDetailPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import BillDetailPage, { LegacyBillRedirect } from './pages/BillDetailPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import BillFieldsPage from './pages/admin/BillFieldsPage.jsx';
import { ADMIN_CONSOLE } from './constants/permission.constants.js';
import { ADMIN_NAV, APP_NAV } from './constants/navigation.constants.js';

/**
 * Sites & Bills: sites -> one site -> one bill. Mounted in the dashboard and
 * again in the admin console; pages build their links with useSitePaths, so
 * each stays inside whichever area it was opened from.
 */
const siteRoutes = (
  <>
    <Route index element={<SitesPage />} />
    <Route path=":siteId" element={<SiteDetailPage />} />
    <Route path=":siteId/bills/:billId" element={<BillDetailPage />} />
  </>
);

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
          <Route path="sites">{siteRoutes}</Route>
          <Route path="analysis" element={<AnalysisPage />} />
          {/* Bills used to live at /bills; old links and bookmarks still land somewhere sensible. */}
          <Route path="bills" element={<Navigate to="/sites" replace />} />
          <Route path="bills/:billId" element={<LegacyBillRedirect />} />
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
            <Route path="sites">{siteRoutes}</Route>
            <Route path="parameters" element={<BillFieldsPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
