import { Hono } from 'hono';
import { SearchService } from '../services/search.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { SearchQuerySchema, AuthSessionUser } from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const searchRoutes = new Hono<AppEnv>();

searchRoutes.use('*', authMiddleware());

// 複合条件検索
searchRoutes.post('/', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = SearchQuerySchema.parse(body);

  const result = await SearchService.search(user, {
    page: validated.page,
    limit: validated.limit,
    filter: validated.filter
  });

  return c.json({
    success: true,
    data: result
  });
});
