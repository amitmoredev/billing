import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import BrandMark from '../ui/BrandMark.jsx';
import ProfileMenu from './ProfileMenu.jsx';

/**
 * Left rail. Two widths only — expanded (labels) and collapsed (icons) — so the
 * content area keeps a predictable amount of room in both states. What it
 * links to comes from `nav` (see constants/navigation.constants.js).
 */
export default function Sidebar({ nav, collapsed = false, onToggle, onClose }) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-line bg-surface transition-[width] duration-300 ease-out
        ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Brand */}
      <div
        className={`flex h-18 shrink-0 items-center gap-3 overflow-hidden border-b border-line ${
          collapsed ? 'justify-center px-3' : 'px-5'
        }`}
      >
        {/* Words only, no logo tile. Collapsed, the short name alone fits the narrow rail. */}
        <BrandMark
          showLogo={false}
          showTagline={!collapsed}
          subtitle={collapsed ? null : nav.subtitle}
          className={collapsed ? '' : 'flex-1'}
        />

        {!collapsed && (
          <>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="focus-ring hidden size-9 shrink-0 place-items-center rounded-xl text-subtle transition
                hover:bg-hover hover:text-ink lg:grid"
            >
              <PanelLeftClose className="size-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="focus-ring grid size-9 shrink-0 place-items-center rounded-xl text-subtle transition
                hover:bg-hover hover:text-ink lg:hidden"
            >
              <X className="size-5" />
            </button>
          </>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="focus-ring mx-auto mt-4 grid size-10 place-items-center rounded-xl text-subtle transition
            hover:bg-hover hover:text-ink"
        >
          <PanelLeftOpen className="size-5" />
        </button>
      )}

      {/* Navigation. Scrolls vertically only — nothing may push it sideways. */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-5 ${collapsed ? 'px-3' : 'px-4'}`}>
        {nav.sections.map((section, index) => (
          <div key={section.title} className={index ? 'mt-7' : ''}>
            {collapsed ? (
              <div className="mx-auto mb-3 h-px w-8 bg-line" aria-hidden />
            ) : (
              <p className="label-caps mb-2.5 px-3">{section.title}</p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavItem item={item} collapsed={collapsed} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account: opens a menu with theme and sign-out. */}
      <div className="shrink-0 border-t border-line p-3">
        <ProfileMenu collapsed={collapsed} signOutTo={nav.signOutTo} onSignOut={onClose} />
      </div>
    </aside>
  );
}

function NavItem({ item, collapsed, onNavigate }) {
  const IconComponent = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `focus-ring group relative flex h-11 items-center rounded-xl text-sm font-semibold transition duration-200
        ${collapsed ? 'justify-center' : 'gap-3 px-3'}
        ${
          isActive
            ? 'bg-linear-to-br from-accent to-accent-hover text-on-accent shadow-accent'
            : 'text-muted hover:bg-hover hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <IconComponent
            className={`size-5 shrink-0 transition ${
              isActive ? 'text-on-accent' : 'text-subtle group-hover:text-ink'
            }`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
