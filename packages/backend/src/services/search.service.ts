import { prisma } from '../prisma.js';
import {
  AuthSessionUser,
  Role,
  EmployeeStatus,
  SkillLevel,
  SearchResultEmployeeDto,
  PaginatedResult,
  calculateMergedMonths,
  formatExperience
} from '@skillmatrix/shared';

export interface SearchQueryParams {
  page: number;
  limit: number;
  filter?: {
    name?: string;
    employeeNumber?: string;
    departmentId?: string;
    includeSubDepartments?: boolean;
    position?: string;
    certificationName?: string;
    skillId?: string;
    skillName?: string;
    selfLevel?: SkillLevel;
    managerLevel?: SkillLevel;
    minExperienceYears?: number;
    usedTechnology?: string;
    status?: EmployeeStatus;
  };
}

export class SearchService {
  /**
   * 複合条件による人材検索 (Server-side pagination)
   */
  static async search(
    user: AuthSessionUser,
    params: SearchQueryParams
  ): Promise<PaginatedResult<SearchResultEmployeeDto>> {
    const { page, limit, filter = {} } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. 権限スコープ絞り込み
    if (user.role === Role.DEPARTMENT_MANAGER) {
      const managerDept = await prisma.department.findUnique({ where: { id: user.departmentId } });
      if (managerDept) {
        where.department = { path: { startsWith: managerDept.path } };
      }
    } else if (user.role === Role.GENERAL) {
      where.departmentId = user.departmentId;
    }

    // 2. 基本フィルター
    if (filter.name) {
      where.OR = [
        { name: { contains: filter.name } },
        { nameKana: { contains: filter.name } }
      ];
    }
    if (filter.employeeNumber) {
      where.employeeNumber = { contains: filter.employeeNumber };
    }
    if (filter.position) {
      where.position = { contains: filter.position };
    }
    if (filter.status) {
      where.status = filter.status;
    }

    // 3. 部署フィルター
    if (filter.departmentId) {
      if (filter.includeSubDepartments !== false) {
        const targetDept = await prisma.department.findUnique({ where: { id: filter.departmentId } });
        if (targetDept) {
          where.department = { path: { startsWith: targetDept.path } };
        }
      } else {
        where.departmentId = filter.departmentId;
      }
    }

    // 4. 資格フィルター
    if (filter.certificationName) {
      where.certifications = {
        some: {
          OR: [
            { master: { name: { contains: filter.certificationName } } },
            { customCertificationName: { contains: filter.certificationName } }
          ]
        }
      };
    }

    // 5. スキル・評価フィルター
    if (filter.skillId || filter.skillName || filter.selfLevel || filter.managerLevel) {
      const evalCondition: any = {};
      if (filter.skillId) evalCondition.skillId = filter.skillId;
      if (filter.skillName) {
        evalCondition.skill = { name: { contains: filter.skillName } };
      }
      if (filter.selfLevel) evalCondition.selfLevel = filter.selfLevel;
      if (filter.managerLevel) evalCondition.managerLevel = filter.managerLevel;

      where.evaluations = { some: evalCondition };
    }

    // 6. 使用技術フィルター
    if (filter.usedTechnology) {
      where.workHistories = {
        some: {
          skills: {
            some: {
              skillName: { contains: filter.usedTechnology }
            }
          }
        }
      };
    }

    // 7. 社員候補の取得
    const candidateEmployees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        certifications: {
          include: { master: true }
        },
        evaluations: {
          include: { skill: true }
        },
        workHistories: {
          include: { skills: true }
        }
      },
      orderBy: { employeeNumber: 'asc' }
    });

    // 8. 実務経験年数 (Union計算) フィルタリング
    let matchedEmployees = candidateEmployees.map((emp) => {
      // 全実務経歴の期間Union
      let relevantHistories = emp.workHistories;
      if (filter.usedTechnology) {
        const searchTech = filter.usedTechnology.toLowerCase();
        relevantHistories = emp.workHistories.filter((w) =>
          w.skills.some((s) => s.skillName.toLowerCase().includes(searchTech))
        );
      }

      const intervals = relevantHistories.map((h) => ({
        startYearMonth: h.startYearMonth,
        endYearMonth: h.endYearMonth,
        isCurrent: h.isCurrent
      }));

      const unionResult = calculateMergedMonths(intervals);
      const exp = formatExperience(unionResult.totalMonths);

      const matchedSkills = emp.evaluations.map((ev) => ({
        skillName: ev.skill.name,
        selfLevel: ev.selfLevel as SkillLevel,
        managerLevel: ev.managerLevel as SkillLevel
      }));

      const matchedCertifications = emp.certifications.map((c) =>
        c.master ? c.master.name : c.customCertificationName || '資格'
      );

      return {
        id: emp.id,
        employeeNumber: emp.employeeNumber,
        name: emp.name,
        nameKana: emp.nameKana,
        email: emp.email,
        departmentId: emp.departmentId,
        departmentName: emp.department.name,
        position: emp.position,
        role: emp.role as Role,
        status: emp.status as EmployeeStatus,
        matchedSkills,
        matchedCertifications,
        totalExperienceMonths: unionResult.totalMonths,
        experienceFormatted: exp.formatted,
        decimalYears: exp.decimalYears
      };
    });

    if (filter.minExperienceYears !== undefined && filter.minExperienceYears > 0) {
      matchedEmployees = matchedEmployees.filter(
        (emp) => emp.decimalYears >= filter.minExperienceYears!
      );
    }

    const total = matchedEmployees.length;
    const pagedItems = matchedEmployees.slice(skip, skip + limit);

    return {
      items: pagedItems.map(({ decimalYears, ...rest }) => rest),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + pagedItems.length < total
      }
    };
  }
}
