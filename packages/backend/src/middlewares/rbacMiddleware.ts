import { createMiddleware } from 'hono/factory';
import { AuthSessionUser, Role } from '@skillmatrix/shared';
import { AppError } from '../utils/errors.js';
import { prisma } from '../prisma.js';

/**
 * 許可されたロールのいずれかを保持しているか検証します
 */
export const requireRoles = (allowedRoles: Role[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user') as AuthSessionUser | undefined;
    if (!user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(user.role)) {
      throw AppError.forbidden(`この操作には以下のいずれかの権限が必要です: ${allowedRoles.join(', ')}`);
    }

    await next();
  });

/**
 * 対象社員に対するアクセス権限（自身、自部署、または配下部署）を検証し、IDORを防止します
 */
export async function assertCanAccessEmployee(
  currentUser: AuthSessionUser,
  targetEmployeeId: string,
  mode: 'read' | 'write'
): Promise<void> {
  // 1. ADMIN は全アクセス許可
  if (currentUser.role === Role.ADMIN) {
    return;
  }

  // 2. 本人自身のアクセス
  if (currentUser.employeeId === targetEmployeeId) {
    return;
  }

  // 3. 対象社員の部署情報を取得
  const targetEmployee = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    include: { department: true }
  });

  if (!targetEmployee) {
    throw AppError.notFound('対象の社員が見つかりません。');
  }

  // 4. DEPARTMENT_MANAGER の場合: 自身の部署および配下の全子孫部署であればアクセス可能
  if (currentUser.role === Role.DEPARTMENT_MANAGER) {
    const managerDept = await prisma.department.findUnique({
      where: { id: currentUser.departmentId }
    });

    if (managerDept && targetEmployee.department.path.startsWith(managerDept.path)) {
      return;
    }
    throw AppError.forbidden('管轄外の部署に所属する社員の情報にはアクセスできません。');
  }

  // 5. GENERAL の場合:
  if (currentUser.role === Role.GENERAL) {
    if (mode === 'read') {
      // 閲覧は同一直属部署（departmentId一致）のみ許可
      if (currentUser.departmentId === targetEmployee.departmentId) {
        return;
      }
      throw AppError.forbidden('同一の直属部署以外の社員情報は閲覧できません。');
    } else {
      // GENERAL による他人の編集は一切禁止
      throw AppError.forbidden('他の社員の情報を編集する権限はありません。');
    }
  }

  throw AppError.forbidden();
}
