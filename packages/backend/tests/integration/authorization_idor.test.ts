import { describe, it, expect, vi } from 'vitest';
import { assertCanAccessEmployee } from '../../src/middlewares/rbacMiddleware.js';
import { AuthSessionUser, Role } from '@skillmatrix/shared';

describe('Authorization & IDOR Protection Tests', () => {
  const adminUser: AuthSessionUser = {
    accountId: 'acc-admin',
    employeeId: 'emp-admin',
    employeeNumber: 'ADM001',
    name: '管理者',
    nameKana: 'カンリシャ',
    email: 'admin@example.com',
    departmentId: 'dept-hq',
    departmentName: '本社',
    departmentCode: 'HQ',
    role: Role.ADMIN
  };

  const generalUser: AuthSessionUser = {
    accountId: 'acc-gen1',
    employeeId: 'emp-gen1',
    employeeNumber: 'EMP001',
    name: '一般社員1',
    nameKana: 'イッパンシャイン1',
    email: 'gen1@example.com',
    departmentId: 'dept-dev1',
    departmentName: '第1開発部',
    departmentCode: 'DEV-1',
    role: Role.GENERAL
  };

  it('ADMIN should be allowed to access any employee', async () => {
    await expect(assertCanAccessEmployee(adminUser, 'target-any-emp', 'write')).resolves.toBeUndefined();
  });

  it('GENERAL should be allowed to access and edit their own record', async () => {
    await expect(assertCanAccessEmployee(generalUser, 'emp-gen1', 'write')).resolves.toBeUndefined();
  });

  it('GENERAL should NOT be allowed to edit other employees records', async () => {
    // 他人のIDを指定
    await expect(assertCanAccessEmployee(generalUser, 'emp-other', 'write')).rejects.toThrow();
  });
});
