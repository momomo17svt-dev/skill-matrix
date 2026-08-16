import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { hashPassword, verifyPassword, generateSessionToken, sha256 } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { AuditService } from './audit.service.js';
import { AuditAction, TargetType, Role, AuthSessionUser } from '@skillmatrix/shared';

export class AuthService {
  /**
   * ログイン処理
   */
  static async login(params: {
    loginId: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): Promise<{ token: string; user: AuthSessionUser; isInitialPassword: boolean }> {
    const { loginId, password, ipAddress, userAgent, requestId } = params;

    const account = await prisma.account.findUnique({
      where: { loginId },
      include: {
        employee: {
          include: { department: true }
        }
      }
    });

    if (!account) {
      // タイミング攻撃防止のためダミーハッシュ検証相当
      await verifyPassword(password, '$2a$10$abcdefghijklmnopqrstuvwxyzeE4nOG7Dk6l6u7iH4bWv9kG5q');
      throw AppError.unauthorized('ログインIDまたはパスワードが正しくありません。');
    }

    // 1. アカウントロック確認
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((account.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw AppError.locked(`アカウントがロックされています。残り約${minutesLeft}分後に再度お試しください。`);
    }

    // 2. パスワード検証
    const isPasswordValid = await verifyPassword(password, account.passwordHash);

    if (!isPasswordValid) {
      const newAttempts = account.failedLoginAttempts + 1;
      const willLock = newAttempts >= config.auth.maxLoginAttempts;
      const lockedUntil = willLock ? new Date(Date.now() + config.auth.lockoutDurationMinutes * 60 * 1000) : null;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil
        }
      });

      await AuditService.record({
        actorId: account.employeeId,
        actorName: account.employee.name,
        action: willLock ? AuditAction.ACCOUNT_LOCKED : AuditAction.LOGIN_FAILED,
        targetType: TargetType.ACCOUNT,
        targetId: account.id,
        targetEmployeeNumber: account.employee.employeeNumber,
        targetName: account.employee.name,
        after: { failedAttempts: newAttempts, lockedUntil },
        ipAddress,
        requestId
      });

      if (willLock) {
        throw AppError.locked(`ログイン試行が${config.auth.maxLoginAttempts}回失敗したため、アカウントを15分間ロックしました。`);
      }

      throw AppError.unauthorized('ログインIDまたはパスワードが正しくありません。');
    }

    // 3. ログイン成功: 失敗カウントリセット & セッション生成
    const rawToken = generateSessionToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + config.session.expiresInHours * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      }),
      prisma.session.create({
        data: {
          accountId: account.id,
          tokenHash,
          expiresAt,
          ipAddress,
          userAgent
        }
      })
    ]);

    await AuditService.record({
      actorId: account.employeeId,
      actorName: account.employee.name,
      action: AuditAction.LOGIN_SUCCESS,
      targetType: TargetType.ACCOUNT,
      targetId: account.id,
      targetEmployeeNumber: account.employee.employeeNumber,
      targetName: account.employee.name,
      ipAddress,
      requestId
    });

    const user: AuthSessionUser = {
      accountId: account.id,
      employeeId: account.employee.id,
      employeeNumber: account.employee.employeeNumber,
      name: account.employee.name,
      nameKana: account.employee.nameKana,
      email: account.employee.email,
      departmentId: account.employee.departmentId,
      departmentName: account.employee.department.name,
      departmentCode: account.employee.department.code,
      position: account.employee.position,
      role: account.employee.role as Role,
      isInitialPassword: account.isInitialPassword
    };

    return { token: rawToken, user, isInitialPassword: account.isInitialPassword };
  }

  /**
   * ログアウト処理
   */
  static async logout(tokenHash: string, user: AuthSessionUser, ipAddress?: string, requestId?: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { tokenHash }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.LOGOUT,
      targetType: TargetType.ACCOUNT,
      targetId: user.accountId,
      targetEmployeeNumber: user.employeeNumber,
      targetName: user.name,
      ipAddress,
      requestId
    });
  }

  /**
   * パスワード変更
   */
  static async changePassword(params: {
    accountId: string;
    currentPassword?: string;
    newPassword: string;
    isInitialChange?: boolean;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<void> {
    const { accountId, currentPassword, newPassword, isInitialChange, user, ipAddress, requestId } = params;

    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw AppError.notFound('アカウントが見つかりません。');
    }

    if (!isInitialChange) {
      if (!currentPassword) {
        throw AppError.badRequest('現在のパスワードを入力してください。');
      }
      const isValid = await verifyPassword(currentPassword, account.passwordHash);
      if (!isValid) {
        throw AppError.badRequest('現在のパスワードが正しくありません。');
      }
    }

    const newHashed = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.account.update({
        where: { id: accountId },
        data: {
          passwordHash: newHashed,
          isInitialPassword: false
        }
      }),
      prisma.passwordHistory.create({
        data: {
          accountId,
          passwordHash: newHashed
        }
      })
    ]);

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.PASSWORD_CHANGE,
      targetType: TargetType.ACCOUNT,
      targetId: accountId,
      targetEmployeeNumber: user.employeeNumber,
      targetName: user.name,
      ipAddress,
      requestId
    });
  }

  /**
   * 管理者によるパスワードリセット (ADMINのみ)
   */
  static async adminResetPassword(params: {
    targetAccountId: string;
    newPassword: string;
    adminUser: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<void> {
    const { targetAccountId, newPassword, adminUser, ipAddress, requestId } = params;

    const account = await prisma.account.findUnique({
      where: { id: targetAccountId },
      include: { employee: true }
    });

    if (!account) {
      throw AppError.notFound('対象のアカウントが見つかりません。');
    }

    const newHashed = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.account.update({
        where: { id: targetAccountId },
        data: {
          passwordHash: newHashed,
          isInitialPassword: true, // 次回強制変更
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      }),
      prisma.passwordHistory.create({
        data: {
          accountId: targetAccountId,
          passwordHash: newHashed
        }
      }),
      // 既存セッションを全無効化
      prisma.session.deleteMany({
        where: { accountId: targetAccountId }
      })
    ]);

    await AuditService.record({
      actorId: adminUser.employeeId,
      actorName: adminUser.name,
      action: AuditAction.PASSWORD_RESET,
      targetType: TargetType.ACCOUNT,
      targetId: targetAccountId,
      targetEmployeeNumber: account.employee.employeeNumber,
      targetName: account.employee.name,
      after: { isInitialPassword: true, unlocked: true },
      ipAddress,
      requestId
    });
  }
}
