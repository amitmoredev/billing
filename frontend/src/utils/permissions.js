import { ACTIONS, SUBJECTS } from '../constants/permission.constants.js';

// `createdBy` may be a raw id or a populated { id }.
const ownerId = (record) => {
  const owner = record?.createdBy;
  return owner ? String(owner.id ?? owner) : null;
};

/**
 * Same matching as the API's `can`, run over the rules the session carries.
 * Without `record` an `own` rule counts ("may do this to some of them"); with
 * one, it counts only if `userId` created it.
 */
export const hasPermission = (rules, action, subject, record, userId) =>
  (rules ?? []).some(
    (rule) =>
      (rule.action === ACTIONS.MANAGE || rule.action === action) &&
      (rule.subject === SUBJECTS.ALL || rule.subject === subject) &&
      (!rule.own || record === undefined || (userId != null && ownerId(record) === String(userId)))
  );
