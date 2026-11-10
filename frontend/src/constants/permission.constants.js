// Names from backend/policies/permissions.js. The rules themselves arrive with
// the session, so the UI never decides on its own what a role may do.

export const ACTIONS = {
  MANAGE: 'manage',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
};

export const SUBJECTS = {
  ALL: 'all',
  BILL: 'Bill',
  BILL_FIELD: 'BillField',
  SITE: 'Site',
  USER: 'User',
};

/** The admin console: the sign-in scope sent to the API, and what its pages require. */
export const ADMIN_CONSOLE = {
  scope: 'admin',
  permission: [ACTIONS.MANAGE, SUBJECTS.USER],
};
