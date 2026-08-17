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

import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = new Hono<AppEnv>();

  // 1. グローバルミドルウェア
  app.use('*', requestId());
  app.use('*', loggerMiddleware());
  app.use('*', securityHeaders());

  // CORS設定 (開発/本番・任意のポートおよび同一オリジンに対応)
  app.use(
    '*',
    cors({
      origin: (origin, c) => {
        if (!origin) return '*';
        // 同一オリジンまたはローカルホスト（ポート不問）を許可
        if (
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin === config.clientOrigin
        ) {
          return origin;
        }
        return config.clientOrigin;
      },
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

  // 3. フロントエンド静的配信 (Docker/Production環境)
  const frontendDistCandidates = [
    path.resolve(process.cwd(), 'packages/frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
    '/app/packages/frontend/dist'
  ];

  let frontendDistPath: string | null = null;
  for (const candidate of frontendDistCandidates) {
    if (fs.existsSync(candidate)) {
      frontendDistPath = candidate;
      break;
    }
  }

  if (frontendDistPath) {
    const distRoot = frontendDistPath;
    app.use('/assets/*', serveStatic({ root: path.relative(process.cwd(), distRoot) }));
    app.use('/favicon.ico', serveStatic({ path: path.join(path.relative(process.cwd(), distRoot), 'favicon.ico') }));
    
    // SPA 配信
    const serveIndex = (c: any) => {
      const indexPath = path.join(distRoot, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf-8');
        return c.html(html);
      }
      return c.notFound();
    };

    app.get('/', serveIndex);
    app.get('*', serveIndex);
  }

  // 4. グローバルエラーハンドリング
  app.onError(errorHandler);

  return app;
}
