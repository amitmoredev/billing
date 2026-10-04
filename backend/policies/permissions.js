import { ROLES } from '../models/user.model.js';

/**
 * Who may do what. This file is the only place a role turns into a permission;
 * routes ask `can(user, action, subject)` and never compare roles themselves.
 *
 * Rules are shaped like CASL's (an action on a subject, `manage` = any action,
 * `all` = any subject). Once rules need conditions, e.g. "clients see only
 * their own bills", swap this file for @casl/ability; callers stay the same.
 */

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
  USER: 'User',
};

const RULES_BY_ROLE = {
  [ROLES.ADMIN]: [{ action: ACTIONS.MANAGE, subject: SUBJECTS.ALL }],
  [ROLES.CLIENT]: [{ action: ACTIONS.MANAGE, subject: SUBJECTS.BILL }],
};

/**
 * Sign-in scopes a login request may ask for, and what the account must be
 * able to do to get through. No scope = any active account (the dashboard).
 */
export const SIGN_IN_SCOPES = {
  admin: [ACTIONS.MANAGE, SUBJECTS.USER],
};

/** Plain-data rules for one account. Sent to the browser so the UI asks the same question. */
export const rulesFor = (user) => RULES_BY_ROLE[user?.role] ?? [];

export const can = (user, action, subject) =>
  rulesFor(user).some(
    (rule) =>
      (rule.action === ACTIONS.MANAGE || rule.action === action) &&
      (rule.subject === SUBJECTS.ALL || rule.subject === subject)
  );
