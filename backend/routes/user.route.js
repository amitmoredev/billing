import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authorize, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ACTIONS, SUBJECTS } from '../policies/permissions.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validators/user.validator.js';

const router = Router();
const allow = (action) => authorize(action, SUBJECTS.USER);

// Admin console: decides which numbers can sign in.
router.use(requireAuth);

router.get(
  '/',
  allow(ACTIONS.READ),
  validate(listUsersQuerySchema, 'query'),
  userController.listUsers
);
router.post('/', allow(ACTIONS.CREATE), validate(createUserSchema), userController.createUser);
router.patch(
  '/:id',
  allow(ACTIONS.UPDATE),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.updateUser
);
router.delete(
  '/:id',
  allow(ACTIONS.DELETE),
  validate(userIdParamSchema, 'params'),
  userController.deleteUser
);

export default router;
