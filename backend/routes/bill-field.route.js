import { Router } from 'express';
import * as billFieldController from '../controllers/bill-field.controller.js';
import { authorize, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ACTIONS, SUBJECTS } from '../policies/permissions.js';
import {
  createFieldSchema,
  createGroupSchema,
  idParamSchema,
  moveSchema,
  updateFieldSchema,
  updateGroupSchema,
} from '../validators/bill-field.validator.js';

const router = Router();
const allow = (action) => authorize(action, SUBJECTS.BILL_FIELD);
const byId = validate(idParamSchema, 'params');

// The bill parameter form: everyone filling bills reads it; who may change it is in permissions.js.
router.use(requireAuth);

router.get('/', allow(ACTIONS.READ), billFieldController.listDefinitions);

// Sections. Declared before the field routes so "groups" is never read as a field id.
router.post('/groups', allow(ACTIONS.CREATE), validate(createGroupSchema), billFieldController.createGroup);
router.patch('/groups/:id', allow(ACTIONS.UPDATE), byId, validate(updateGroupSchema), billFieldController.updateGroup);
router.post('/groups/:id/move', allow(ACTIONS.UPDATE), byId, validate(moveSchema), billFieldController.moveGroup);
router.delete('/groups/:id', allow(ACTIONS.DELETE), byId, billFieldController.deleteGroup);

router.post('/', allow(ACTIONS.CREATE), validate(createFieldSchema), billFieldController.createField);
router.patch('/:id', allow(ACTIONS.UPDATE), byId, validate(updateFieldSchema), billFieldController.updateField);
router.post('/:id/move', allow(ACTIONS.UPDATE), byId, validate(moveSchema), billFieldController.moveField);
router.delete('/:id', allow(ACTIONS.DELETE), byId, billFieldController.deleteField);

export default router;
