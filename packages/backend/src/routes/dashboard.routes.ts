import { Hono } from 'hono';
import { DashboardService } from '../services/dashboard.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { AuthSessionUser } from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const dashboardRoutes = new Hono<AppEnv>();

dashboardRoutes.use('*', authMiddleware());

// ダッシュボード集計データ取得
dashboardRoutes.get('/stats', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const stats = await DashboardService.getStats(user);
  return c.json({
    success: true,
    data: stats
  });
});
