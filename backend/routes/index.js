import { Router } from 'express';
import analyticsRoutes from './analytics.route.js';
import authRoutes from './auth.route.js';
import billFieldRoutes from './bill-field.route.js';
import billRoutes from './bill.route.js';
import siteRoutes from './site.route.js';
import userRoutes from './user.route.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/bills', billRoutes);
router.use('/bill-fields', billFieldRoutes);
router.use('/sites', siteRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin/users', userRoutes);

export default router;
