import { Hono } from 'hono';
import { AuditService } from '../services/audit.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { Role } from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const auditRoutes = new Hono<AppEnv>();

auditRoutes.use('*', authMiddleware());

// 監査ログ一覧取得 (ADMIN専用)
auditRoutes.get('/', requireRoles([Role.ADMIN]), async (c) => {
  const query = c.req.query();
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '50', 10);
  const keyword = query.keyword;
  const action = query.action;
  const targetType = query.targetType;
  const targetId = query.targetId;
  const actorId = query.actorId;
  const startDate = query.startDate;
  const endDate = query.endDate;

  const result = await AuditService.list({
    page,
    limit,
    keyword,
    action,
    targetType,
    targetId,
    actorId,
    startDate,
    endDate
  });

  return c.json({
    success: true,
    data: result
  });
});
