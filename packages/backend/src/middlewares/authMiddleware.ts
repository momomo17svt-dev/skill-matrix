import { createMiddleware } from 'hono/factory';
import cookie from 'cookie';
import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { sha256 } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { AuthSessionUser, Role } from '@skillmatrix/shared';

export const authMiddleware = (optional = false) =>
  createMiddleware(async (c, next) => {
    const authHeader = c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieHeader = c.req.header('cookie');
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
    const rawToken = bearerToken || cookies[config.session.cookieName];

    if (!rawToken) {
      if (optional) {
        return next();
      }
      throw AppError.unauthorized('認証されていません。ログインしてください。');
    }

    const tokenHash = sha256(rawToken);

    // セッションとアカウント・社員情報を取得
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        account: {
          include: {
            employee: {
              include: {
                department: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      if (optional) return next();
      throw AppError.unauthorized('セッションが無効です。再度ログインしてください。');
    }

    // 有効期限チェック
    if (new Date() > session.expiresAt) {
      // 期限切れセッションの削除
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      if (optional) return next();
      throw AppError.unauthorized('セッションの有効期限が切れました。再度ログインしてください。');
    }

    // アカウントロック状態チェック
    const account = session.account;
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      throw AppError.locked('アカウントがロックされています。管理者にお問い合わせいただくか、時間をおいて再試行してください。');
    }

    const employee = account.employee;
    const authUser: AuthSessionUser = {
      accountId: account.id,
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      nameKana: employee.nameKana,
      email: employee.email,
      departmentId: employee.departmentId,
      departmentName: employee.department.name,
      departmentCode: employee.department.code,
      position: employee.position,
      role: employee.role as Role,
      isInitialPassword: account.isInitialPassword
    };

    c.set('user', authUser);
    c.set('session', session);

    await next();
  });
