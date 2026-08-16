export const APP_NAME = 'SkillMatrix';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const AUTH_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_COOKIE_NAME: 'skillmatrix_session',
  CSRF_HEADER_NAME: 'x-csrf-token',
  MIN_PASSWORD_LENGTH: 8
};

export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg'] as const,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg'
  ] as const
};

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 25,
  ALLOWED_LIMITS: [25, 50, 100] as const
};
