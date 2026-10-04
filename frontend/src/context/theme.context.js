import { createContext, useContext } from 'react';

// Context and hook live apart from the provider component so the provider file
// only exports components (keeps React Fast Refresh working).
export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
