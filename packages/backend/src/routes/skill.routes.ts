import { Hono } from 'hono';
import { SkillService } from '../services/skill.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles, assertCanAccessEmployee } from '../middlewares/rbacMiddleware.js';
import {
  CreateSkillSchema,
  CreateSkillCategorySchema,
  SetSelfEvaluationSchema,
  SetManagerEvaluationSchema,
  Role,
  AuthSessionUser
} from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const skillRoutes = new Hono<AppEnv>();

skillRoutes.use('*', authMiddleware());

// 部署のスキルセット一覧取得
skillRoutes.get('/department/:departmentId', async (c) => {
  const departmentId = c.req.param('departmentId');
  const skills = await SkillService.getDepartmentSkills(departmentId);
  return c.json({
    success: true,
    data: skills
  });
});

// スキルカテゴリ作成 (ADMIN / MANAGER)
skillRoutes.post('/category', requireRoles([Role.ADMIN, Role.DEPARTMENT_MANAGER]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = CreateSkillCategorySchema.parse(body);

  const category = await SkillService.createCategory({
    departmentId: validated.departmentId,
    name: validated.name,
    sortOrder: validated.sortOrder,
    user
  });

  return c.json({
    success: true,
    data: category
  }, 201);
});

// スキル定義作成 (ADMIN / MANAGER)
skillRoutes.post('/', requireRoles([Role.ADMIN, Role.DEPARTMENT_MANAGER]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = CreateSkillSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  const skill = await SkillService.createSkill({
    categoryId: validated.categoryId,
    departmentId: validated.departmentId,
    name: validated.name,
    notes: validated.notes,
    sortOrder: validated.sortOrder,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: skill
  }, 201);
});

// 自己評価入力
skillRoutes.post('/evaluations/self', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = SetSelfEvaluationSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await assertCanAccessEmployee(user, validated.employeeId, 'write');

  const evaluation = await SkillService.evaluateSelf({
    employeeId: validated.employeeId,
    skillId: validated.skillId,
    level: validated.level,
    reason: validated.reason,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: evaluation
  });
});

// 所属長評価入力 (ADMIN / MANAGER)
skillRoutes.post('/evaluations/manager', requireRoles([Role.ADMIN, Role.DEPARTMENT_MANAGER]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = SetManagerEvaluationSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await assertCanAccessEmployee(user, validated.employeeId, 'write');

  const evaluation = await SkillService.evaluateManager({
    employeeId: validated.employeeId,
    skillId: validated.skillId,
    level: validated.level,
    reason: validated.reason,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: evaluation
  });
});

// スキル評価履歴一覧取得
skillRoutes.get('/evaluations/history/:employeeId', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const employeeId = c.req.param('employeeId');

  await assertCanAccessEmployee(user, employeeId, 'read');

  const histories = await SkillService.getEvaluationHistory(employeeId);

  return c.json({
    success: true,
    data: histories
  });
});
