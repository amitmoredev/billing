import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/theme.context.js';

/**
 * Single-button theme switch. Both icons are rendered and cross-faded so the
 * control never changes size between themes.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`focus-ring relative grid size-10 shrink-0 place-items-center rounded-xl border border-line
        bg-surface text-muted transition hover:border-line-strong hover:bg-hover hover:text-ink ${className}`}
    >
      <Sun
        className={`absolute size-5 transition-all duration-300 ${
          isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute size-5 transition-all duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}
