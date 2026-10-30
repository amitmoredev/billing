import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme.context.js';

const STORAGE_KEY = 'ui:theme';

/** Light unless the user has chosen dark. Keep in sync with the script in index.html. */
function readInitialTheme() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light'; // storage blocked (private mode, strict settings)
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#070b16' : '#f8fafc');
  }, [theme]);

  // Only an explicit choice is remembered, so the default can change later.
  const setTheme = useCallback((next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered across visits, but the switch still applies now.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme]
  );

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
