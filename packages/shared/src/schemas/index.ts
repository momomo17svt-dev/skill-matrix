import { z } from 'zod';
import { Role, EmployeeStatus, SkillLevel, EvaluationType } from '../enums/index.js';
import { AUTH_CONSTANTS } from '../constants/index.js';

// ==========================================
// 共通 / ページネーション
// ==========================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional()
});

// ==========================================
// 認証 (Auth)
// ==========================================
export const LoginRequestSchema = z.object({
  loginId: z.string().min(1, 'ログインIDを入力してください。'),
  password: z.string().min(1, 'パスワードを入力してください。')
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください。'),
  newPassword: z.string().min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `新しいパスワードは${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH}文字以上で入力してください。`)
});

export const InitialPasswordChangeRequestSchema = z.object({
  newPassword: z.string().min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `新しいパスワードは${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH}文字以上で入力してください。`)
});

export const AdminResetPasswordRequestSchema = z.object({
  accountId: z.string().uuid(),
  newPassword: z.string().min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `新しいパスワードは${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH}文字以上で入力してください。`)
});

// ==========================================
// 部署 (Department)
// ==========================================
export const CreateDepartmentSchema = z.object({
  code: z.string().min(1, '部署コードを入力してください。').max(50),
  name: z.string().min(1, '部署名を入力してください。').max(100),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().default(0)
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// ==========================================
// 社員 (Employee)
// ==========================================
export const CreateEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, '社員番号を入力してください。').max(50),
  name: z.string().min(1, '氏名を入力してください。').max(100),
  nameKana: z.string().min(1, '氏名カナを入力してください。').max(100),
  email: z.string().email('正しいメールアドレス形式で入力してください。').max(255),
  departmentId: z.string().uuid('有効な部署を選択してください。'),
  position: z.string().max(50).nullable().optional(),
  role: z.nativeEnum(Role).default(Role.GENERAL),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '入社日は YYYY-MM-DD 形式で入力してください。'),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  notes: z.string().max(2000).nullable().optional(),
  initialPassword: z.string().min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH).optional()
});

export const UpdateEmployeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameKana: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  departmentId: z.string().uuid().optional(),
  position: z.string().max(50).nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  notes: z.string().max(2000).nullable().optional()
});

// ==========================================
// スキル & 評価 (Skill & Evaluation)
// ==========================================
export const CreateSkillCategorySchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().min(1, 'カテゴリ名を入力してください。').max(100),
  sortOrder: z.number().int().default(0)
});

export const CreateSkillSchema = z.object({
  categoryId: z.string().uuid(),
  departmentId: z.string().uuid(),
  name: z.string().min(1, 'スキル名を入力してください。').max(100),
  notes: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().default(0)
});

export const UpdateSkillSchema = CreateSkillSchema.partial();

export const SetSelfEvaluationSchema = z.object({
  employeeId: z.string().uuid(),
  skillId: z.string().uuid(),
  level: z.nativeEnum(SkillLevel),
  reason: z.string().max(500).optional()
});

export const SetManagerEvaluationSchema = z.object({
  employeeId: z.string().uuid(),
  skillId: z.string().uuid(),
  level: z.nativeEnum(SkillLevel),
  reason: z.string().max(500).optional()
});

// ==========================================
// 資格 (Certification)
// ==========================================
export const CreateCertificationMasterSchema = z.object({
  name: z.string().min(1, '資格名を入力してください。').max(100),
  issuer: z.string().max(100).nullable().optional(),
  category: z.string().max(50).nullable().optional()
});

export const CreateEmployeeCertificationSchema = z.object({
  employeeId: z.string().uuid(),
  certificationMasterId: z.string().uuid().nullable().optional(),
  customCertificationName: z.string().max(100).nullable().optional(),
  acquiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '取得日は YYYY-MM-DD 形式で入力してください。'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '有効期限は YYYY-MM-DD 形式で入力してください。').nullable().optional(),
  certificateNumber: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional()
});

export const UpdateEmployeeCertificationSchema = CreateEmployeeCertificationSchema.partial();

// ==========================================
// 実務経歴 (Work History)
// ==========================================
export const CreateWorkHistorySchema = z.object({
  employeeId: z.string().uuid(),
  projectName: z.string().min(1, '案件名を入力してください。').max(150),
  description: z.string().max(2000).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  startYearMonth: z.string().regex(/^\d{4}-\d{2}$/, '開始年月は YYYY-MM 形式で入力してください。'),
  endYearMonth: z.string().regex(/^\d{4}-\d{2}$/, '終了年月は YYYY-MM 形式で入力してください。').nullable().optional(),
  isCurrent: z.boolean().default(false),
  notes: z.string().max(1000).nullable().optional(),
  skills: z.array(z.object({
    skillName: z.string().min(1).max(100),
    category: z.string().max(50).nullable().optional()
  })).default([])
});

export const UpdateWorkHistorySchema = CreateWorkHistorySchema.partial();

// ==========================================
// 人材検索 (Search)
// ==========================================
export const SearchFilterSchema = z.object({
  name: z.string().optional(),
  employeeNumber: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  includeSubDepartments: z.boolean().default(true),
  position: z.string().optional(),
  certificationName: z.string().optional(),
  skillId: z.string().uuid().optional(),
  skillName: z.string().optional(),
  selfLevel: z.nativeEnum(SkillLevel).optional(),
  managerLevel: z.nativeEnum(SkillLevel).optional(),
  minExperienceYears: z.number().min(0).optional(),
  usedTechnology: z.string().optional(),
  status: z.nativeEnum(EmployeeStatus).optional()
});

export const SearchQuerySchema = PaginationQuerySchema.extend({
  filter: SearchFilterSchema.optional()
});
