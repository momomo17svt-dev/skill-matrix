import { Hono } from 'hono';
import { DepartmentService } from '../services/department.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  Role,
  AuthSessionUser
} from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const departmentRoutes = new Hono<AppEnv>();

departmentRoutes.use('*', authMiddleware());

// 部署一覧・ツリー取得
departmentRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const tree = await DepartmentService.getTree(user);
  return c.json({
    success: true,
    data: tree
  });
});

// 部署作成 (ADMINのみ)
departmentRoutes.post('/', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = CreateDepartmentSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const dept = await DepartmentService.create({
    code: validated.code,
    name: validated.name,
    parentId: validated.parentId,
    sortOrder: validated.sortOrder,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: dept
  }, 201);
});

// 部署更新 (ADMINのみ)
departmentRoutes.put('/:id', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const body = await c.req.json();
  const validated = UpdateDepartmentSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const dept = await DepartmentService.update(id, {
    code: validated.code,
    name: validated.name,
    parentId: validated.parentId,
    sortOrder: validated.sortOrder,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: dept
  });
});

// 部署削除 (ADMINのみ)
departmentRoutes.delete('/:id', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await DepartmentService.delete(id, user, ip, requestId);

  return c.json({
    success: true,
    data: { message: '部署を削除しました。' }
  });
});
