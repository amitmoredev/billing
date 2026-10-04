import { createContext, useContext } from 'react';

// Context and hook live apart from the provider component so the provider file
// only exports components (keeps React Fast Refresh working).
export const ToastContext = createContext({
  toast: () => {},
  dismiss: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);
