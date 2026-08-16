import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from './middlewares/requestId.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { securityHeaders } from './middlewares/securityHeaders.js';
import { csrfMiddleware } from './middlewares/csrfMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { config } from './config/index.js';

import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { departmentRoutes } from './routes/department.routes.js';
import { employeeRoutes } from './routes/employee.routes.js';
import { skillRoutes } from './routes/skill.routes.js';
import { certificationRoutes } from './routes/certification.routes.js';
import { workHistoryRoutes } from './routes/workHistory.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { auditRoutes } from './routes/audit.routes.js';

import { AppEnv } from './types/index.js';

export function createApp() {
  const app = new Hono<AppEnv>();

  // 1. グローバルミドルウェア
  app.use('*', requestId());
  app.use('*', loggerMiddleware());
  app.use('*', securityHeaders());

  // CORS設定 (開発/本番)
  app.use(
    '*',
    cors({
      origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
  );

  app.use('*', csrfMiddleware());

  // 2. ルートマウント
  // ヘルスチェック (認証不要)
  app.route('/', healthRoutes);

  // API v1
  app.route('/api/v1/auth', authRoutes);
  app.route('/api/v1/departments', departmentRoutes);
  app.route('/api/v1/employees', employeeRoutes);
  app.route('/api/v1/skills', skillRoutes);
  app.route('/api/v1/certifications', certificationRoutes);
  app.route('/api/v1/work-histories', workHistoryRoutes);
  app.route('/api/v1/search', searchRoutes);
  app.route('/api/v1/dashboard', dashboardRoutes);
  app.route('/api/v1/audit-logs', auditRoutes);

  // 3. グローバルエラーハンドリング
  app.onError(errorHandler);

  return app;
}
