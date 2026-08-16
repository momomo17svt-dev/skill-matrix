import { Hono } from 'hono';
import { EmployeeService } from '../services/employee.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles, assertCanAccessEmployee } from '../middlewares/rbacMiddleware.js';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  Role,
  AuthSessionUser
} from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const employeeRoutes = new Hono<AppEnv>();

employeeRoutes.use('*', authMiddleware());

// 社員一覧取得 (サーバーサイドページネーション)
employeeRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const query = c.req.query();

  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '25', 10);
  const sortBy = query.sortBy;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
  const search = query.search;
  const departmentId = query.departmentId;
  const status = query.status;
  const role = query.role;

  const result = await EmployeeService.list(user, {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    departmentId,
    status,
    role
  });

  return c.json({
    success: true,
    data: result
  });
});

// 社員詳細取得 (IDOR検証)
employeeRoutes.get('/:id', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');

  await assertCanAccessEmployee(user, id, 'read');

  const detail = await EmployeeService.getById(id);

  return c.json({
    success: true,
    data: detail
  });
});

// 社員新規登録 (ADMINのみ)
employeeRoutes.post('/', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = CreateEmployeeSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const created = await EmployeeService.create({
    employeeNumber: validated.employeeNumber,
    name: validated.name,
    nameKana: validated.nameKana,
    email: validated.email,
    departmentId: validated.departmentId,
    position: validated.position,
    role: validated.role,
    hireDate: validated.hireDate,
    status: validated.status,
    notes: validated.notes,
    initialPassword: validated.initialPassword,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: created
  }, 201);
});

// 社員更新 (IDOR検証 & 権限制御)
employeeRoutes.put('/:id', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');

  await assertCanAccessEmployee(user, id, 'write');

  const body = await c.req.json();
  const validated = UpdateEmployeeSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const updated = await EmployeeService.update(id, {
    name: validated.name,
    nameKana: validated.nameKana,
    email: validated.email,
    departmentId: validated.departmentId,
    position: validated.position,
    role: validated.role,
    hireDate: validated.hireDate,
    status: validated.status,
    notes: validated.notes,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: updated
  });
});

// 社員削除 (ADMINのみ & トランザクション・ファイル整合削除)
employeeRoutes.delete('/:id', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await EmployeeService.delete(id, user, ip, requestId);

  return c.json({
    success: true,
    data: { message: '社員を完全に削除しました。' }
  });
});
