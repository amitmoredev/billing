import { Router } from 'express';
import * as billController from '../controllers/bill.controller.js';
import { authorize, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ACTIONS, SUBJECTS } from '../policies/permissions.js';
import {
  billDraftSchema,
  billSubmitSchema,
  bulkAssignSiteSchema,
  idParamSchema,
  listQuerySchema,
  presignSchema,
  statsQuerySchema,
} from '../validators/bill.validator.js';

const router = Router();
const allow = (action) => authorize(action, SUBJECTS.BILL);

// Nothing about bills is public.
router.use(requireAuth);

router.get(
  '/stats',
  allow(ACTIONS.READ),
  validate(statsQuerySchema, 'query'),
  billController.getStats
);

// Upload flow: presign -> browser PUTs to R2 -> confirm.
router.post(
  '/uploads/presign',
  allow(ACTIONS.CREATE),
  validate(presignSchema),
  billController.createUploadIntent
);
router.post(
  '/:id/uploads/confirm',
  allow(ACTIONS.CREATE),
  validate(idParamSchema, 'params'),
  billController.confirmUpload
);

// Bulk filing of many bills under one site (the temporary "Assign bills" screen).
router.patch('/site', allow(ACTIONS.UPDATE), validate(bulkAssignSiteSchema), billController.assignSite);

router.get('/', allow(ACTIONS.READ), validate(listQuerySchema, 'query'), billController.listBills);
router.get('/:id', allow(ACTIONS.READ), validate(idParamSchema, 'params'), billController.getBill);

// Parameter flow: draft saves, then one final submit.
router.patch(
  '/:id/parameters',
  allow(ACTIONS.UPDATE),
  validate(idParamSchema, 'params'),
  validate(billDraftSchema),
  billController.saveParameters
);
router.post(
  '/:id/parameters/submit',
  allow(ACTIONS.UPDATE),
  validate(idParamSchema, 'params'),
  validate(billSubmitSchema),
  billController.submitParameters
);

router.delete(
  '/:id',
  allow(ACTIONS.DELETE),
  validate(idParamSchema, 'params'),
  billController.deleteBill
);

export default router;
