import { ChartColumn, MapPin, Users } from 'lucide-react';

// Each signed-in area is the same shell with its own menu. Adding a page to
// an area is one entry here plus its route in App.jsx. `except` keeps an item
// from lighting up on one of its sub-paths that has its own entry.

export const APP_NAV = {
  signOutTo: '/',
  sections: [
    {
      title: 'Workspace',
      items: [
        // Sites hold their bills; it stays highlighted on a site's and a bill's page too.
        { to: '/sites', label: 'Sites & Bills', icon: MapPin },
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
      items: [
        { to: '/admin/users', label: 'User management', icon: Users },
        { to: '/admin/sites', label: 'Sites & Bills', icon: MapPin },
        { to: '/admin/analysis', label: 'Analysis', icon: ChartColumn },
      ],
    },
  ],
};
