import { ListChecks, MapPin, Users } from 'lucide-react';

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
        { to: '/sites', label: 'Sites & Bills', icon: MapPin, except: '/sites/assign' },
        // TEMPORARY: remove once every pre-sites bill is filed under a site.
        { to: '/sites/assign', label: 'Assign bills', icon: ListChecks },
        // Hidden until the Analysis page exists:
        // { to: '/analysis', label: 'Analysis', icon: ChartColumn },
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
        { to: '/admin/sites', label: 'Sites & Bills', icon: MapPin, except: '/admin/sites/assign' },
        // TEMPORARY: remove once every pre-sites bill is filed under a site.
        { to: '/admin/sites/assign', label: 'Assign bills', icon: ListChecks },
      ],
    },
  ],
};
