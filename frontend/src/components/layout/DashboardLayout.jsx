import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import BrandMark from '../ui/BrandMark.jsx';

const STORAGE_KEY = 'ui:sidebar-collapsed';

/**
 * Shell for every signed-in area: the sidebar plus the page. `nav` decides
 * what the sidebar links to (see constants/navigation.constants.js).
 */
export default function DashboardLayout({ nav }) {
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(STORAGE_KEY) === '1'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex h-full overflow-hidden bg-canvas">
      {/* Desktop rail: part of the flex row, so content reflows on collapse. */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar nav={nav} collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>

      {/* Mobile: same rail as an overlay drawer. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-backdrop backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 shadow-float">
            <Sidebar nav={nav} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact top bar, mobile only — desktop gets the rail instead. */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="focus-ring grid size-10 place-items-center rounded-xl text-muted transition
              hover:bg-hover hover:text-ink"
          >
            <Menu className="size-5" />
          </button>

          <BrandMark size="sm" subtitle={nav.subtitle} />
        </header>

        <main className="app-backdrop min-h-0 min-w-0 flex-1 overflow-y-auto">
          {/* Keyed by path, so each new page plays its fade-in. */}
          <div key={pathname} className="page-in h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
