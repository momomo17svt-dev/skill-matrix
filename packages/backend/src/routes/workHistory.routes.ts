import { Hono } from 'hono';
import { WorkHistoryService } from '../services/workHistory.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { assertCanAccessEmployee } from '../middlewares/rbacMiddleware.js';
import {
  CreateWorkHistorySchema,
  UpdateWorkHistorySchema,
  AuthSessionUser
} from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const workHistoryRoutes = new Hono<AppEnv>();

workHistoryRoutes.use('*', authMiddleware());

// 社員の実務経歴一覧 & 期間Union集計取得
workHistoryRoutes.get('/employee/:employeeId', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const employeeId = c.req.param('employeeId');

  await assertCanAccessEmployee(user, employeeId, 'read');

  const result = await WorkHistoryService.listByEmployee(employeeId);

  return c.json({
    success: true,
    data: result
  });
});

// 実務経歴新規作成
workHistoryRoutes.post('/employee/:employeeId', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const employeeId = c.req.param('employeeId');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await assertCanAccessEmployee(user, employeeId, 'write');

  const body = await c.req.json();
  const validated = CreateWorkHistorySchema.parse({ ...body, employeeId });

  const work = await WorkHistoryService.create({
    employeeId,
    projectName: validated.projectName,
    description: validated.description,
    role: validated.role,
    startYearMonth: validated.startYearMonth,
    endYearMonth: validated.isCurrent || !validated.endYearMonth ? null : validated.endYearMonth,
    isCurrent: validated.isCurrent,
    notes: validated.notes,
    skills: validated.skills || [],
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: work
  }, 201);
});

// 実務経歴更新
workHistoryRoutes.put('/:id', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const body = await c.req.json();
  const validated = UpdateWorkHistorySchema.parse(body);

  const work = await WorkHistoryService.update(id, {
    projectName: validated.projectName,
    description: validated.description,
    role: validated.role,
    startYearMonth: validated.startYearMonth,
    endYearMonth: validated.endYearMonth,
    isCurrent: validated.isCurrent,
    notes: validated.notes,
    skills: validated.skills,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: work
  });
});

// 実務経歴削除
workHistoryRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await WorkHistoryService.delete(id, user, ip, requestId);

  return c.json({
    success: true,
    data: { message: '実務経歴を削除しました。' }
  });
});
