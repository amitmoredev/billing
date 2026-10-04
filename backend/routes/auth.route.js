import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth.validator.js';

const router = Router();

// Login is two calls: get a WhatsApp code, then trade it for a session cookie.
// The admin console sends `scope: 'admin'` so only admin accounts get a code.
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

router.get('/me', requireAuth, authController.me);
router.post('/logout', authController.logout);

export default router;
