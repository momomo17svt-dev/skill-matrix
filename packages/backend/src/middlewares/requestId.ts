import { createMiddleware } from 'hono/factory';
import crypto from 'crypto';

export const requestId = () =>
  createMiddleware(async (c, next) => {
    const existingId = c.req.header('x-request-id');
    const reqId = existingId || crypto.randomUUID();
    c.set('requestId', reqId);
    c.header('x-request-id', reqId);
    await next();
  });
