import { Router } from 'express';
import * as siteController from '../controllers/site.controller.js';
import { authorize, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ACTIONS, SUBJECTS } from '../policies/permissions.js';
import { createSiteSchema, siteIdParamSchema, updateSiteSchema } from '../validators/site.validator.js';

const router = Router();
const allow = (action) => authorize(action, SUBJECTS.SITE);

router.use(requireAuth);

router.get('/', allow(ACTIONS.READ), siteController.listSites);
router.post('/', allow(ACTIONS.CREATE), validate(createSiteSchema), siteController.createSite);
router.patch(
  '/:id',
  allow(ACTIONS.UPDATE),
  validate(siteIdParamSchema, 'params'),
  validate(updateSiteSchema),
  siteController.updateSite
);
router.delete(
  '/:id',
  allow(ACTIONS.DELETE),
  validate(siteIdParamSchema, 'params'),
  siteController.deleteSite
);

export default router;
