export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = '認証が必要です。', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'アクセス権限がありません。', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static notFound(message = 'リソースが見つかりません。', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new AppError(409, code, message);
  }

  static locked(message = 'アカウントがロックされています。', code = 'ACCOUNT_LOCKED') {
    return new AppError(423, code, message);
  }

  static internal(message = 'サーバー内部でエラーが発生しました。', code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    return new AppError(500, code, message, details);
  }
}
