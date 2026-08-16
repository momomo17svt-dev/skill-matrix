import { Hono } from 'hono';
import { prisma } from '../prisma.js';

import { AppEnv } from '../types/index.js';

export const healthRoutes = new Hono<AppEnv>();

// ルート情報
healthRoutes.get('/', (c) => {
  return c.json({
    app: 'SkillMatrix API Server',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1',
    frontend: 'http://localhost:5173',
    endpoints: {
      health: '/health',
      ready: '/ready',
      auth: '/api/v1/auth',
      employees: '/api/v1/employees',
      departments: '/api/v1/departments',
      skills: '/api/v1/skills',
      certifications: '/api/v1/certifications',
      workHistories: '/api/v1/work-histories',
      search: '/api/v1/search',
      dashboard: '/api/v1/dashboard',
      auditLogs: '/api/v1/audit-logs'
    }
  });
});

// プロセス稼働確認
healthRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 依存リソース（DB等）稼働確認
healthRoutes.get('/ready', async (c) => {
  try {
    // DB疎通確認
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      components: {
        database: 'connected'
      }
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      503
    );
  }
});
