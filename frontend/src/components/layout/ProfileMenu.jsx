import { useEffect, useId, useRef, useState } from 'react';
import { ChevronsUpDown, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useSession } from '../../queries/auth.query.js';
import { useSignOut } from '../../hooks/useSignOut.js';
import { useTheme } from '../../context/theme.context.js';
import { displayName, formatPhone } from '../../utils/format.js';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/**
 * The account button at the foot of the sidebar. Clicking it opens a small
 * panel with the theme switch and sign-out. Outside clicks and Escape close it.
 */
export default function ProfileMenu({ collapsed = false, signOutTo, onSignOut }) {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const { signOut, signingOut } = useSignOut(signOutTo);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => event.key === 'Escape' && setOpen(false);

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = displayName(user);
  const detail = user?.name ? formatPhone(user.phone) : user?.email;

  const handleSignOut = () => {
    setOpen(false);
    onSignOut?.();
    signOut();
  };

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          id={panelId}
          className={`rise-in absolute z-50 rounded-2xl border border-line bg-elevated p-1.5 shadow-float
            ${collapsed ? 'bottom-0 left-full ml-3 w-64' : 'inset-x-0 bottom-full mb-2'}`}
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar user={user} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              {detail && <p className="truncate text-xs text-subtle">{detail}</p>}
            </div>
          </div>

          <div className="my-1 h-px bg-line" />

          <div className="flex items-center justify-between gap-3 px-2.5 py-2">
            <span className="text-sm font-medium text-muted">Theme</span>
            <div role="group" aria-label="Theme" className="flex rounded-lg border border-line bg-sunken p-0.5">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={`focus-ring flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    theme === value ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="focus-ring flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm font-semibold
              text-muted transition hover:bg-hover hover:text-danger-fg disabled:opacity-50"
          >
            <LogOut className="size-4.5" />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={collapsed ? `Account: ${name}` : undefined}
        title={collapsed ? name : undefined}
        className={`focus-ring flex w-full items-center rounded-xl transition hover:bg-hover
          ${open ? 'bg-hover' : ''} ${collapsed ? 'justify-center p-1.5' : 'gap-3 p-2'}`}
      >
        <Avatar user={user} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-semibold text-ink">{name}</span>
              {detail && <span className="block truncate text-xs text-subtle">{detail}</span>}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-subtle" />
          </>
        )}
      </button>
    </div>
  );
}

/** First letter of the name; a person icon when there is no name to take it from. */
function Avatar({ user }) {
  const initial = user?.name?.trim().charAt(0).toUpperCase();

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent">
      {initial || <UserRound className="size-4.5" />}
    </span>
  );
}
