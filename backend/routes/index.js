import { Router } from 'express';
import authRoutes from './auth.route.js';
import billRoutes from './bill.route.js';
import siteRoutes from './site.route.js';
import userRoutes from './user.route.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/bills', billRoutes);
router.use('/sites', siteRoutes);
router.use('/admin/users', userRoutes);

export default router;
