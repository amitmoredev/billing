import { ChartColumn, ReceiptText, Users } from 'lucide-react';

// Each signed-in area is the same shell with its own menu. Adding a page to
// an area is one entry here plus its route in App.jsx.

export const APP_NAV = {
  signOutTo: '/',
  sections: [
    {
      title: 'Workspace',
      items: [
        { to: '/bills', label: 'Sites and Bills', icon: ReceiptText },
        { to: '/analysis', label: 'Analysis', icon: ChartColumn },
      ],
    },
  ],
};

export const ADMIN_NAV = {
  subtitle: 'Admin console',
  signOutTo: '/admin/login',
  sections: [
    {
      title: 'Manage',
      items: [{ to: '/admin/users', label: 'User management', icon: Users }],
    },
  ],
};
