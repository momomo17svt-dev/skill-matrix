import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { hashPassword } from '../utils/crypto.js';
import { fileStorage } from '../utils/fileStorage.js';
import {
  AuthSessionUser,
  Role,
  EmployeeStatus,
  SkillLevel,
  EvaluationType,
  AuditAction,
  TargetType,
  EmployeeListItemDto,
  EmployeeDetailDto,
  PaginatedResult
} from '@skillmatrix/shared';
import { AuditService } from './audit.service.js';

export interface IEmployeeRepository {
  findById(id: string): Promise<any>;
  findByNumber(employeeNumber: string): Promise<any>;
}

export class EmployeeService {
  /**
   * 社員一覧取得 (サーバーサイドページネーション & スコープ制御)
   */
  static async list(
    user: AuthSessionUser,
    params: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      departmentId?: string;
      status?: string;
      role?: string;
    }
  ): Promise<PaginatedResult<EmployeeListItemDto>> {
    const { page, limit, sortBy = 'employeeNumber', sortOrder = 'asc', search, departmentId, status, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. 権限スコープ絞り込み
    if (user.role === Role.DEPARTMENT_MANAGER) {
      const managerDept = await prisma.department.findUnique({ where: { id: user.departmentId } });
      if (managerDept) {
        where.department = {
          path: { startsWith: managerDept.path }
        };
      }
    } else if (user.role === Role.GENERAL) {
      where.departmentId = user.departmentId;
    }

    // 2. フィルター条件
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameKana: { contains: search } },
        { employeeNumber: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // 3. ソート順
    const orderBy: any = {};
    if (sortBy === 'department') {
      orderBy.department = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          department: true,
          _count: {
            select: {
              certifications: true,
              workHistories: true
            }
          }
        }
      })
    ]);

    const items: EmployeeListItemDto[] = employees.map((e) => ({
      id: e.id,
      employeeNumber: e.employeeNumber,
      name: e.name,
      nameKana: e.nameKana,
      email: e.email,
      departmentId: e.departmentId,
      departmentName: e.department.name,
      position: e.position,
      role: e.role as Role,
      hireDate: e.hireDate.toISOString().split('T')[0],
      status: e.status as EmployeeStatus,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      certificationsCount: e._count.certifications,
      workHistoriesCount: e._count.workHistories
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total
      }
    };
  }

  /**
   * 社員詳細取得 (基本情報, 資格, 経歴, 部署スキル評価マトリクス)
   */
  static async getById(id: string): Promise<EmployeeDetailDto> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        certifications: {
          include: {
            master: true,
            attachment: true
          },
          orderBy: { acquiredDate: 'desc' }
        },
        workHistories: {
          include: {
            skills: true
          },
          orderBy: { startYearMonth: 'desc' }
        },
        evaluations: {
          include: {
            skill: {
              include: { category: true }
            }
          }
        }
      }
    });

    if (!employee) {
      throw AppError.notFound('社員が見つかりません。');
    }

    // 該当部署に定義されている全スキルを取得し、マトリクスを生成
    const departmentSkills = await prisma.skill.findMany({
      where: { departmentId: employee.departmentId },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }]
    });

    const evalMap = new Map(employee.evaluations.map((ev) => [ev.skillId, ev]));

    // 上長評価者名を取得
    const managerEvaluatorIds = Array.from(
      new Set(employee.evaluations.map((ev) => ev.managerEvaluatorId).filter((id): id is string => Boolean(id)))
    );
    const evaluators = await prisma.employee.findMany({
      where: { id: { in: managerEvaluatorIds } },
      select: { id: true, name: true }
    });
    const evaluatorNameMap = new Map(evaluators.map((ev) => [ev.id, ev.name]));

    const skillsMatrix = departmentSkills.map((sk) => {
      const evaluation = evalMap.get(sk.id);
      return {
        skillId: sk.id,
        skillName: sk.name,
        categoryId: sk.categoryId,
        categoryName: sk.category.name,
        selfLevel: (evaluation?.selfLevel || SkillLevel.UNEVALUATED) as SkillLevel,
        managerLevel: (evaluation?.managerLevel || SkillLevel.UNEVALUATED) as SkillLevel,
        selfEvaluatedAt: evaluation?.selfEvaluatedAt?.toISOString() || null,
        managerEvaluatedAt: evaluation?.managerEvaluatedAt?.toISOString() || null,
        managerEvaluatorName: evaluation?.managerEvaluatorId ? evaluatorNameMap.get(evaluation.managerEvaluatorId) || null : null
      };
    });

    return {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      nameKana: employee.nameKana,
      email: employee.email,
      departmentId: employee.departmentId,
      departmentName: employee.department.name,
      departmentPath: employee.department.path,
      position: employee.position,
      role: employee.role as Role,
      hireDate: employee.hireDate.toISOString().split('T')[0],
      status: employee.status as EmployeeStatus,
      notes: employee.notes,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
      certifications: employee.certifications.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        certificationMasterId: c.certificationMasterId,
        certificationName: c.master ? c.master.name : c.customCertificationName || '不明な資格',
        issuer: c.master?.issuer || null,
        acquiredDate: c.acquiredDate.toISOString().split('T')[0],
        expirationDate: c.expirationDate ? c.expirationDate.toISOString().split('T')[0] : null,
        certificateNumber: c.certificateNumber,
        notes: c.notes,
        attachment: c.attachment
          ? {
              id: c.attachment.id,
              originalFileName: c.attachment.originalFileName,
              fileSize: c.attachment.fileSize,
              mimeType: c.attachment.mimeType,
              createdAt: c.attachment.createdAt.toISOString()
            }
          : null
      })),
      workHistories: employee.workHistories.map((w) => ({
        id: w.id,
        employeeId: w.employeeId,
        projectName: w.projectName,
        description: w.description,
        role: w.role,
        startYearMonth: w.startYearMonth,
        endYearMonth: w.endYearMonth,
        isCurrent: w.isCurrent,
        notes: w.notes,
        skills: w.skills.map((s) => ({
          id: s.id,
          skillName: s.skillName,
          category: s.category
        }))
      })),
      skills: skillsMatrix
    };
  }

  /**
   * 社員新規登録 (ADMINのみ)
   */
  static async create(params: {
    employeeNumber: string;
    name: string;
    nameKana: string;
    email: string;
    departmentId: string;
    position?: string | null;
    role: Role;
    hireDate: string;
    status: EmployeeStatus;
    notes?: string | null;
    initialPassword?: string;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }) {
    const {
      employeeNumber,
      name,
      nameKana,
      email,
      departmentId,
      position,
      role,
      hireDate,
      status,
      notes,
      initialPassword = 'ChangeMe123!',
      user,
      ipAddress,
      requestId
    } = params;

    const existingNumber = await prisma.employee.findUnique({ where: { employeeNumber } });
    if (existingNumber) {
      throw AppError.conflict(`社員番号 "${employeeNumber}" は既に登録されています。`);
    }

    const existingEmail = await prisma.employee.findUnique({ where: { email } });
    if (existingEmail) {
      throw AppError.conflict(`メールアドレス "${email}" は既に登録されています。`);
    }

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw AppError.badRequest('指定された部署が存在しません。');
    }

    const passwordHash = await hashPassword(initialPassword);

    const created = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          employeeNumber,
          name,
          nameKana,
          email,
          departmentId,
          position: position || null,
          role,
          hireDate: new Date(hireDate),
          status,
          notes: notes || null
        },
        include: { department: true }
      });

      await tx.account.create({
        data: {
          employeeId: emp.id,
          loginId: employeeNumber, // 初期ログインIDは社員番号
          passwordHash,
          isInitialPassword: true
        }
      });

      return emp;
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.EMPLOYEE_CREATE,
      targetType: TargetType.EMPLOYEE,
      targetId: created.id,
      targetEmployeeNumber: created.employeeNumber,
      targetName: created.name,
      after: created,
      ipAddress,
      requestId
    });

    return created;
  }

  /**
   * 社員情報更新
   */
  static async update(
    id: string,
    params: {
      name?: string;
      nameKana?: string;
      email?: string;
      departmentId?: string;
      position?: string | null;
      role?: Role;
      hireDate?: string;
      status?: EmployeeStatus;
      notes?: string | null;
      user: AuthSessionUser;
      ipAddress?: string;
      requestId?: string;
    }
  ) {
    const { name, nameKana, email, departmentId, position, role, hireDate, status, notes, user, ipAddress, requestId } = params;

    const current = await prisma.employee.findUnique({ where: { id } });
    if (!current) {
      throw AppError.notFound('社員が見つかりません。');
    }

    // GENERAL本人の場合の更新制限（システム権限の自己昇格は不可）
    if (user.role === Role.GENERAL && user.employeeId === id) {
      if (role && role !== current.role) {
        throw AppError.forbidden('一般ユーザーはシステム権限を変更できません。');
      }
    }

    if (email && email !== current.email) {
      const existingEmail = await prisma.employee.findUnique({ where: { email } });
      if (existingEmail) throw AppError.conflict('そのメールアドレスは既に使用されています。');
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name: name || undefined,
        nameKana: nameKana || undefined,
        email: email || undefined,
        departmentId: departmentId || undefined,
        position: position !== undefined ? position : undefined,
        role: role || undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined
      },
      include: { department: true }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.EMPLOYEE_UPDATE,
      targetType: TargetType.EMPLOYEE,
      targetId: id,
      targetEmployeeNumber: updated.employeeNumber,
      targetName: updated.name,
      before: current,
      after: updated,
      ipAddress,
      requestId
    });

    return updated;
  }

  /**
   * 社員物理削除 (ADMINのみ & トランザクション対応 & ファイル安全削除)
   */
  static async delete(id: string, user: AuthSessionUser, ipAddress?: string, requestId?: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        certifications: {
          include: { attachment: true }
        }
      }
    });

    if (!employee) {
      throw AppError.notFound('社員が見つかりません。');
    }

    if (employee.id === user.employeeId) {
      throw AppError.badRequest('ログイン中の自分自身のアカウントを削除することはできません。');
    }

    // 削除対象となる物理ファイル名を事前収集
    const filesToDelete: string[] = [];
    employee.certifications.forEach((c) => {
      if (c.attachment?.storedFileName) {
        filesToDelete.push(c.attachment.storedFileName);
      }
    });

    // DBトランザクションで物理削除（カスケード設定により関連レコードも全削除）
    await prisma.$transaction(async (tx) => {
      await tx.employee.delete({
        where: { id }
      });
    });

    // DBコミット完了後に物理ファイルを安全に削除（補償トランザクション）
    for (const storedFileName of filesToDelete) {
      await fileStorage.deleteFile(storedFileName);
    }

    // 監査ログを記録（社員が削除された後もログと対象者スナップショットは保持）
    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.EMPLOYEE_DELETE,
      targetType: TargetType.EMPLOYEE,
      targetId: id,
      targetEmployeeNumber: employee.employeeNumber,
      targetName: employee.name,
      before: {
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        email: employee.email,
        departmentId: employee.departmentId,
        role: employee.role
      },
      ipAddress,
      requestId
    });
  }
}
