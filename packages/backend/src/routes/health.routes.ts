import { Hono } from 'hono';
import { prisma } from '../prisma.js';

import { AppEnv } from '../types/index.js';

export const healthRoutes = new Hono<AppEnv>();

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
