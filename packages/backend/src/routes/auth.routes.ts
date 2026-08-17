import { Hono } from 'hono';
import cookie from 'cookie';
import { AuthService } from '../services/auth.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { config } from '../config/index.js';
import {
  LoginRequestSchema,
  ChangePasswordRequestSchema,
  InitialPasswordChangeRequestSchema,
  AdminResetPasswordRequestSchema,
  Role,
  AuthSessionUser
} from '@skillmatrix/shared';
import { sha256 } from '../utils/crypto.js';
import { AppEnv } from '../types/index.js';

export const authRoutes = new Hono<AppEnv>();

// ログイン
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const validated = LoginRequestSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const userAgent = c.req.header('user-agent') || 'Unknown';
  const requestId = c.get('requestId');

  const { token, user, isInitialPassword } = await AuthService.login({
    loginId: validated.loginId,
    password: validated.password,
    ipAddress: ip,
    userAgent,
    requestId
  });

  // Cookie設定
  const cookieStr = cookie.serialize(config.session.cookieName, token, {
    httpOnly: true,
    secure: config.session.secure,
    ...(config.session.secure ? { sameSite: 'lax' as const } : {}),
    path: '/',
    maxAge: config.session.expiresInHours * 3600
  });

  c.header('Set-Cookie', cookieStr);

  return c.json({
    success: true,
    data: {
      token,
      user,
      isInitialPassword
    }
  });
});

// ログアウト
authRoutes.post('/logout', authMiddleware(), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const cookieHeader = c.req.header('cookie');
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const rawToken = cookies[config.session.cookieName];
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  if (rawToken) {
    await AuthService.logout(sha256(rawToken), user, ip, requestId);
  }

  // Cookie消去
  const clearCookie = cookie.serialize(config.session.cookieName, '', {
    httpOnly: true,
    secure: config.session.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  c.header('Set-Cookie', clearCookie);

  return c.json({
    success: true,
    data: { message: 'ログアウトしました。' }
  });
});

// 現在ログイン中のユーザー取得
authRoutes.get('/me', authMiddleware(), (c) => {
  const user = c.get('user') as AuthSessionUser;
  return c.json({
    success: true,
    data: { user }
  });
});

// 自身のパスワード変更
authRoutes.post('/change-password', authMiddleware(), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = ChangePasswordRequestSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await AuthService.changePassword({
    accountId: user.accountId,
    currentPassword: validated.currentPassword,
    newPassword: validated.newPassword,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: { message: 'パスワードを変更しました。' }
  });
});

// 初回パスワード強制変更
authRoutes.post('/initial-password-change', authMiddleware(), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = InitialPasswordChangeRequestSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await AuthService.changePassword({
    accountId: user.accountId,
    newPassword: validated.newPassword,
    isInitialChange: true,
    user,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: { message: '初期パスワードを変更しました。' }
  });
});

// 管理者によるパスワードリセット (ADMINのみ)
authRoutes.post('/reset-password', authMiddleware(), requireRoles([Role.ADMIN]), async (c) => {
  const adminUser = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = AdminResetPasswordRequestSchema.parse(body);
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await AuthService.adminResetPassword({
    targetAccountId: validated.accountId,
    newPassword: validated.newPassword,
    adminUser,
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: { message: 'パスワードをリセットしました。次回ログイン時に変更が要求されます。' }
  });
});
