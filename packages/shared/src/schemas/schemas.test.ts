import { describe, it, expect } from 'vitest';
import { LoginRequestSchema, CreateEmployeeSchema, CreateDepartmentSchema } from './index.js';
import { Role, EmployeeStatus } from '../enums/index.js';

describe('Shared Zod Schemas', () => {
  it('should validate valid login request', () => {
    const valid = { loginId: 'admin', password: 'password123' };
    expect(LoginRequestSchema.safeParse(valid).success).toBe(true);

    const invalid = { loginId: '', password: '' };
    expect(LoginRequestSchema.safeParse(invalid).success).toBe(false);
  });

  it('should validate create employee schema', () => {
    const valid = {
      employeeNumber: 'EMP001',
      name: '山田 太郎',
      nameKana: 'ヤマダ タロウ',
      email: 'yamada@example.com',
      departmentId: 'a0000000-0000-0000-0000-000000000001',
      hireDate: '2022-04-01',
      role: Role.GENERAL,
      status: EmployeeStatus.ACTIVE
    };
    expect(CreateEmployeeSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = { ...valid, email: 'invalid-email' };
    expect(CreateEmployeeSchema.safeParse(invalidEmail).success).toBe(false);

    const invalidDate = { ...valid, hireDate: '2022/04/01' };
    expect(CreateEmployeeSchema.safeParse(invalidDate).success).toBe(false);
  });

  it('should validate create department schema', () => {
    const valid = {
      code: 'DEV-1',
      name: '第1開発部',
      sortOrder: 1
    };
    expect(CreateDepartmentSchema.safeParse(valid).success).toBe(true);
  });
});
