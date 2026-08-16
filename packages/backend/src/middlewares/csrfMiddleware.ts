import { createMiddleware } from 'hono/factory';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfMiddleware = () =>
  createMiddleware(async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) {
      return next();
    }

    // 開発環境またはテスト時は origin / sec-fetch-site / custom header で保護
    const origin = c.req.header('origin') || c.req.header('referer');
    const secFetchSite = c.req.header('sec-fetch-site');

    if (secFetchSite && secFetchSite === 'cross-site') {
      throw AppError.forbidden('CSRF 検証に失敗しました (cross-site request blocked)。');
    }

    if (origin) {
      try {
        const originUrl = new URL(origin);
        const expectedOriginUrl = new URL(config.clientOrigin);
        // ホスト名が一致するか（またはlocalhost/開発中）
        if (
          originUrl.host !== expectedOriginUrl.host &&
          !originUrl.host.startsWith('localhost:') &&
          !originUrl.host.startsWith('127.0.0.1:')
        ) {
          throw AppError.forbidden('CSRF 検証に失敗しました (Invalid Origin)。');
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
      }
    }

    await next();
  });
