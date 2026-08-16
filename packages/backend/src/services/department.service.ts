import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { DepartmentDto, AuthSessionUser, Role, AuditAction, TargetType } from '@skillmatrix/shared';
import { AuditService } from './audit.service.js';

export class DepartmentService {
  /**
   * 部署ツリーまたはフラットリストを取得します
   */
  static async getTree(user: AuthSessionUser): Promise<DepartmentDto[]> {
    const allDepts = await prisma.department.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    const dtoList: DepartmentDto[] = allDepts.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      parentId: d.parentId,
      path: d.path,
      level: d.level,
      sortOrder: d.sortOrder,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      employeeCount: d._count.employees
    }));

    // ツリー構造へ変換
    const deptMap = new Map<string, DepartmentDto>();
    dtoList.forEach((d) => deptMap.set(d.id, { ...d, children: [] }));

    const rootDepts: DepartmentDto[] = [];

    dtoList.forEach((d) => {
      const node = deptMap.get(d.id)!;
      if (d.parentId && deptMap.has(d.parentId)) {
        deptMap.get(d.parentId)!.children!.push(node);
      } else {
        rootDepts.push(node);
      }
    });

    // ロールに応じたスコープ絞り込み
    if (user.role === Role.ADMIN) {
      return rootDepts;
    } else if (user.role === Role.DEPARTMENT_MANAGER) {
      const managerDeptNode = deptMap.get(user.departmentId);
      return managerDeptNode ? [managerDeptNode] : [];
    } else {
      const directDeptNode = deptMap.get(user.departmentId);
      return directDeptNode ? [{ ...directDeptNode, children: [] }] : [];
    }
  }

  /**
   * 部署を作成します (ADMINのみ)
   */
  static async create(params: {
    code: string;
    name: string;
    parentId?: string | null;
    sortOrder?: number;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<DepartmentDto> {
    const { code, name, parentId, sortOrder = 0, user, ipAddress, requestId } = params;

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      throw AppError.conflict(`部署コード "${code}" は既に使用されています。`);
    }

    let path = `/${code}`;
    let level = 1;

    if (parentId) {
      const parent = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw AppError.badRequest('指定された親部署が存在しません。');
      }
      path = `${parent.path}/${code}`;
      level = parent.level + 1;
    }

    const created = await prisma.department.create({
      data: {
        code,
        name,
        parentId: parentId || null,
        path,
        level,
        sortOrder
      }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.DEPARTMENT_CREATE,
      targetType: TargetType.DEPARTMENT,
      targetId: created.id,
      targetName: created.name,
      after: created,
      ipAddress,
      requestId
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      parentId: created.parentId,
      path: created.path,
      level: created.level,
      sortOrder: created.sortOrder,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };
  }

  /**
   * 部署を更新します (ADMINのみ)
   */
  static async update(
    id: string,
    params: {
      code?: string;
      name?: string;
      parentId?: string | null;
      sortOrder?: number;
      user: AuthSessionUser;
      ipAddress?: string;
      requestId?: string;
    }
  ): Promise<DepartmentDto> {
    const { code, name, parentId, sortOrder, user, ipAddress, requestId } = params;

    const current = await prisma.department.findUnique({ where: { id } });
    if (!current) {
      throw AppError.notFound('部署が見つかりません。');
    }

    if (parentId === id) {
      throw AppError.badRequest('自分自身を親部署に指定することはできません。');
    }

    let newPath = current.path;
    let newLevel = current.level;
    const targetCode = code || current.code;

    if (parentId !== undefined && parentId !== current.parentId) {
      if (parentId) {
        const newParent = await prisma.department.findUnique({ where: { id: parentId } });
        if (!newParent) throw AppError.badRequest('親部署が存在しません。');
        if (newParent.path.startsWith(current.path)) {
          throw AppError.badRequest('配下の部署を親部署に指定することはできません。');
        }
        newPath = `${newParent.path}/${targetCode}`;
        newLevel = newParent.level + 1;
      } else {
        newPath = `/${targetCode}`;
        newLevel = 1;
      }
    } else if (code && code !== current.code) {
      const parentPath = current.path.substring(0, current.path.lastIndexOf('/'));
      newPath = `${parentPath}/${code}`;
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        code: code || undefined,
        name: name || undefined,
        parentId: parentId !== undefined ? parentId : undefined,
        path: newPath,
        level: newLevel,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined
      }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.DEPARTMENT_UPDATE,
      targetType: TargetType.DEPARTMENT,
      targetId: id,
      targetName: updated.name,
      before: current,
      after: updated,
      ipAddress,
      requestId
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      parentId: updated.parentId,
      path: updated.path,
      level: updated.level,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  }

  /**
   * 部署を削除します (ADMINのみ)
   */
  static async delete(id: string, user: AuthSessionUser, ipAddress?: string, requestId?: string): Promise<void> {
    const current = await prisma.department.findUnique({
      where: { id },
      include: {
        children: true,
        employees: true
      }
    });

    if (!current) {
      throw AppError.notFound('部署が見つかりません。');
    }

    if (current.children.length > 0) {
      throw AppError.badRequest('子部署が存在するため削除できません。先に子部署を移動または削除してください。');
    }

    if (current.employees.length > 0) {
      throw AppError.badRequest('所属社員が存在するため削除できません。先に社員の所属部署を変更してください。');
    }

    await prisma.department.delete({ where: { id } });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.DEPARTMENT_DELETE,
      targetType: TargetType.DEPARTMENT,
      targetId: id,
      targetName: current.name,
      before: current,
      ipAddress,
      requestId
    });
  }
}
