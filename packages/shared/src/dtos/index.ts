import { Role, EmployeeStatus, SkillLevel, EvaluationType, AuditAction, TargetType } from '../enums/index.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AuthSessionUser {
  accountId: string;
  employeeId: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  email: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  position?: string | null;
  role: Role;
  isInitialPassword?: boolean;
}

export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  path: string;
  level: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: DepartmentDto[];
  employeeCount?: number;
}

export interface EmployeeListItemDto {
  id: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position?: string | null;
  role: Role;
  hireDate: string;
  status: EmployeeStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  certificationsCount?: number;
  workHistoriesCount?: number;
}

export interface EmployeeDetailDto extends EmployeeListItemDto {
  departmentPath: string;
  certifications: EmployeeCertificationDto[];
  workHistories: WorkHistoryDto[];
  skills: EmployeeSkillEvaluationDto[];
}

export interface SkillCategoryDto {
  id: string;
  departmentId: string;
  name: string;
  sortOrder: number;
  skills: SkillDto[];
}

export interface SkillDto {
  id: string;
  categoryId: string;
  categoryName?: string;
  departmentId: string;
  name: string;
  notes?: string | null;
  sortOrder: number;
}

export interface EmployeeSkillEvaluationDto {
  skillId: string;
  skillName: string;
  categoryId: string;
  categoryName: string;
  selfLevel: SkillLevel;
  managerLevel: SkillLevel;
  selfEvaluatedAt?: string | null;
  managerEvaluatedAt?: string | null;
  managerEvaluatorName?: string | null;
}

export interface SkillEvaluationHistoryDto {
  id: string;
  evaluationId: string;
  employeeId: string;
  skillId: string;
  skillName: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  evalType: EvaluationType;
  previousLevel: SkillLevel;
  newLevel: SkillLevel;
  reason?: string | null;
  createdAt: string;
}

export interface CertificationMasterDto {
  id: string;
  name: string;
  issuer?: string | null;
  category?: string | null;
}

export interface CertificationAttachmentDto {
  id: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface EmployeeCertificationDto {
  id: string;
  employeeId: string;
  certificationMasterId?: string | null;
  certificationName: string;
  issuer?: string | null;
  acquiredDate: string;
  expirationDate?: string | null;
  certificateNumber?: string | null;
  notes?: string | null;
  attachment?: CertificationAttachmentDto | null;
}

export interface WorkHistorySkillDto {
  id: string;
  skillName: string;
  category?: string | null;
}

export interface WorkHistoryDto {
  id: string;
  employeeId: string;
  projectName: string;
  description?: string | null;
  role?: string | null;
  startYearMonth: string;
  endYearMonth?: string | null;
  isCurrent: boolean;
  notes?: string | null;
  skills: WorkHistorySkillDto[];
  durationMonths?: number;
}

export interface SearchResultEmployeeDto {
  id: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position?: string | null;
  role: Role;
  status: EmployeeStatus;
  matchedSkills?: {
    skillName: string;
    selfLevel: SkillLevel;
    managerLevel: SkillLevel;
  }[];
  matchedCertifications?: string[];
  totalExperienceMonths?: number;
  experienceFormatted?: string;
}

export interface DashboardStatsDto {
  totalEmployees: number;
  departmentCount: number;
  certificationsCount: number;
  certificationsDistribution: { name: string; count: number }[];
  skillLevelDistribution: {
    level: SkillLevel;
    selfCount: number;
    managerCount: number;
  }[];
  evaluationGapDistribution: {
    gap: string; // e.g. "Self > Manager", "Equal", "Manager > Self"
    count: number;
  }[];
  experienceYearsDistribution: {
    range: string; // e.g. "0-1 yr", "1-3 yrs", "3-5 yrs", "5-10 yrs", "10+ yrs"
    count: number;
  }[];
  unevaluatedSkillsCount: number;
  recentUpdatedEmployees: {
    id: string;
    name: string;
    employeeNumber: string;
    departmentName: string;
    updatedAt: string;
  }[];
}

export interface AuditLogDto {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  targetEmployeeNumber?: string | null;
  targetName?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ipAddress?: string | null;
  requestId?: string | null;
}
