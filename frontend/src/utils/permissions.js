import { ACTIONS, SUBJECTS } from '../constants/permission.constants.js';

/** Same matching as the API's `can`, run over the rules the session carries. */
export const hasPermission = (rules, action, subject) =>
  (rules ?? []).some(
    (rule) =>
      (rule.action === ACTIONS.MANAGE || rule.action === action) &&
      (rule.subject === SUBJECTS.ALL || rule.subject === subject)
  );
