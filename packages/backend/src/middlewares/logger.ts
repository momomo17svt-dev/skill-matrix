import { createMiddleware } from 'hono/factory';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'initialpassword',
  'token',
  'tokenhash',
  'secret',
  'cookie',
  'authorization',
  'file',
  'filebuffer'
]);

function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function logInfo(message: string, meta: Record<string, any> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    ...maskSensitiveData(meta)
  };
  console.log(JSON.stringify(logEntry));
}

export function logError(message: string, meta: Record<string, any> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    ...maskSensitiveData(meta)
  };
  console.error(JSON.stringify(logEntry));
}

export const loggerMiddleware = () =>
  createMiddleware(async (c, next) => {
    const start = Date.now();
    const reqId = c.get('requestId');
    const method = c.req.method;
    const path = c.req.path;
    const ip = c.req.header('x-forwarded-for') || '127.0.0.1';

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    logInfo(`${method} ${path} ${status} (${duration}ms)`, {
      requestId: reqId,
      method,
      path,
      status,
      durationMs: duration,
      ip
    });
  });
