import { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logError } from './logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  const reqId = c.get('requestId') || 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logError(`AppError: ${err.message}`, { requestId: reqId, code: err.code, details: err.details, stack: err.stack });
    }
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details
        }
      },
      err.statusCode as any
    );
  }

  if (err instanceof ZodError || err.name === 'ZodError' || (err && typeof err === 'object' && 'issues' in err)) {
    const issues = ((err as any).issues || []).map((i: any) => ({
      field: Array.isArray(i.path) ? i.path.join('.') : '',
      message: i.message
    }));
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に不備があります。',
          details: issues
        }
      },
      400
    );
  }

  // 未処理の例外（SQLエラー、システム例外等）: 詳細はクライアントへ隠蔽しログにのみ記録
  logError(`Unhandled Exception: ${err.message}`, {
    requestId: reqId,
    stack: err.stack
  });

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'システム内部で予期せぬエラーが発生しました。しばらく経ってから再度お試しください。'
      }
    },
    500
  );
};
