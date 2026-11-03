import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authorize, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ACTIONS, SUBJECTS } from '../policies/permissions.js';
import { overviewQuerySchema } from '../validators/analytics.validator.js';

const router = Router();

// Analysis is a read over bills, so whoever may read bills may see it.
router.use(requireAuth);

router.get(
  '/',
  authorize(ACTIONS.READ, SUBJECTS.BILL),
  validate(overviewQuerySchema, 'query'),
  analyticsController.getOverview
);

export default router;
