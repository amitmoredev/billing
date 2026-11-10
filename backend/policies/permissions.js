import { ROLES } from '../models/user.model.js';

/**
 * Who may do what. This file is the only place a role turns into a permission;
 * callers ask `can(user, action, subject, record?)` and never compare roles
 * themselves.
 *
 * Rules are shaped like CASL's (an action on a subject, `manage` = any action,
 * `all` = any subject). One condition exists: `own: true` limits a rule to
 * records whose `createdBy` is the user. If conditions grow beyond that, swap
 * this file for @casl/ability; callers stay the same.
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
  BILL_FIELD: 'BillField', // the bill parameter form's fields and sections
  SITE: 'Site',
  USER: 'User',
};

const RULES_BY_ROLE = {
  [ROLES.ADMIN]: [{ action: ACTIONS.MANAGE, subject: SUBJECTS.ALL }],
  [ROLES.CLIENT]: [
    { action: ACTIONS.MANAGE, subject: SUBJECTS.BILL },
    // Clients fill the form; the fields on it are the admin's to change.
    { action: ACTIONS.READ, subject: SUBJECTS.BILL_FIELD },
    // Every site is visible and can take bills; only its creator may change or remove it.
    { action: ACTIONS.READ, subject: SUBJECTS.SITE },
    { action: ACTIONS.CREATE, subject: SUBJECTS.SITE },
    { action: ACTIONS.UPDATE, subject: SUBJECTS.SITE, own: true },
    { action: ACTIONS.DELETE, subject: SUBJECTS.SITE, own: true },
  ],
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

// `createdBy` may be a raw id or a populated { id } / { _id }.
const ownerId = (record) => {
  const owner = record?.createdBy;
  return owner ? String(owner._id ?? owner.id ?? owner) : null;
};

/**
 * Without `record` this answers "may the user do this to any such thing?" — an
 * `own` rule counts — which is what route guards ask. With `record`, an `own`
 * rule only counts if the user created it; services ask that once they have
 * loaded the record.
 */
export const can = (user, action, subject, record) =>
  rulesFor(user).some(
    (rule) =>
      (rule.action === ACTIONS.MANAGE || rule.action === action) &&
      (rule.subject === SUBJECTS.ALL || rule.subject === subject) &&
      (!rule.own || record === undefined || ownerId(record) === String(user._id ?? user.id))
  );
